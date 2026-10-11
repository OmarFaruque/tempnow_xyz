'use client';

import React from 'react';
import type { CheckoutQuote } from '@/features/insurance/types';
import DOMPurify from 'dompurify';
import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import Link from 'next/link';
import { Shield, Lock, ArrowLeft, Info, Loader2, CreditCard, Landmark, Car, FileText, Clock, User, Building2 } from 'lucide-react';
import { useAuth } from '@/context/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import usePaddle from '@/hooks/use-paddle';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { useSettings } from '@/context/settings';
import { Elements, useStripe, useElements, CardNumberElement, CardExpiryElement, CardCvcElement, PaymentRequestButtonElement } from '@stripe/react-stripe-js';
import Loading from './loading';
import { useQuoteExpiration } from '@/hooks/use-quote-expiration.tsx';
import Cookies from 'js-cookie';
// import styles from './checkout.module.css';
import { Label } from '@/components/ui/label';
import { getConfiguredGatewayOrder, getGatewayDisplayName, type PaymentGatewayId } from '@/core/payment-gateways';

type GatewayRoutingTrace = {
  order: string[];
  tried: string[];
  skipped: Array<{ gateway: string; reason: string; detail: string }>;
  reusedReservation: boolean;
  newRound: boolean;
  states: Record<string, { quota: number; used: number; autoPaused: boolean; customerCooldown: boolean }>;
};

type GatewayDebugEntry = { at: string; event: string; data?: unknown };

type PublicGatewayAttempt = {
  id: string;
  checkoutId: string;
  product: 'quote' | 'doc-forge';
  provider: PaymentGatewayId;
  attemptNumber: number;
  maxAttempts: number;
  status: 'reserved' | 'pending' | 'failed' | 'succeeded' | 'expired';
};

/** Admin-only routing explanation returned by /api/payment-routing. */
type RoutingDebugInfo = {
  order: string[];
  previouslyTried: string[];
  states: Record<string, { quota: number; used: number; autoPaused: boolean; customerCooldown: boolean }>;
  roundReset: boolean;
  resetGateways: string[];
  outcome: string;
  selected: string | null;
  attemptNumber: number;
  round: number;
};

type PaymentFailureNote = { code: string; message: string | null; at: string };

/**
 * Human-readable explanation of a routing decision ("picked paddle, square
 * exhausted 1/1"). Used in the console log and the admin debug panel so a
 * checkout can be explained without reading the server log.
 */
function describeRouting(debug: RoutingDebugInfo | null | undefined, provider?: string | null): string {
  if (!debug) return `routing trace unavailable for ${provider ?? 'this attempt'}`;

  const states = debug.states || {};
  const picked = debug.selected ?? provider ?? 'unknown';
  const parts = [
    `picked ${picked}`,
    `round ${debug.round}`,
    `attempt #${debug.attemptNumber}`,
    `order ${(debug.order || []).join(' → ') || 'n/a'}`,
  ];

  const otherStates = Object.entries(states)
    .filter(([gateway]) => gateway !== picked)
    .map(([gateway, state]) => {
      const quota = state.quota > 0 ? `${state.used}/${state.quota}` : `${state.used}/∞`;
      const flags = [state.autoPaused ? 'auto-paused' : null, state.customerCooldown ? 'cooldown' : null].filter(Boolean).join(', ');
      return `${gateway} ${quota}${flags ? ` (${flags})` : ''}`;
    });
  if (otherStates.length) parts.push(`others: ${otherStates.join(', ')}`);
  if (debug.previouslyTried?.length) parts.push(`already tried: ${debug.previouslyTried.join(', ')}`);
  if (debug.roundReset) parts.push(`new round started (reset ${debug.resetGateways?.join(', ') || 'quota'})`);

  return parts.join(' · ');
}

type CheckoutDebugListener = (entry: GatewayDebugEntry) => void;
const checkoutDebugListeners = new Set<CheckoutDebugListener>();

/**
 * One logger for every payment step (allocation, provider start, failure,
 * rotation). Each entry goes to the browser console and to the admin-only debug
 * panel on the checkout page, so a failed gateway can be explained on screen.
 */
function checkoutDebug(event: string, data?: unknown): void {
  const entry: GatewayDebugEntry = { at: new Date().toISOString(), event, data };
  console.info(`[checkout] ${event}`, data ?? '');
  checkoutDebugListeners.forEach((listener) => listener(entry));
}

function formatDebugData(data: unknown): string {
  if (data === undefined) return '';
  if (data instanceof Error) return `${data.name}: ${data.message}`;
  try {
    return JSON.stringify(data);
  } catch {
    return String(data);
  }
}

type AuthorizeNetOpaqueData = {
  dataDescriptor: string;
  dataValue: string;
};

declare global {
  interface Window {
    Accept?: {
      dispatchData: (
        secureData: {
          authData: { clientKey: string; apiLoginID: string };
          cardData: { cardNumber: string; month: string; year: string; cardCode: string };
        },
        callback: (response: any) => void
      ) => void;
    };
  }
}

// Dynamically import heavy payment components
const PaymentForm = dynamic(() => import('react-square-web-payments-sdk').then(mod => mod.PaymentForm), { ssr: false, loading: () => <Loader2 className="w-5 h-5 animate-spin" /> });
const SquareCreditCard = dynamic(() => import('react-square-web-payments-sdk').then(mod => mod.CreditCard), { ssr: false });
const SquareGooglePay = dynamic(() => import('react-square-web-payments-sdk').then(mod => mod.GooglePay), { ssr: false });
const SquareApplePay = dynamic(() => import('react-square-web-payments-sdk').then(mod => mod.ApplePay), { ssr: false });


const StripePayment = React.forwardRef(({ quoteData, user, quote, onProcessingChange, flp_checksum, gatewayAttemptId, onGatewayFailure }, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  React.useImperativeHandle(ref, () => ({
    async handlePayment() {
      if (!stripe || !elements) {
        if (onGatewayFailure) await onGatewayFailure('stripe_unavailable');
        else onProcessingChange(false);
        return;
      }
      onProcessingChange(true);
      let doNotRotate = false;
      try {

        // Create the Radar Session
        const radarSession = await stripe.createRadarSession();

        const response = await fetch("/api/quote-checkout/create-stripe-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            quoteData: { ...quoteData, id: quote.id, total: quoteData?.total },
            user: user,
            flp_checksum: flp_checksum,
            radar_session_id: radarSession.id,
            gatewayAttemptId
          }),
        });

        const initialization = await response.json();
        if (!response.ok || !initialization.clientSecret) {
          if (response.status === 403) doNotRotate = true;
          if (response.status !== 403 && onGatewayFailure) {
            await onGatewayFailure('stripe_initialization_failed');
            return;
          }
          throw new Error(initialization.details || initialization.error || "Could not initiate Stripe payment.");
        }
        const clientSecret = initialization.clientSecret;

        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) throw new Error("Card element not found.");

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardNumberElement },
        });
        if (error) {
          if (onGatewayFailure) {
            await onGatewayFailure(error.code || error.decline_code || 'stripe_payment_failed');
            return;
          }
          throw error;
        }
        if (paymentIntent.status === "succeeded") {
          toast({ title: "Payment Successful", description: "Your payment has been processed." });
          localStorage.removeItem('quoteCreationTimestamp');
          window.location.href = `/payment-confirmation?gatewayAttemptId=${encodeURIComponent(gatewayAttemptId || '')}`;
          return;
        }
        if (onGatewayFailure) {
          await onGatewayFailure(`stripe_${paymentIntent?.status || 'payment_incomplete'}`);
          return;
        }
        throw new Error(`Payment was not completed (${paymentIntent?.status || 'unknown status'}). Please try again.`);
      } catch (error: any) {
        if (!doNotRotate && onGatewayFailure && error?.message !== 'Card element not found.') {
          await onGatewayFailure(error?.code || 'stripe_payment_failed');
          return;
        }
        toast({ variant: "destructive", title: "Payment Error", description: error.message });
        onProcessingChange(false);
      }
    }
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cardNumber" className="text-sm font-medium text-foreground">
          Card Number
        </Label>
        <div className="relative">
          <CardNumberElement id="cardNumber" className="h-11 pr-14 p-3 border border-border rounded-lg" options={{ style: { base: { fontSize: '16px' } } }} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry" className="text-sm font-medium text-foreground">
            Expiry Date
          </Label>
          <CardExpiryElement id="expiry" className="h-11 p-3 border border-border rounded-lg" options={{ style: { base: { fontSize: '16px' } } }} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv" className="text-sm font-medium text-foreground">
            CVV
          </Label>
          <CardCvcElement id="cvv" className="h-11 p-3 border border-border rounded-lg" options={{ style: { base: { fontSize: '16px' } } }} />
        </div>
      </div>
    </div>
  );
});
StripePayment.displayName = 'StripePayment';


const AuthorizeNetPayment = React.forwardRef(({ quoteData, user, quote, onProcessingChange, flp_checksum, settings, gatewayAttemptId, onGatewayFailure }, ref) => {
  const { toast } = useToast();
  const [cardNumber, setCardNumber] = useState('');
  const [expiryMonth, setExpiryMonth] = useState('');
  const [expiryYear, setExpiryYear] = useState('');
  const [cardCode, setCardCode] = useState('');

  useEffect(() => {
    if (window.Accept) return;

    const script = document.createElement('script');
    const mode = settings?.authorizenet?.environment === 'live' ? 'live' : 'sandbox';
    script.src = mode === 'live' ? 'https://js.authorize.net/v1/Accept.js' : 'https://jstest.authorize.net/v1/Accept.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [settings?.authorizenet?.environment]);

  const getOpaqueData = () =>
    new Promise<AuthorizeNetOpaqueData>((resolve, reject) => {
      const mode = settings?.authorizenet?.environment === 'live' ? 'live' : 'sandbox';
      const apiLoginID = mode === 'live' ? settings?.authorizenet?.liveApiLoginId : settings?.authorizenet?.sandboxApiLoginId;
      const clientKey = mode === 'live' ? settings?.authorizenet?.liveClientKey : settings?.authorizenet?.sandboxClientKey;

      if (!apiLoginID || !clientKey) {
        reject(new Error('Authorize.Net client configuration is missing.'));
        return;
      }

      if (!window.Accept) {
        reject(new Error('Authorize.Net secure form is still loading. Please try again.'));
        return;
      }

      const secureData = {
        authData: { clientKey, apiLoginID },
        cardData: {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          month: expiryMonth,
          year: expiryYear,
          cardCode,
        },
      };

      window.Accept.dispatchData(secureData, (response: any) => {
        if (response?.messages?.resultCode === 'Error') {
          const details = response?.messages?.message?.map((m: any) => m.text).join(' ') || 'Tokenization failed.';
          reject(new Error(details));
          return;
        }

        const opaqueData = response?.opaqueData;
        if (!opaqueData?.dataDescriptor || !opaqueData?.dataValue) {
          reject(new Error('Invalid Authorize.Net tokenization response.'));
          return;
        }

        resolve({ dataDescriptor: opaqueData.dataDescriptor, dataValue: opaqueData.dataValue });
      });
    });

  React.useImperativeHandle(ref, () => ({
    async handlePayment() {
      if (!cardNumber || !expiryMonth || !expiryYear || !cardCode) {
        toast({ variant: 'destructive', title: 'Payment Error', description: 'Please enter complete card details.' });
        onProcessingChange(false);
        return;
      }

      onProcessingChange(true);
      try {
        const opaqueData = await getOpaqueData();

        const response = await fetch('/api/quote-checkout/create-authorize-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            quoteData: { ...quoteData, id: quote.id, total: quoteData?.total },
            user,
            flp_checksum,
            opaqueData,
            gatewayAttemptId,
          }),
        });

        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success) {
          const message = data.details || data.error || 'Authorize.Net payment failed.';
          const code = data.code || 'authorizenet_declined';

          // Fraud blocks are not bypassed by rotating; everything else moves to
          // the next provider with the decline reason recorded.
          if (response.status === 403 || response.status >= 500) {
            toast({ variant: 'destructive', title: 'Payment Error', description: message });
            onProcessingChange(false);
            return;
          }

          toast({ variant: 'destructive', title: 'Payment Declined', description: message });
          await onGatewayFailure?.(code, message);
          return;
        }

        toast({ title: 'Payment Successful', description: 'Your payment has been processed.' });
        localStorage.removeItem('quoteCreationTimestamp');
        window.location.href = `/payment-confirmation?gatewayAttemptId=${encodeURIComponent(gatewayAttemptId || '')}`;
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
        await onGatewayFailure?.('authorizenet_request_failed', error?.message || null);
        onProcessingChange(false);
      }
    },
  }));

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="anet-card-number" className="text-sm font-medium text-foreground">Card Number</Label>
        <input
          id="anet-card-number"
          className="h-11 w-full p-3 border border-border rounded-lg bg-background"
          placeholder="4111 1111 1111 1111"
          value={cardNumber}
          onChange={(e) => setCardNumber(e.target.value)}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="space-y-2">
          <Label htmlFor="anet-exp-month" className="text-sm font-medium text-foreground">Exp Month</Label>
          <input
            id="anet-exp-month"
            className="h-11 w-full p-3 border border-border rounded-lg bg-background"
            placeholder="MM"
            maxLength={2}
            value={expiryMonth}
            onChange={(e) => setExpiryMonth(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="anet-exp-year" className="text-sm font-medium text-foreground">Exp Year</Label>
          <input
            id="anet-exp-year"
            className="h-11 w-full p-3 border border-border rounded-lg bg-background"
            placeholder="YYYY"
            maxLength={4}
            value={expiryYear}
            onChange={(e) => setExpiryYear(e.target.value.replace(/\D/g, ''))}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="anet-cvv" className="text-sm font-medium text-foreground">CVV</Label>
          <input
            id="anet-cvv"
            className="h-11 w-full p-3 border border-border rounded-lg bg-background"
            placeholder="123"
            maxLength={4}
            value={cardCode}
            onChange={(e) => setCardCode(e.target.value.replace(/\D/g, ''))}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">Card data is tokenized in-browser via Authorize.Net Accept.js before payment processing.</p>
    </div>
  );
});
AuthorizeNetPayment.displayName = 'AuthorizeNetPayment';

const StripeApplePayButton = ({ quoteData, user, quote, onProcessingChange, allTermsAccepted, settings, flp_checksum, gatewayAttemptId, onGatewayFailure }) => {
  const stripe = useStripe();
  const { toast } = useToast();
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<any>(null);

  useEffect(() => {
    if (stripe) {
      const pr = stripe.paymentRequest({
        country: 'GB',
        currency: (settings?.general?.currency || 'GBP').toLowerCase(),
        total: {
          label: 'Total',
          amount: Math.round(quoteData.total * 100),
        },
        requestPayerName: true,
        requestPayerEmail: true,
      });

      pr.canMakePayment().then(result => {

        // store the result so we can inspect available methods (and render for debugging)
        setAvailablePaymentMethods(result);
        if (result) {

          setPaymentRequest(pr);
        }
      }).catch(error => {
        console.error('Error checking canMakePayment for Apple Pay:', error);
      });
    }

  }, [stripe, quoteData.total, settings]);

  useEffect(() => {
    let mounted = true;
    if (paymentRequest) {
      paymentRequest.on('paymentmethod', async (ev) => {
        if (!allTermsAccepted) {
          toast({ variant: 'destructive', title: 'Missing Information', description: 'Please accept all the terms and conditions.' });
          ev.complete('fail');
          return;
        }
        onProcessingChange(true);

        const handleSuccess = () => {
          toast({ title: "Payment Successful", description: "Your payment has been processed." });
          localStorage.removeItem('quoteCreationTimestamp');
          window.location.href = gatewayAttemptId
            ? `/payment-confirmation?gatewayAttemptId=${encodeURIComponent(gatewayAttemptId)}`
            : "/payment-confirmation";
        };

        try {
          // Create the Radar Session
          const radarSession = await stripe.createRadarSession();

          const response = await fetch("/api/quote-checkout/create-stripe-payment", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              quoteData: { ...quoteData, id: quote.id, total: quoteData?.total },
              user: user,
              flp_checksum: flp_checksum,
              radar_session_id: radarSession.id, // Send session ID to backend
              gatewayAttemptId,
            }),
          });
          const { clientSecret, error: clientSecretError } = await response.json();
          if (!mounted) return;
          if (!response.ok || clientSecretError) {
            throw new Error(clientSecretError?.message || clientSecretError || "Could not initiate Stripe payment.");
          }

          const { paymentIntent, error: confirmError } = await stripe.confirmCardPayment(
            clientSecret,
            { payment_method: ev.paymentMethod.id },
            { handleActions: false }
          );

          if (!mounted) return;
          if (confirmError) {
            ev.complete('fail');
            throw confirmError;
          }

          if (paymentIntent.status === "succeeded") {
            ev.complete('success');
            handleSuccess();
          } else if (paymentIntent.status === "requires_action") {
            ev.complete('success');
            const { error } = await stripe.confirmCardPayment(clientSecret);
            if (!mounted) return;
            if (error) {
              throw error;
            }
            handleSuccess();
          } else {
            ev.complete('fail');
            throw new Error(`Payment failed with status: ${paymentIntent.status}`);
          }
        } catch (error: any) {
          if (!mounted) return;
          ev.complete('fail');
          toast({ variant: "destructive", title: "Payment Error", description: error.message });
          await onGatewayFailure?.('stripe_wallet_failed', error?.message || null);
          onProcessingChange(false);
        }
      });
    }
    return () => {
      mounted = false;
      if (paymentRequest) {
        paymentRequest.off('paymentmethod');
      }
    };
  }, [paymentRequest, stripe, allTermsAccepted, quoteData, quote, user, onProcessingChange, toast]);

  if (paymentRequest) {
    return (
      <>
        <div className="relative my-4 flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="flex-shrink mx-4 text-xs text-muted-foreground">OR</span>
          <div className="flex-grow border-t border-border"></div>
        </div>
        <PaymentRequestButtonElement options={{ paymentRequest, style: { paymentRequestButton: { height: '56px', theme: 'dark' } } }} className="w-full" />
      </>
    );
  }

  return null;
};

const PaddleCheckoutButton = ({ quoteData, user, discountedTotal, disabled, flp_checksum, settings, quote, gatewayAttemptId, onGatewayFailure }) => {
  const { paddle, loading: isPaddleLoading, error: paddleError, reload: reloadPaddle } = usePaddle();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const failureReportedFor = useRef<string | null>(null);

  // Paddle could not be started (settings unreachable, token missing, SDK
  // blocked). Hand the checkout to the next provider instead of leaving the
  // customer on a button that spins on "Processing..." forever.
  useEffect(() => {
    if (!paddleError) return;
    const attemptKey = gatewayAttemptId || 'unattributed';
    if (failureReportedFor.current === attemptKey) return;
    failureReportedFor.current = attemptKey;
    checkoutDebug('paddle: Paddle.js could not be initialised', { paddleError, gatewayAttemptId });
    void onGatewayFailure?.('paddle_checkout_unavailable', paddleError);
  }, [paddleError, gatewayAttemptId, onGatewayFailure]);


  const handlePaddlePayment = async () => {
    if (!paddle) {
      // Still initialising: the effect above rotates once it reports an error.
      if (!paddleError) return;
      await onGatewayFailure?.('paddle_checkout_unavailable', paddleError);
      return;
    }
    setIsProcessing(true);
    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteData: { ...quoteData, id: quote.id, policyNumber: quote.policyNumber, total: discountedTotal },
          user: user,
          flp_checksum: flp_checksum,
          gatewayAttemptId,
          checkoutId: `quote:${quote.id}`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      checkoutDebug(`paddle: /api/create-payment -> ${response.status}`, data);
      if (!response.ok) {
        throw new Error(data.details || data.error || "Could not initiate Paddle payment.");
      }
      if (data.priceId) {
        paddle.Checkout.open({ items: [{ priceId: data.priceId, quantity: 1 }] });
      } else {
        throw new Error(data.error || "Could not initiate Paddle payment.");
      }
    } catch (error: any) {
      checkoutDebug('paddle could not start', { gatewayAttemptId, error: error?.message || String(error) });
      toast({ variant: "destructive", title: "Payment Error", description: error.message });
      // Paddle never opened, so the attempt rotates to the next provider
      // instead of leaving the customer with a dead button.
      await onGatewayFailure?.('paddle_init_failed', error?.message || null);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isPaddleLoading || isProcessing;

  return (
    <Button
      onClick={handlePaddlePayment}
      className="h-14 w-full rounded-lg bg-teal-600 text-base font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
      disabled={disabled || isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
      {isLoading ? 'Processing...' : `Pay £${discountedTotal.toFixed(2)}`}
    </Button>
  );
};

const VivaCheckoutButton = ({ quoteData, user, discountedTotal, disabled, flp_checksum, settings, quote, gatewayAttemptId, onGatewayFailure }) => {
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleVivaPayment = async () => {
    setIsProcessing(true);
    try {
      const response = await fetch("/api/create-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quoteData: { ...quoteData, id: quote.id, policyNumber: quote.policyNumber, total: discountedTotal },
          user: user,
          flp_checksum: flp_checksum,
          gatewayAttemptId,
          checkoutId: `quote:${quote.id}`,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.orderCode) {
        localStorage.setItem('quotePolicyNumber', quote.policyNumber); // Store policyNumber
        localStorage.removeItem('quoteCreationTimestamp'); // Clear timestamp
        const vivaEnv = settings.viva.env === 'demo' ? 'demo' : 'www';
        window.location.href = `https://${vivaEnv}.vivapayments.com/web/checkout?ref=${data.orderCode}`;
      } else {
        throw new Error(data.details || data.error || "Could not initiate Viva payment.");
      }
    } catch (error: any) {
      checkoutDebug('viva could not start', { gatewayAttemptId, error: error?.message || String(error) });
      toast({ variant: "destructive", title: "Payment Error", description: error.message });
      // The attempt has already been released by the server, so continue with
      // the next provider instead of leaving a dead button behind.
      await onGatewayFailure?.('viva_init_failed', error?.message || null);
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing;

  return (
    <Button
      onClick={handleVivaPayment}
      className="h-14 w-full rounded-lg bg-teal-600 text-base font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
      disabled={disabled || isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
      {isLoading ? 'Processing...' : `Pay £${discountedTotal.toFixed(2)}`}
    </Button>
  );
};

function QuoteCheckoutPage() {
  const { isAuthenticated, isAdmin, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const settings = useSettings();
  const [quoteData, setQuoteData] = useState<CheckoutQuote | null>(null);
  const [quote, setQuote] = useState<any>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentView, setPaymentView] = useState<"selection" | "card-details" | "bank-details">("selection");
  const [checkboxContent, setCheckboxContent] = useState<string[]>([]);
  const [checkboxStates, setCheckboxStates] = useState<boolean[]>([]);

  const [gatewayAttempt, setGatewayAttempt] = useState<PublicGatewayAttempt | null>(null);
  const [gatewayLoading, setGatewayLoading] = useState(true);
  const [gatewayUnavailable, setGatewayUnavailable] = useState(false);
  const [rotationNotice, setRotationNotice] = useState<string | null>(null);
  const [routingAttemptKey, setRoutingAttemptKey] = useState(0);
  // Debug view for operators: why this provider, and what the last error was.
  const [routingDebug, setRoutingDebug] = useState<RoutingDebugInfo | null>(null);
  const [lastFailure, setLastFailure] = useState<PaymentFailureNote | null>(null);
  const [showDebugPanel, setShowDebugPanel] = useState(false);
  const [routingTrace, setRoutingTrace] = useState<GatewayRoutingTrace | null>(null);
  const [gatewayFailureDetail, setGatewayFailureDetail] = useState<string | null>(null);
  const [debugLog, setDebugLog] = useState<GatewayDebugEntry[]>([]);
  const routingStartedFor = useRef<string | null>(null);
  const flp_checksum = Cookies.get('flp_checksum');


  const paymentSettings = settings?.paymentProvider;
  const configuredGatewayOrder = getConfiguredGatewayOrder(paymentSettings);
  const configuredActiveProcessor = typeof paymentSettings === 'string' ? paymentSettings : paymentSettings?.activeProcessor;
  // Routing owns the provider for this checkout. The configured order is only a
  // placeholder while the allocation request resolves, and the legacy
  // "activeProcessor" string keeps older settings working.
  const paymentProvider = gatewayAttempt?.provider
    ?? configuredGatewayOrder[0]
    ?? (configuredActiveProcessor && configuredActiveProcessor !== 'none' ? configuredActiveProcessor : null);
  const bankPaymentEnabled = settings?.bank?.show;
  const squareAppId = settings?.square?.appId;
  const squareLocationId = settings?.square?.appLocationId;

  const airwallexCardRef = useRef(null);
  const stripePaymentRef = useRef<{ handlePayment: () => Promise<void> }>(null);
  const authorizePaymentRef = useRef<{ handlePayment: () => Promise<void> }>(null);
  const [airwallexElement, setAirwallexElement] = useState<any>(null);

  // Debug: log payment selection/view changes
  useEffect(() => {
    console.log('DEBUG: payment selection changed', { selectedPaymentMethod, paymentView });
  }, [selectedPaymentMethod, paymentView]);

  // Mirror every checkoutDebug() entry into the admin debug panel.
  useEffect(() => {
    const listener: CheckoutDebugListener = (entry) => setDebugLog((prev) => [...prev.slice(-49), entry]);
    checkoutDebugListeners.add(listener);
    return () => { checkoutDebugListeners.delete(listener); };
  }, []);

  const paymentMethods = [];
  // Only the provider the router allocated for *this* checkout is offered, so a
  // customer can never pay a quota the router already spent elsewhere. While
  // routing is unavailable the card option disappears (bank transfer, which
  // does not use a card gateway, stays available).
  if (paymentProvider && !gatewayUnavailable) {
    const providerDescription = paymentProvider === 'square'
      ? 'Pay with card, Google Pay, or Apple Pay.'
      : ['mollie', 'paypal', 'checkoutcom', 'lemonsqueezy', 'paddle', 'viva'].includes(paymentProvider)
        ? `Continue to ${getGatewayDisplayName(paymentProvider)}’s secure checkout.`
        : `Secure card processing by ${getGatewayDisplayName(paymentProvider)}.`;
    paymentMethods.push({
      id: paymentProvider,
      title: `Credit or Debit Card · ${getGatewayDisplayName(paymentProvider)}`,
      description: providerDescription,
      icon: <CreditCard className="h-5 w-5 text-muted-foreground" />,
      type: 'card'
    });
  }
  if (bankPaymentEnabled) {
    paymentMethods.push({
      id: 'bank',
      title: 'Bank Transfer',
      description: 'Secure direct payment from your bank',
      icon: <Building2 className="h-5 w-5 text-muted-foreground" />,
      type: 'bank'
    });
  }



  useEffect(() => {
    if (authLoading) {
      return; // Wait for authentication to be determined
    }

    if (!isAuthenticated) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to access this page.' });
      router.push('/');
      return;
    }

    const storedQuoteData = localStorage.getItem('quoteData');
    if (storedQuoteData) {
      const parsed = JSON.parse(storedQuoteData);
      const data = typeof parsed.quoteData === 'string' ? JSON.parse(parsed.quoteData) : parsed.quoteData;
      setQuoteData(data);
      setQuote(parsed);
    } else {
      router.push('/get-quote');
    }
    if (settings?.general) {
      let content = settings.general.checkoutCheckboxContent ? settings.general.checkoutCheckboxContent.split('||') : [];
      if (content.length === 0 || (content.length === 1 && content[0].trim() === '')) {
        content = [
          'I confirm I\'ve read and agree to the <a href="/terms-of-services" target="_blank" class="font-medium text-teal-600 hover:underline">Terms of Service</a> and understand this is a non-refundable digital document service. *',
          'I acknowledge that all purchases are final and the information I have entered is accurate *'
        ];
      }
      setCheckboxContent(content);
      setCheckboxStates(Array(content.length).fill(false));
    }
  }, [isAuthenticated, authLoading, router, settings, toast]);


  // Load payment provider routing basis
  useEffect(() => {
    const checkoutQuoteId = quote?.id || quoteData?.id;
    if (!checkoutQuoteId || !user?.id) {
      if (!authLoading) {
        setGatewayLoading(false);
      }
      return;
    }
    const checkoutId = `quote:${checkoutQuoteId}`;
    if (routingStartedFor.current === checkoutId) return;
    routingStartedFor.current = checkoutId;

    const initializeGateway = async () => {
      setGatewayLoading(true);
      try {
        const params = new URLSearchParams(window.location.search);
        const incomingAttemptId = params.get('gatewayAttemptId');
        if (incomingAttemptId) {
          const response = await fetch(`/api/payment-routing?attemptId=${encodeURIComponent(incomingAttemptId)}`, { cache: 'no-store' });
          const data = await response.json();
          if (!response.ok || !data.success || data.attempt?.product !== 'quote' || data.attempt?.checkoutId !== checkoutId || !['reserved', 'pending'].includes(data.attempt?.status)) {
            throw new Error(data.error || 'The alternate payment option could not be loaded.');
          }
          const attempt = data.attempt as PublicGatewayAttempt;
          setGatewayAttempt(attempt);
          setSelectedPaymentMethod(attempt.provider);
          if (params.get('gatewayRetry') === '1') {
            setPaymentView('card-details');
            setRotationNotice('Something went wrong, please try again. Re-enter your card details to continue securely with the next provider.');
          }
          return;
        }

        const response = await fetch('/api/payment-routing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'allocate',
            checkoutId,
            product: 'quote',
            user: { id: user.id, email: user.email },
          }),
        });
        const data = await response.json();
        if (!response.ok || !data.success) {
          checkoutDebug('allocation refused', { status: response.status, code: data?.code ?? null, error: data?.error ?? null });
          setGatewayUnavailable(true);
          setRotationNotice(data.error || 'Online payment is temporarily unavailable.');
          return;
        }
        const attempt = data.attempt as PublicGatewayAttempt;
        setGatewayAttempt(attempt);
        setSelectedPaymentMethod(attempt.provider);
        setGatewayUnavailable(false);
        // Admins also receive the routing decision, so a checkout can be
        // debugged without reading the server log.
        const trace = (data.debug ?? null) as RoutingDebugInfo | null;
        if (trace) setRoutingDebug(trace);
        checkoutDebug(`allocated ${attempt.provider} (attempt ${attempt.attemptNumber}/${attempt.maxAttempts})`, { routing: describeRouting(trace, attempt.provider), attemptId: attempt.id });
      } catch (error) {
        checkoutDebug('allocation request failed', error);
        setGatewayUnavailable(true);
        setRotationNotice(error instanceof Error ? error.message : 'Online payment is temporarily unavailable.');
      } finally {
        setGatewayLoading(false);
      }
    };

    void initializeGateway();
  }, [quoteData?.id, quote?.id, user?.id, user?.email, authLoading, routingAttemptKey]);

  useEffect(() => {
    if (selectedPaymentMethod === 'airwallex' && isAuthenticated && quoteData) {
      const initAirwallex = async () => {
        let doNotRotate = false;
        try {
          const Airwallex = (await import('airwallex-payment-elements')).default;
          await Airwallex.loadAirwallex({ env: settings?.airwallex?.environment === 'test' ? 'demo' : 'prod' });
          const response = await fetch('/api/quote-checkout/create-airwallex-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quoteData: { ...quoteData, total: quoteData?.total },
              user: user,
              flp_checksum: flp_checksum,
              gatewayAttemptId: gatewayAttempt?.id,
              checkoutId: `quote:${quote.id}`,
            }),
          });
          const intent = await response.json();
          const { clientSecret, intentId } = intent;
          if (!response.ok || !clientSecret || !intentId) {
            if (response.status === 403) doNotRotate = true;
            throw new Error(intent.error || 'Airwallex checkout could not be initialized.');
          }
          if (!airwallexCardRef.current) throw new Error('Payment form is not ready.');
          const cardElement = Airwallex.createElement('card', {
            intent: { id: intentId, client_secret: clientSecret },
          });
          cardElement.mount(airwallexCardRef.current!);
          setAirwallexElement(cardElement);
        } catch (error) {
          checkoutDebug('airwallex initialization failed', error);
          if (!doNotRotate) {
            await handleGatewayFailure('airwallex_initialization_failed');
          } else {
            toast({ variant: 'destructive', title: 'Payment Error', description: 'We could not authorize this checkout.' });
          }
        }
      };
      initAirwallex();
    }
  }, [selectedPaymentMethod, isAuthenticated, toast, quoteData, user, gatewayAttempt?.id, settings?.airwallex?.environment]);

  // A Square checkout that is missing its application id, location id or
  // enabled payment methods would render an empty card area, so the attempt is
  // handed to the next provider with the reason recorded.
  useEffect(() => {
    if (selectedPaymentMethod !== 'square' || !gatewayAttempt) return;
    const squareMethods = settings?.square?.paymentMethods;
    const squareReady = !!squareAppId
      && !!squareLocationId
      && !!(squareMethods?.card || squareMethods?.googlePay || squareMethods?.applePay);
    if (squareReady) return;
    void handleGatewayFailure(
      'square_not_configured',
      'Square is not fully configured (application id, location id or enabled payment methods are missing).',
    );
  }, [selectedPaymentMethod, gatewayAttempt?.id, squareAppId, squareLocationId, settings?.square?.paymentMethods]);


  const handleGatewayFailure = async (failureCode = 'payment_declined', failureMessage?: string | null) => {
    const failedAttemptId = gatewayAttempt?.id;
    setLastFailure({ code: failureCode, message: failureMessage ?? null, at: new Date().toISOString() });
    checkoutDebug(`${gatewayAttempt?.provider ?? 'gateway'} attempt failed (${failureCode})`, { attemptId: failedAttemptId ?? null, failureMessage: failureMessage ?? null });
    if (!failedAttemptId) {
      setIsProcessingPayment(false);
      toast({ variant: 'destructive', title: 'Payment Error', description: 'Something went wrong, please try again.' });
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/payment-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'retry', attemptId: failedAttemptId, failureCode, failureMessage }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        setGatewayAttempt(null);
        setSelectedPaymentMethod(null);
        setPaymentView('selection');
        setGatewayUnavailable(true);
        setRotationNotice('Something went wrong, please try again. We could not find another secure payment option.');
        toast({ variant: 'destructive', title: 'Payment not completed', description: 'Something went wrong, please try again. No further payment attempts were made.' });
        return;
      }

      const nextAttempt = data.attempt as PublicGatewayAttempt;
      setGatewayAttempt(nextAttempt);
      setSelectedPaymentMethod(nextAttempt.provider);
      setPaymentView('card-details');
      setGatewayUnavailable(false);
      const trace = (data.debug ?? null) as RoutingDebugInfo | null;
      if (trace) setRoutingDebug(trace);
      checkoutDebug(`rotated to ${nextAttempt.provider} (attempt ${nextAttempt.attemptNumber}/${nextAttempt.maxAttempts})`, { routing: describeRouting(trace, nextAttempt.provider), attemptId: nextAttempt.id });
      setRotationNotice(`Something went wrong, please try again. Continue securely with ${getGatewayDisplayName(nextAttempt.provider)} and enter your card details again.`);
      setAirwallexElement(null);
    } catch (error) {
      checkoutDebug('could not switch gateways', error);
      setGatewayUnavailable(true);
      setRotationNotice('Something went wrong, please try again. Your payment was not completed.');
      toast({ variant: 'destructive', title: 'Payment not completed', description: 'Something went wrong, please try again.' });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleRetryGatewayRouting = () => {
    routingStartedFor.current = null;
    setGatewayAttempt(null);
    setSelectedPaymentMethod(null);
    setPaymentView('selection');
    setGatewayUnavailable(false);
    setRotationNotice(null);
    setGatewayLoading(true);
    setRoutingAttemptKey((key) => key + 1);
  };

  const handleCheckboxChange = (index: number, checked: boolean) => {
    const newStates = [...checkboxStates];
    newStates[index] = checked;
    setCheckboxStates(newStates);
  };

  const handleCompletePayment = async () => {
    if (!checkboxStates.every(c => c)) {
      toast({ variant: 'destructive', title: 'Missing Information', description: 'Please accept all the terms and conditions.' });
      return;
    }
    setIsProcessingPayment(true);

    switch (selectedPaymentMethod) {
      case 'lemonsqueezy':
        try {
          const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quoteData: { ...quoteData, id: quote.id, policyNumber: quote.policyNumber, total: quoteData?.total },
              user: user,
              flp_checksum: flp_checksum,
              gatewayAttemptId: gatewayAttempt?.id,
              checkoutId: `quote:${quote.id}`,
            }),
          });
          const data = await response.json().catch(() => ({}));
          if (response.ok && data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            const initError: any = new Error(data.details || data.error || 'Could not initiate payment.');
            initError.code = data.code;
            throw initError;
          }
        } catch (error: any) {
          checkoutDebug(`${selectedPaymentMethod} could not start (${error?.code || 'init_failed'})`, error?.message || error);
          toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
          // The attempt was already marked failed by the server, so the
          // customer is moved to the next provider instead of retrying a
          // button that can no longer succeed.
          await handleGatewayFailure(error?.code || `${selectedPaymentMethod}_init_failed`, error?.message || null);
        }
        break;
      case 'mollie':
      case 'paypal':
      case 'checkoutcom':
        try {
          const response = await fetch('/api/create-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quoteData: { ...quoteData, id: quote.id, policyNumber: quote.policyNumber, total: quoteData?.total },
              user: user,
              flp_checksum: flp_checksum,
              gatewayAttemptId: gatewayAttempt?.id,
              checkoutId: `quote:${quote.id}`,
            }),
          });
          const data = await response.json().catch(() => ({}));
          if (response.ok && data.checkoutUrl) {
            window.location.href = data.checkoutUrl;
          } else {
            const initError: any = new Error(data.details || data.error || 'Could not initiate payment.');
            initError.code = data.code;
            throw initError;
          }
        } catch (error: any) {
          checkoutDebug(`${selectedPaymentMethod} could not start (${error?.code || 'init_failed'})`, error?.message || error);
          toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
          await handleGatewayFailure(error?.code || `${selectedPaymentMethod}_init_failed`, error?.message || null);
        }
        break;

      case 'stripe':
        if (stripePaymentRef.current) {
          await stripePaymentRef.current.handlePayment();
        } else {
          toast({ variant: 'destructive', title: 'Payment Error', description: 'Stripe component not ready.' });
          setIsProcessingPayment(false);
        }
        break;

      case 'authorizenet':
        if (authorizePaymentRef.current) {
          await authorizePaymentRef.current.handlePayment();
        } else {
          toast({ variant: 'destructive', title: 'Payment Error', description: 'Authorize.Net component not ready.' });
          setIsProcessingPayment(false);
        }
        break;

      case 'airwallex':
        if (!airwallexElement) {
          toast({ variant: 'destructive', title: 'Payment Error', description: 'Airwallex is not ready.' });
          setIsProcessingPayment(false);
          return;
        }
        try {
          const Airwallex = (await import('airwallex-payment-elements')).default;
          await Airwallex.confirmPaymentIntent({
            element: airwallexElement,
            id: airwallexElement.intent.id,
            client_secret: airwallexElement.intent.client_secret,
          });
          toast({ title: 'Payment Processing', description: 'Your payment is processing. You will receive an email confirmation shortly.' });
        } catch (error: any) {
          toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
          setIsProcessingPayment(false);
        }
        break;

      case 'bank':
        try {
          const response = await fetch('/api/quote-checkout/update-payment-method', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              policyNumber: quote?.policyNumber,
              paymentMethod: 'bank_transfer',
              flp_checksum: flp_checksum,
            }),
          });

          if (!response.ok) {
            throw new Error('Failed to update payment method');
          }

          localStorage.removeItem('quoteCreationTimestamp');
          router.push(`/bank-payment-details?policynumber=${quote?.policyNumber}`);
        } catch (error) {
          console.error('Error updating payment method:', error);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'There was an error updating the payment method. Please try again.',
          });
        } finally {
          setIsProcessingPayment(false);
        }
        break;

      default:
        toast({ variant: 'destructive', title: 'Invalid Payment Method', description: 'Please select a valid payment method.' });
        setIsProcessingPayment(false);
        // Add a return statement to prevent further execution
        return;
    }
  };

  const handleSquarePayment = async (token: any, verifiedBuyer?: any) => {
    // Square hands tokenisation failures back through the same callback: the
    // card never reached the API, so the attempt rotates to the next provider.
    const tokenizationErrors = Array.isArray(token?.errors) ? token.errors : null;
    if (tokenizationErrors) {
      const message = tokenizationErrors
        .map((entry: any) => entry?.detail || entry?.message || entry?.code)
        .filter(Boolean)
        .join(', ') || 'Square could not accept these card details.';
      const code = String(tokenizationErrors[0]?.code || 'square_tokenization_failed');
      toast({ variant: 'destructive', title: 'Card Details Rejected', description: message });
      await handleGatewayFailure(`square_${code}`, message);
      return;
    }
    if (!token?.token) {
      if (token) {
        toast({ variant: 'destructive', title: 'Payment Error', description: 'Square did not return a payment token. Please try again.' });
        await handleGatewayFailure('square_token_missing', 'Square did not return a payment token.');
      }
      return;
    }

    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/quote-checkout/create-square-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: token.token,
          verificationToken: verifiedBuyer?.token,
          quoteData: { ...quoteData, id: quote.id, total: quoteData?.total },
          user: user,
          flp_checksum: flp_checksum,
          gatewayAttemptId: gatewayAttempt?.id,
        }),
      });
      if (response.ok) {
        toast({ title: 'Payment Successful', description: 'Your payment has been processed.' });
        localStorage.removeItem('quoteCreationTimestamp');
        window.location.href = `/payment-confirmation?gatewayAttemptId=${encodeURIComponent(gatewayAttempt?.id || '')}`;
        return;
      }

      const error = await response.json().catch(() => ({}));
      const message = error.details || error.error || 'Square payment failed.';
      const code = error.code || 'square_payment_failed';
      checkoutDebug(`square declined the payment (${code})`, { message, rawError: error.rawError ?? null });

      // Fraud blocks and unexpected server errors may still have taken money
      // (or must not be bypassed), so the checkout stays on Square and only
      // shows the reason. Everything else rotates to the next provider.
      if (response.status === 403 || response.status >= 500) {
        toast({ variant: 'destructive', title: 'Payment Error', description: message });
        setLastFailure({ code, message, at: new Date().toISOString() });
        return;
      }

      toast({ variant: 'destructive', title: 'Payment Declined', description: message });
      await handleGatewayFailure(code, message);
    } catch (error: any) {
      checkoutDebug('square request failed', { gatewayAttemptId: gatewayAttempt?.id ?? null, error: error?.message || String(error) });
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
      setLastFailure({ code: 'square_request_failed', message: error.message, at: new Date().toISOString() });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const createVerificationDetails = () => ({
    amount: (quoteData?.total ?? 0).toFixed(2),
    currencyCode: settings?.general?.currency || 'GBP',
    intent: 'CHARGE',
    customerInitiated: true,
    sellerKeyedIn: false,
    billingContact: {
      givenName: quoteData?.customerData?.firstName || user?.firstName || '',
      familyName: quoteData?.customerData?.lastName || user?.lastName || '',
      email: user?.email || '',
      addressLines: [quoteData?.customerData?.address].filter(Boolean) as string[],
      city: quoteData?.customerData?.city || '',
      countryCode: quoteData?.customerData?.country || 'GB',
      postalCode: quoteData?.customerData?.post_code || quoteData?.customerData?.postcode || (quoteData?.customerData as any)?.postCode || '',
    },
  });

  const createPaymentRequest = () => ({
    countryCode: 'GB',
    currencyCode: settings?.general?.currency || 'GBP',
    total: {
      amount: (quoteData?.total ?? 0).toFixed(2),
      label: 'Total',
    },
  });

  const { ExpirationDialog } = useQuoteExpiration(quote, selectedPaymentMethod);

  // useEffect(() => {
  //   document.body.classList.add(styles.checkoutTheme);
  //   return () => {
  //     document.body.classList.remove(styles.checkoutTheme);
  //   };
  // }, []);

  if (!quoteData) {
    return <Loading />;
  }
  const allTermsAccepted = checkboxStates.every(c => c);

  return (
    <div className="min-h-screen bg-muted">
      <ExpirationDialog />
      <header className="bg-teal-600 px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-2xl font-bold text-white hover:text-teal-100 transition-colors">
            {settings?.general?.siteName || 'TEMPNOW'}
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-6">
        <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground" onClick={() => {
          if (quoteData?.customerData?.registration) {
            router.push(`/get-quote?reg=${quoteData.customerData.registration}&view=review`);
          } else {
            router.push('/'); // Fallback to home if reg is not found
          }
        }} >
          <ArrowLeft className="h-4 w-4" />
          Back to Quote
        </Button>
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-8">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-xl border border-border bg-card px-6 py-5 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-50">
                <Lock className="h-6 w-6 text-teal-600" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold text-card-foreground">Secure Checkout</h1>
                <p className="text-sm text-muted-foreground">Your payment information is protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 pb-12">
        <div className="mx-auto max-w-2xl">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="h-1 bg-gradient-to-r from-teal-500 to-teal-700" />

              <div className="border-b border-border bg-muted bg-section-header px-6 py-4">
                <h2 className="text-sm font-semibold text-card-foreground">Docs Summary</h2>
              </div>
              <div className="divide-y divide-border p-6">
                <div className="flex items-center gap-4 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                    <FileText className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground">Registration</div>
                    <div className="text-base font-semibold text-card-foreground">{quoteData.customerData.registration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                    <Car className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground">Vehicle</div>
                    <div className="text-base font-semibold text-card-foreground">{quoteData.customerData.vehicle.make} {quoteData.customerData.vehicle.model}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                    <Clock className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground">Duration</div>
                    <div className="text-base font-semibold text-card-foreground">{quoteData.breakdown.duration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-teal-50">
                    <User className="h-5 w-5 text-teal-600" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground">Name</div>
                    <div className="text-base font-semibold text-card-foreground">{quoteData.customerData.firstName} {quoteData.customerData.lastName}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="h-1 bg-gradient-to-r from-teal-500 to-teal-700" />

              <div className="p-6">
                <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50">
                    <CreditCard className="h-4 w-4 text-teal-600" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Payment Method</h2>
                </div>

                <div className="mb-6 rounded-lg border border-teal-100 bg-teal-50/50 p-5 text-center">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Amount Due
                  </div>
                  <div className="text-4xl font-bold text-teal-600">£{(quoteData.total).toFixed(2)}</div>
                </div>

                {/* Payment Disabled Notice */}
                {(!paymentProvider && !bankPaymentEnabled) && (
                  <div className="space-y-4">
                    <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-b from-orange-50 to-amber-50 p-6 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                        <Info className="h-7 w-7 text-orange-600" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-orange-900">
                        Payment Currently Unavailable
                      </h3>
                      {settings?.paymentProvider?.paymentDisabledMessage ? (
                        <div
                          className="text-sm text-gray-700 leading-relaxed prose prose-sm max-w-none mx-auto [&_a]:text-blue-600 [&_a]:underline [&_a:hover]:text-blue-800"
                          dangerouslySetInnerHTML={{
                            __html: DOMPurify.sanitize(settings.paymentProvider.paymentDisabledMessage, {
                              ALLOWED_TAGS: ['a', 'b', 'i', 'em', 'strong', 'p', 'br', 'span', 'div', 'ul', 'ol', 'li'],
                              ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
                            }),
                          }}
                        />
                      ) : (
                        <p className="text-sm text-gray-600 leading-relaxed">
                          We are currently performing system updates. Online payments will be reactivated shortly.
                          We apologise for the inconvenience.
                        </p>
                      )}
                    </div>
                    {gatewayUnavailable && (
                      <Button
                        className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 font-semibold text-slate-950 hover:from-yellow-400 hover:to-yellow-500"
                        onClick={handleRetryGatewayRouting}
                      >
                        <Loader2 className="mr-2 h-4 w-4" />
                        Try Again
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Return to Homepage
                    </Button>
                  </div>
                )}

                {/* Routing could not hand this checkout to any provider */}
                {gatewayUnavailable && paymentProvider !== null && (
                  <div className="space-y-4">
                    <div className="rounded-xl border-2 border-orange-200 bg-gradient-to-b from-orange-50 to-amber-50 p-6 text-center">
                      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-100">
                        <Info className="h-7 w-7 text-orange-600" />
                      </div>
                      <h3 className="mb-2 text-lg font-semibold text-orange-900">
                        {bankPaymentEnabled ? 'Card Payment Temporarily Unavailable' : 'Payment Temporarily Unavailable'}
                      </h3>
                      <p className="text-sm text-gray-700 leading-relaxed">
                        {rotationNotice || 'We could not prepare a secure payment option right now.'}
                      </p>
                      <p className="mt-2 text-xs text-gray-500">
                        No card details have been taken and you have not been charged.
                      </p>
                    </div>
                    <Button
                      className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 font-semibold text-slate-950 hover:from-yellow-400 hover:to-yellow-500"
                      onClick={handleRetryGatewayRouting}
                      disabled={gatewayLoading}
                    >
                      {gatewayLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Loader2 className="mr-2 h-4 w-4" />}
                      Try Again
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => router.push('/')}
                    >
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Return to Homepage
                    </Button>
                  </div>
                )}

                {/* Allocation still resolving: never show a gateway before the
                    router has decided which one may take this payment. */}
                {gatewayLoading && !gatewayUnavailable && !gatewayAttempt && paymentProvider !== null && (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border p-8 text-center">
                    <Loader2 className="h-7 w-7 animate-spin text-teal-600" />
                    <p className="text-sm text-muted-foreground">Preparing your secure payment options…</p>
                  </div>
                )}

                {!gatewayLoading && paymentMethods.length > 0 && paymentView === "selection" && (
                  <>
                    <h3 className="mb-4 text-sm font-medium text-foreground">Select Payment Method</h3>

                    <div className="space-y-3">
                      {paymentMethods.map(method => (
                        <button
                          key={method.id}
                          onClick={() => {

                            setSelectedPaymentMethod(method.id);
                            setPaymentView(method.type === 'card' ? 'card-details' : 'bank-details');
                          }}
                          className="w-full rounded-lg border border-border bg-card p-4 text-left transition-all hover:border-border/80 hover:bg-accent"
                        >
                          <div className="flex items-center gap-3">
                            {method.icon}
                            <div className="flex-1">
                              <div className="font-medium text-card-foreground">{method.title}</div>
                              <div className="text-sm text-muted-foreground">{method.description}</div>
                            </div>
                            <ArrowLeft className="h-5 w-5 rotate-180 text-muted-foreground" />
                          </div>
                        </button>
                      ))}
                      {paymentProvider === 'stripe' && (
                        <div className="mt-2">
                          <StripeApplePayButton
                            quoteData={quoteData}
                            user={user}
                            quote={quote}
                            onProcessingChange={setIsProcessingPayment}
                            allTermsAccepted={allTermsAccepted}
                            settings={settings}
                            flp_checksum={flp_checksum}
                            gatewayAttemptId={gatewayAttempt?.id}
                            onGatewayFailure={handleGatewayFailure}
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {!gatewayUnavailable && paymentView === "card-details" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 rounded-lg bg-teal-50 p-4">
                      <CreditCard className="h-5 w-5 text-teal-600" />
                      <div>
                        <div className="font-medium text-card-foreground">
                          Credit or Debit Card{selectedPaymentMethod && selectedPaymentMethod !== 'bank' ? ` · ${getGatewayDisplayName(selectedPaymentMethod)}` : ''}
                        </div>
                        <div className="text-sm text-muted-foreground">Enter your card details below</div>
                      </div>
                    </div>

                    {selectedPaymentMethod === 'stripe' && (
                      <>
                        <StripePayment
                          ref={stripePaymentRef}
                          quoteData={quoteData}
                          user={user}
                          quote={quote}
                          onProcessingChange={setIsProcessingPayment}
                          flp_checksum={flp_checksum}
                          gatewayAttemptId={gatewayAttempt?.id}
                          onGatewayFailure={handleGatewayFailure}
                        />
                      </>
                    )}

                    {selectedPaymentMethod === 'authorizenet' && (
                      <AuthorizeNetPayment
                        ref={authorizePaymentRef}
                        quoteData={quoteData}
                        user={user}
                        quote={quote}
                        onProcessingChange={setIsProcessingPayment}
                        flp_checksum={flp_checksum}
                        settings={settings}
                        gatewayAttemptId={gatewayAttempt?.id}
                        onGatewayFailure={handleGatewayFailure}
                      />
                    )}

                    {selectedPaymentMethod === 'airwallex' && (
                      <div id="airwallex-card-element" ref={airwallexCardRef} className="border border-border rounded-lg p-4 mb-6"></div>
                    )}
                    {selectedPaymentMethod === 'square' && squareAppId && squareLocationId && (settings?.square?.paymentMethods?.card || settings?.square?.paymentMethods?.googlePay || settings?.square?.paymentMethods?.applePay) && (
                      allTermsAccepted ? (
                        <PaymentForm
                          applicationId={squareAppId}
                          locationId={squareLocationId}
                          cardTokenizeResponseReceived={handleSquarePayment}
                          createPaymentRequest={createPaymentRequest}
                          createVerificationDetails={createVerificationDetails}
                        >
                          <div className="space-y-4 my-4">
                            {settings?.square?.paymentMethods?.googlePay && <SquareGooglePay />}
                            {settings?.square?.paymentMethods?.applePay && <SquareApplePay />}
                            {settings?.square?.paymentMethods?.card && (
                              <div className="border border-border rounded-lg p-4">
                                <SquareCreditCard />
                              </div>
                            )}
                          </div>
                        </PaymentForm>
                      ) : (
                        <div className="rounded-lg border border-dashed border-yellow-500 bg-yellow-50 p-6 text-center">
                          <p className="text-sm font-medium leading-relaxed text-yellow-800">
                            Please accept all terms and conditions above to proceed with payment.
                          </p>
                        </div>
                      )
                    )}
                    {selectedPaymentMethod === 'square' && !(squareAppId && squareLocationId && (settings?.square?.paymentMethods?.card || settings?.square?.paymentMethods?.googlePay || settings?.square?.paymentMethods?.applePay)) && (
                      <div className="rounded-lg border border-dashed border-yellow-500 bg-yellow-50 p-6 text-center">
                        <p className="text-sm font-medium leading-relaxed text-yellow-800">
                          Square is not available on this store right now. Switching you to the next secure payment provider…
                        </p>
                      </div>
                    )}
                    {(selectedPaymentMethod === 'mollie' || selectedPaymentMethod === 'paypal' || selectedPaymentMethod === 'viva' || selectedPaymentMethod === 'lemonsqueezy' || selectedPaymentMethod === 'checkoutcom') && (
                      <div className="rounded-lg border border-border bg-muted p-6 text-center">
                        <p className="text-sm leading-relaxed text-muted-foreground">
                          You will be redirected to our payment processor's secure page to complete your payment.
                        </p>
                      </div>
                    )}

                    <div className="space-y-3 pt-2">
                      {checkboxContent.map((content, index) => (
                        <div className="flex items-start space-x-3" key={index}>
                          <Checkbox
                            id={`checkout-checkbox-${index}`}
                            checked={checkboxStates[index] || false}
                            onCheckedChange={(c) => handleCheckboxChange(index, c as boolean)}
                            className="mt-0.5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <label
                            htmlFor={`checkout-checkbox-${index}`}
                            className="text-sm text-muted-foreground richtext-label"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                          />
                        </div>
                      ))}
                    </div>

                    {selectedPaymentMethod === 'paddle' ? (
                      <PaddleCheckoutButton
                        quoteData={quoteData}
                        user={user}
                        discountedTotal={quoteData.total}
                        disabled={!allTermsAccepted}
                        flp_checksum={flp_checksum}
                        settings={settings}
                        quote={quote}
                        gatewayAttemptId={gatewayAttempt?.id}
                        onGatewayFailure={handleGatewayFailure}
                      />
                    ) : selectedPaymentMethod === 'viva' ? (
                      <VivaCheckoutButton
                        quoteData={quoteData}
                        user={user}
                        discountedTotal={quoteData.total}
                        disabled={!allTermsAccepted}
                        flp_checksum={flp_checksum}
                        settings={settings}
                        quote={quote}
                        gatewayAttemptId={gatewayAttempt?.id}
                        onGatewayFailure={handleGatewayFailure}
                      />
                    ) : selectedPaymentMethod === 'lemonsqueezy' ? (
                      <Button
                        onClick={handleCompletePayment}
                        className="h-14 w-full rounded-lg bg-teal-600 text-base font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                        disabled={!allTermsAccepted || isProcessingPayment}
                      >
                        {isProcessingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                        {isProcessingPayment ? 'Processing...' : `Pay £${(quoteData.total).toFixed(2)}`}
                      </Button>
                    )
                      : selectedPaymentMethod !== 'square' && (
                        <Button
                          onClick={handleCompletePayment}
                          className="h-14 w-full rounded-lg bg-teal-600 text-base font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                          disabled={!allTermsAccepted || isProcessingPayment}
                        >
                          {isProcessingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                          {isProcessingPayment ? 'Processing...' : `Pay £${(quoteData.total).toFixed(2)}`}
                        </Button>
                      )}

                    <Button variant="outline" onClick={() => setPaymentView("selection")} className="w-full gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Return to Payment Methods
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Secure & Encrypted</span>
                    </div>
                  </div>
                )}

                {paymentView === "bank-details" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 rounded-lg bg-teal-50 p-4">
                      <Building2 className="h-5 w-5 text-teal-600" />
                      <div>
                        <div className="font-medium text-card-foreground">Bank Transfer</div>
                        <div className="text-sm text-muted-foreground">Direct payment from your bank</div>
                      </div>
                    </div>

                    <div className="rounded-lg border border-border bg-muted p-6 text-center">
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        Once you confirm your order, we\'ll provide complete bank transfer instructions including all
                        account details needed to complete your payment securely.
                      </p>
                    </div>

                    <div className="space-y-3 pt-2">
                      {checkboxContent.map((content, index) => (
                        <div className="flex items-start space-x-3" key={index}>
                          <Checkbox
                            id={`checkout-checkbox-bank-${index}`}
                            checked={checkboxStates[index] || false}
                            onCheckedChange={(c) => handleCheckboxChange(index, c as boolean)}
                            className="mt-0.5 data-[state=checked]:bg-teal-600 data-[state=checked]:border-teal-600"
                          />
                          <label
                            htmlFor={`checkout-checkbox-bank-${index}`}
                            className="text-sm text-muted-foreground"
                            dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }}
                          />
                        </div>
                      ))}
                    </div>


                    <Button
                      onClick={handleCompletePayment}
                      className="h-14 w-full rounded-lg bg-teal-600 text-base font-semibold text-white shadow-lg shadow-teal-600/25 transition-all hover:bg-teal-700 hover:shadow-xl hover:shadow-teal-600/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                      disabled={!allTermsAccepted || isProcessingPayment}
                    >
                      {isProcessingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                      {isProcessingPayment ? 'Processing...' : `Pay £${(quoteData.total).toFixed(2)}`}
                    </Button>

                    <Button variant="outline" onClick={() => setPaymentView("selection")} className="w-full gap-2">
                      <ArrowLeft className="h-4 w-4" />
                      Return to Payment Methods
                    </Button>

                    <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                      <Shield className="h-4 w-4" />
                      <span>Secure & Encrypted</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Admin-only routing diagnostics: why this provider, and what the
                last gateway error actually said. */}
            {isAdmin && (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-xs text-slate-700">
                <button
                  type="button"
                  onClick={() => setShowDebugPanel((value) => !value)}
                  className="flex w-full items-center justify-between text-sm font-semibold text-slate-800"
                >
                  <span>Payment debug (admin only)</span>
                  <span className="text-slate-500">{showDebugPanel ? 'Hide' : 'Show'}</span>
                </button>

                {showDebugPanel && (
                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="font-semibold text-slate-600">Routed attempt</div>
                      {gatewayAttempt ? (
                        <div className="font-mono">
                          {gatewayAttempt.provider} · attempt {gatewayAttempt.attemptNumber}/{gatewayAttempt.maxAttempts} · {gatewayAttempt.status}<br />
                          id {gatewayAttempt.id}<br />
                          checkout {gatewayAttempt.checkoutId}
                        </div>
                      ) : (
                        <div className="font-mono">{gatewayLoading ? 'resolving…' : 'no attempt allocated'}</div>
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-600">Routing decision</div>
                      {routingDebug ? (
                        <div className="space-y-1">
                          <div className="font-mono">{describeRouting(routingDebug, gatewayAttempt?.provider)}</div>
                          <div className="font-mono">
                            order {(routingDebug.order || []).join(' → ')} · picked {routingDebug.selected ?? '—'} · round {routingDebug.round}<br />
                            already tried: {routingDebug.previouslyTried?.length ? routingDebug.previouslyTried.join(', ') : 'none'}
                            {routingDebug.roundReset ? ` · new round started (reset ${routingDebug.resetGateways?.join(', ')})` : ''}
                            <br />
                            {Object.entries(routingDebug.states || {}).map(([gateway, state]) => (
                              <span key={gateway} className="mr-3">
                                {gateway}: {state.quota > 0 ? `${state.used}/${state.quota}` : `${state.used}/∞`}
                                {state.autoPaused ? ' (auto-paused)' : ''}
                                {state.customerCooldown ? ' (cooldown)' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="font-mono">not available (not signed in as admin when allocating)</div>
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-600">Last failure</div>
                      {lastFailure ? (
                        <div className="font-mono">
                          {lastFailure.code} · {new Date(lastFailure.at).toLocaleTimeString()}<br />
                          {lastFailure.message || 'no provider message'}
                        </div>
                      ) : (
                        <div className="font-mono">none</div>
                      )}
                    </div>

                    <div>
                      <div className="font-semibold text-slate-600">Checkout log (this session)</div>
                      {debugLog.length ? (
                        <ol className="mt-1 max-h-64 space-y-1 overflow-auto font-mono">
                          {debugLog.slice().reverse().map((entry, index) => (
                            <li key={`${entry.at}-${index}`} className="break-all">
                              <span className="text-slate-500">{new Date(entry.at).toLocaleTimeString()}</span> {entry.event}
                              {entry.data !== undefined && formatDebugData(entry.data) ? (
                                <span className="text-slate-500"> — {formatDebugData(entry.data)}</span>
                              ) : null}
                            </li>
                          ))}
                        </ol>
                      ) : (
                        <div className="font-mono">no events yet</div>
                      )}
                    </div>

                    <div className="text-slate-500">
                      Full history (every attempt with its failure reason) is in Admin → Settings → Payment → Payment diagnostics.
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50">
                  <Shield className="h-5 w-5 text-teal-600" />
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-card-foreground">Technical Support & Refunds</h3>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    If you experience any technical issues during your payment or delivery, please contact our support
                    team immediately. Refunds are available if any issues occur during the delivery process that prevent
                    you from using the service as intended.
                  </p>
                  <a
                    href="/contact"
                    className="inline-flex items-center gap-1 text-sm font-medium text-teal-600 hover:underline"
                  >
                    Contact Support
                    <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      {isProcessingPayment && (
        <div className="fixed inset-0 bg-white bg-opacity-80 backdrop-blur-sm flex flex-col items-center justify-center" style={{ zIndex: 999 }}>
          <Loader2 className="h-10 w-10 animate-spin text-teal-600" />
          <p className="mt-4 text-lg font-semibold text-gray-700">Processing...</p>
          <p className="text-sm text-gray-500">Please do not close this window.</p>
        </div>
      )}
    </div>
  );
}

const DynamicQuoteCheckoutPage = dynamic(() => Promise.resolve(QuoteCheckoutPage), { ssr: false });

export default function QuoteCheckoutPageWrapper() {
  const settings = useSettings();
  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);

  // The router may allocate Stripe even when it is not the first provider in
  // the order, so Elements is mounted whenever Stripe is configured at all -
  // otherwise a Stripe-routed checkout would have no card form to mount.
  const stripeConfigured = getConfiguredGatewayOrder(settings?.paymentProvider).includes('stripe')
    || settings?.paymentProvider?.activeProcessor === 'stripe';

  useEffect(() => {
    if (stripeConfigured && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY));
    }
  }, [stripeConfigured, settings]);

  if (!settings) {
    return <Loading />;
  }

  const page = <DynamicQuoteCheckoutPage />;

  if (stripeConfigured && stripePromise) {
    return <Elements stripe={stripePromise}>{page}</Elements>;
  }

  return page;
}