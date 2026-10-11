"use client";

import { initializePaddle, Paddle } from "@paddle/paddle-js";
import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { jwtDecode } from "jwt-decode";
import { useNotifications } from "@/hooks/use-notifications"

interface DecodedToken {
  userId: number;
  id?: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: string;
  iat: number;
  exp: number;
}

type PaddleCheckoutEvent = { name?: string; data?: any };

/** How long to wait for the client token before failing the initialisation. */
const CLIENT_TOKEN_TIMEOUT_MS = 24000;

/** Paddle.js can only be initialised once per page, so the instance is shared. */
let paddleCache: { token: string; instance: Paddle } | null = null;

export default function usePaddle() {
  const cached = typeof window !== "undefined" ? paddleCache : null;
  const [paddle, setPaddle] = useState<Paddle | undefined>(cached?.instance);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  const { addNotification } = useNotifications()

  /**
   * Drop the initialised instance and fetch the token again. Used by the
   * checkout button when Paddle could not be started (the loader used to stay
   * on "Processing..." forever because `loading` was never cleared).
   */
  const reload = useCallback(() => {
    paddleCache = null;
    setPaddle(undefined);
    setError(null);
    setLoading(true);
    setAttempt((value) => value + 1);
  }, []);

  useEffect(() => {
    const fetchClientToken = async () => {
      try {
        const response = await fetch("/api/paddle/client-token");
        const data = await response.json();
        return data.clientToken;
      } catch (error) {
        console.error("Error fetching client token:", error);
        return null;
      }
    };

    const fetchEnvironment = async () => {
      try {
        const response = await fetch("/api/paddle/environment");
        const data = await response.json();
        return data.environment;
      } catch (error) {
        console.error("Error fetching environment:", error);
        return "sandbox"; // Default to sandbox on error
      }
    };

    const initPaddle = async () => {
      const clientToken = await fetchClientToken();
      const environment = await fetchEnvironment();
      if (clientToken) {
        initializePaddle({
          environment: environment,
          token: clientToken,
          eventCallback: function (event) {

            if (event.name === "checkout.error") {
              console.error("Paddle Checkout Error:", event);
              addNotification({
                type: "error",
                title: "Payment Failed",
                message: "An error occurred during the payment process. Please try again.",
              });
            }

            if (event.name === "checkout.completed") {
              const token = Cookies.get("auth_token");
              const transactionId = event.data?.transaction_id || event.data?.checkout?.id;
              let user: DecodedToken | null = null;
              if (token) {
                user = jwtDecode<DecodedToken>(token);
              }




              const customData = event.data.custom_data;

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
                    .then(data => {
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
                }
              }
            }
          }
        }).then((paddleInstance: Paddle | undefined) => {
          if (paddleInstance) {
            setPaddle(paddleInstance);
            setLoading(false);
          }
        });
      }
    };

    if (typeof window !== "undefined" && !paddle) {
      initPaddle();
    }
  }, [paddle]);

  return { paddle, loading };
}
