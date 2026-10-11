"use client";

import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useCallback, useEffect, useRef, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useNotifications } from "@/hooks/use-notifications"

interface DecodedToken {
  userId?: number;
  /** The auth JWT carries the account id as `id`. */
  id?: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  iat: number;
  exp: number;
}

/** How long to wait for the client token before failing the initialisation. */
const CLIENT_TOKEN_TIMEOUT_MS = 24000;

/** Paddle.js is initialised once per page, so the instance is shared. */
let paddleCache: { instance: Paddle } | null = null;

async function fetchWithTimeout(url: string, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Read the routing metadata Paddle returns on an event. It sits either on the
 * transaction or - for price-level data - inside the first line item, exactly
 * like the webhook handler expects.
 */
function readPaddleCustomData(event: any): Record<string, any> | null {
  const direct = event?.data?.custom_data;
  if (direct && typeof direct === "object") return direct;
  const items = Array.isArray(event?.data?.items) ? event.data.items : [];
  for (const item of items) {
    const nested = item?.price?.custom_data;
    if (nested && typeof nested === "object") return nested;
  }
  return null;
}

function describePaddleError(event: any): string {
  const detail =
    event?.data?.error?.detail ||
    event?.data?.error?.message ||
    event?.data?.message ||
    event?.error?.detail;
  return typeof detail === "string" && detail.trim() ? detail : "Paddle reported a checkout error.";
}

export default function usePaddle() {
  // A second call to Paddle.js on the same page is not supported, so an
  // already-initialised instance is reused instead of re-initialising.
  const cached = typeof window !== "undefined" ? paddleCache : null;
  const [paddle, setPaddle] = useState<Paddle | undefined>(cached?.instance);
  const [loading, setLoading] = useState(!cached);
  // Non-null only when Paddle itself could not start. The checkout uses this to
  // hand the customer to the next provider instead of spinning forever.
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const { addNotification } = useNotifications()
  const paddleRef = useRef<Paddle | undefined>(cached?.instance);

  const reload = useCallback(() => {
    paddleRef.current = undefined;
    paddleCache = null;
    setPaddle(undefined);
    setError(null);
    setLoading(true);
    setReloadKey((key) => key + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const fetchClientToken = async () => {
      // A hung request here used to leave the button on "Processing..."
      // forever, because `loading` was never cleared.
      const response = await fetchWithTimeout("/api/paddle/client-token", CLIENT_TOKEN_TIMEOUT_MS);
      const data = await response.json().catch(() => null);
      return data?.clientToken ?? null;
    };

    const fetchEnvironment = async () => {
      try {
        const response = await fetchWithTimeout("/api/paddle/environment", CLIENT_TOKEN_TIMEOUT_MS);
        const data = await response.json();
        return data.environment;
      } catch (error) {
        console.error("Error fetching environment:", error);
        return "sandbox"; // Default to sandbox on error
      }
    };

    // Keep the option to leave the Paddle overlay and try the next provider on
    // record when the payment cannot be verified server-side.
    const updateQuoteWithoutVerification = (quoteId: any, transactionId: any, user: DecodedToken | null) => {
      const storedQuoteData = localStorage.getItem("quoteData");
      if (!storedQuoteData) return;

      const quoteData = JSON.parse(storedQuoteData);
      fetch(`/api/quotes/${quoteId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          {
            PaymentStatus: "paid",
            PaymentMethod: "paddle",
            PaymentIntentId: transactionId,
            userId: user?.id,
            updatePrice: quoteData?.quoteData?.update_price,
            promoCode: quoteData?.quoteData?.promoCode
          }
        )
      })
        .then(response => {
          if (!response.ok) {
            throw new Error("Network response was not ok");
          }
          return response.json();
        })
        .then(() => {
          localStorage.removeItem('quoteCreationTimestamp');
          window.location.href = "/payment-confirmation";
        })
        .catch(error => {
          console.error("Error updating quote data:", error);
          addNotification({
            type: "error",
            title: "Quote Update Failed",
            message: "An error occurred while updating the quote. Please try again.",
          });
        });
    };

    const settleQuotePayment = (quoteId: any, transactionId: any, gatewayAttemptId: string | null, user: DecodedToken | null) => {
      if (!gatewayAttemptId) {
        updateQuoteWithoutVerification(quoteId, transactionId, user);
        return;
      }

      // Ask our server to confirm the transaction with Paddle before the
      // customer is shown a confirmation page.
      fetch("/api/quote-checkout/verify-paddle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ gatewayAttemptId, transactionId }),
      })
        .then(async (response) => {
          const data = await response.json().catch(() => ({}));
          if (!response.ok || !data?.success) {
            throw new Error(data?.error || "Could not verify this payment with Paddle.");
          }
          return data;
        })
        .then(() => {
          localStorage.removeItem('quoteCreationTimestamp');
          window.location.href = `/payment-confirmation?gatewayAttemptId=${encodeURIComponent(gatewayAttemptId)}`;
        })
        .catch((error) => {
          // Verification is best-effort: Paddle already took the payment, so
          // fall back to the previous update path rather than stranding the
          // customer on a paid order.
          console.error("Paddle verification failed, falling back to the direct quote update:", error);
          updateQuoteWithoutVerification(quoteId, transactionId, user);
        });
    };

    const initPaddle = async () => {
      try {
        const clientToken = await fetchClientToken();
        if (!clientToken) {
          throw new Error("Paddle is not configured: no client token is available.");
        }
        const environment = await fetchEnvironment();

        const instance = await initializePaddle({
          environment: environment,
          token: clientToken,
          eventCallback: function (event) {

            if (event.name === "checkout.error") {
              const message = describePaddleError(event);
              console.error("Paddle Checkout Error:", event);
              addNotification({
                type: "error",
                title: "Payment Failed",
                message,
              });

              // Diagnostics only: the overlay is still open, so the attempt is
              // not marked as failed (the customer may still complete it).
              const attemptId = readPaddleCustomData(event)?.gatewayAttemptId;
              if (attemptId) {
                fetch("/api/payment-routing", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    action: "report",
                    attemptId,
                    failureCode: "paddle_checkout_error",
                    failureMessage: message,
                  }),
                }).catch((reportError) => console.error("Could not report the Paddle error:", reportError));
              }
            }

            if (event.name === "checkout.completed") {
              const token = Cookies.get("auth_token");
              const transactionId =
                event.data?.transaction_id ||
                event.data?.id ||
                event.data?.checkout?.id;
              let user: DecodedToken | null = null;
              if (token) {
                user = jwtDecode<DecodedToken>(token);
              }

              const customData = readPaddleCustomData(event);

              if (
                customData?.document_id &&
                customData?.purchase_type === "image"
              ) {
                window.dispatchEvent(
                  new CustomEvent("ai-paddle-payment-completed", {
                    detail: {
                      documentId: customData.document_id,
                      documentUuid: customData.document_uuid,
                      transactionId,
                    },
                  }),
                );
                return;
              }


              if (customData && customData.document_details) {
                const docDetails = JSON.parse(customData.document_details);
                const userDetails = JSON.parse(customData.user_details);

                fetch("/api/ai-documents/save-document", {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    docDetails,
                    userDetails,
                    transaction: event.data,
                  })
                })
                  .then(response => {
                    if (!response.ok) {
                      throw new Error("Failed to save document");
                    }
                    return response.json();
                  })
                  .then(data => {
                    localStorage.setItem("aiDocumentContent", docDetails.content);
                    localStorage.setItem("aiDocumentType", docDetails.prompt.substring(0, 100) + "...");
                    window.location.href = "/ai-payment-confirmation";
                  })
                  .catch(error => {
                    console.error("Error saving AI document:", error);
                    addNotification({
                      type: "error",
                      title: "Document Save Failed",
                      message: "An error occurred while saving the document. Please try again.",
                    });
                  });
              } else {
                const storedQuoteData = localStorage.getItem("quoteData");

                if (storedQuoteData) {
                  const quoteData = JSON.parse(storedQuoteData);
                  const quoteId = quoteData.id;
                  const gatewayAttemptId = customData?.gatewayAttemptId ? String(customData.gatewayAttemptId) : null;
                  settleQuotePayment(quoteId, transactionId, gatewayAttemptId, user);
                }
              }
            }
          }
        });

        if (!instance) {
          throw new Error("Paddle checkout could not be loaded.");
        }
        if (cancelled) return;
        paddleCache = { instance };
        paddleRef.current = instance;
        setPaddle(instance);
        setLoading(false);
      } catch (initError) {
        if (cancelled) return;
        const message = initError instanceof Error ? initError.message : "Paddle could not be initialised.";
        console.error("Error initialising Paddle:", initError);
        setError(message);
        setLoading(false);
      }
    };

    if (typeof window !== "undefined" && !paddleRef.current) {
      initPaddle();
    }

    return () => {
      cancelled = true;
    };
  }, [reloadKey, addNotification]);

  return { paddle, loading, error, reload };
}
