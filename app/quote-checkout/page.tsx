'use client';

import React from 'react';
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


const StripePayment = React.forwardRef(({ quoteData, user, quote, onProcessingChange, flp_checksum }, ref) => {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  React.useImperativeHandle(ref, () => ({
    async handlePayment() {
      if (!stripe || !elements) {
        toast({ variant: "destructive", title: "Payment Error", description: "Stripe is not available." });
        onProcessingChange(false);
        return;
      }
      onProcessingChange(true);
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
          }),
        });
        const { clientSecret, error: clientSecretError } = await response.json();
        if (clientSecretError) throw new Error(clientSecretError.message || "Could not initiate Stripe payment.");
        
        const cardNumberElement = elements.getElement(CardNumberElement);
        if (!cardNumberElement) throw new Error("Card element not found.");

        const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: { card: cardNumberElement },
        });
        if (error) throw error;
        if (paymentIntent.status === "succeeded") {
          toast({ title: "Payment Successful", description: "Your payment has been processed." });
          localStorage.removeItem('quoteCreationTimestamp');
          window.location.href = "/payment-confirmation";
        }
      } catch (error: any) {
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
            <CardNumberElement id="cardNumber" className="h-11 pr-14 p-3 border border-border rounded-lg" options={{style: {base: {fontSize: '16px'}}}} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="expiry" className="text-sm font-medium text-foreground">
            Expiry Date
          </Label>
          <CardExpiryElement id="expiry" className="h-11 p-3 border border-border rounded-lg" options={{style: {base: {fontSize: '16px'}}}} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="cvv" className="text-sm font-medium text-foreground">
            CVV
          </Label>
          <CardCvcElement id="cvv" className="h-11 p-3 border border-border rounded-lg" options={{style: {base: {fontSize: '16px'}}}} />
        </div>
      </div>
    </div>
  );
});
StripePayment.displayName = 'StripePayment';


const AuthorizeNetPayment = React.forwardRef(({ quoteData, user, quote, onProcessingChange, flp_checksum, settings }, ref) => {
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
          }),
        });

        const data = await response.json();
        if (!response.ok || !data.success) {
          throw new Error(data.details || data.error || 'Authorize.Net payment failed.');
        }

        toast({ title: 'Payment Successful', description: 'Your payment has been processed.' });
        localStorage.removeItem('quoteCreationTimestamp');
        window.location.href = '/payment-confirmation';
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
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

const StripeApplePayButton = ({ quoteData, user, quote, onProcessingChange, allTermsAccepted, settings, flp_checksum }) => {
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
                    window.location.href = "/payment-confirmation";
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
                        }),
                    });
                    const { clientSecret, error: clientSecretError } = await response.json();
                    if (!mounted) return;
                    if (clientSecretError) throw new Error(clientSecretError.message || "Could not initiate Stripe payment.");

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

const PaddleCheckoutButton = ({ quoteData, user, discountedTotal, disabled, flp_checksum, settings, quote }) => {
  const { paddle, loading: isPaddleLoading } = usePaddle();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const handlePaddlePayment = async () => {
    if (!paddle) {
      toast({ variant: "destructive", title: "Payment Error", description: "Paddle is not available." });
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
        }),
      });
      const data = await response.json();
      if (data.priceId) {
        paddle.Checkout.open({ items: [{ priceId: data.priceId, quantity: 1 }] });
      } else {
        throw new Error(data.error || "Could not initiate Paddle payment.");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Payment Error", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isPaddleLoading || isProcessing;

  return (
    <Button 
        onClick={handlePaddlePayment} 
        className="h-14 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg" 
        disabled={disabled || isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
      {isLoading ? 'Processing...' : `Pay £${discountedTotal.toFixed(2)}`}
    </Button>
  );
};

const VivaCheckoutButton = ({ quoteData, user, discountedTotal, disabled, flp_checksum, settings, quote }) => {
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
        }),
      });
      const data = await response.json();
      if (data.orderCode) {
        localStorage.setItem('quotePolicyNumber', quote.policyNumber); // Store policyNumber
        localStorage.removeItem('quoteCreationTimestamp'); // Clear timestamp
        const vivaEnv = settings.viva.env === 'demo' ? 'demo' : 'www';
        window.location.href = `https://${vivaEnv}.vivapayments.com/web/checkout?ref=${data.orderCode}`;
      } else {
        throw new Error(data.error || "Could not initiate Viva payment.");
      }
    } catch (error: any) {
      toast({ variant: "destructive", title: "Payment Error", description: error.message });
    } finally {
      setIsProcessing(false);
    }
  };

  const isLoading = isProcessing;

  return (
    <Button 
        onClick={handleVivaPayment} 
        className="h-14 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg" 
        disabled={disabled || isLoading}
    >
      {isLoading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
      {isLoading ? 'Processing...' : `Pay £${discountedTotal.toFixed(2)}`}
    </Button>
  );
};

function QuoteCheckoutPage() {
  const { isAuthenticated, user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const settings = useSettings();
  const [quoteData, setQuoteData] = useState<QuoteData | null>(null);
  const [quote, setQuote] = useState<any>({});
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [paymentView, setPaymentView] = useState<"selection" | "card-details" | "bank-details">("selection");
  const [checkboxContent, setCheckboxContent] = useState<string[]>([]);
  const [checkboxStates, setCheckboxStates] = useState<boolean[]>([]);
  const flp_checksum = Cookies.get('flp_checksum');


  const paymentProvider = settings?.paymentProvider?.activeProcessor;
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

  const paymentMethods = [];
  if (paymentProvider) {
    let providerTitle = paymentProvider.charAt(0).toUpperCase() + paymentProvider.slice(1);
    let providerDescription = 'Securely pay with your card.';
    if (paymentProvider === 'square') {
        providerDescription = 'Pay with Card, Google Pay, or Apple Pay.';
    }
    paymentMethods.push({
      id: paymentProvider,
      title: `Credit or Debit Card`,
      description: 'Visa, Mastercard, Amex accepted',
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
          'I confirm I\'ve read and agree to the <a href="/terms-of-services" target="_blank" class="font-medium text-primary hover:underline">Terms of Service</a> and understand this is a non-refundable digital document service. *',
          'I acknowledge that all purchases are final and the information I have entered is accurate *'
        ];
      }
      setCheckboxContent(content);
      setCheckboxStates(Array(content.length).fill(false));
    }
  }, [isAuthenticated, authLoading, router, settings, toast]);

  useEffect(() => {
    if (selectedPaymentMethod === 'airwallex' && isAuthenticated && quoteData) {
      const initAirwallex = async () => {
        try {
          const Airwallex = (await import('airwallex-payment-elements')).default;
          await Airwallex.loadAirwallex({ env: 'demo' });
          const response = await fetch('/api/quote-checkout/create-airwallex-payment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              quoteData: { ...quoteData, total: quoteData?.total },
              user: user,
              flp_checksum: flp_checksum,
            }),
          });
          const { clientSecret, intentId } = await response.json();
          const cardElement = Airwallex.createElement('card', {
            intent: { id: intentId, client_secret: clientSecret },
          });
          cardElement.mount(airwallexCardRef.current!);
          setAirwallexElement(cardElement);
        } catch (error) {
          console.error('Airwallex initialization failed:', error);
          toast({ variant: 'destructive', title: 'Payment Error', description: 'Failed to initialize Airwallex.' });
        }
      };
      initAirwallex();
    }
  }, [selectedPaymentMethod, isAuthenticated, toast, quoteData, user]);

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
                }),
            });
            const data = await response.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error(data.error || 'Could not initiate payment.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
            setIsProcessingPayment(false);
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
                }),
            });
            const data = await response.json();
            if (data.checkoutUrl) {
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error(data.error || 'Could not initiate payment.');
            }
        } catch (error: any) {
            toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
            setIsProcessingPayment(false);
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

  const handleSquarePayment = async (token: any) => {
    if (!token) return;
    setIsProcessingPayment(true);
    try {
      const response = await fetch('/api/quote-checkout/create-square-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceId: token.token,
          quoteData: { ...quoteData, id: quote.id, total: quoteData?.total },
          user: user,
          flp_checksum: flp_checksum,
        }),
      });
      if (response.ok) {
        toast({ title: 'Payment Successful', description: 'Your payment has been processed.' });
        localStorage.removeItem('quoteCreationTimestamp');
        window.location.href = '/payment-confirmation';
      } else {
        const error = await response.json();
        throw new Error(error.details || 'Square payment failed.');
      }
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Payment Error', description: error.message });
    } finally {
      setIsProcessingPayment(false);
    }
  };

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
      <header className="bg-primary px-6 py-4">
        <div className="mx-auto max-w-7xl">
          <Link href="/" className="text-2xl font-bold text-white hover:text-teal-100 transition-colors">
            {settings?.general?.siteName || 'MONZIC'}
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
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Lock className="h-6 w-6 text-primary" />
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
              <div className="h-1 bg-gradient-to-r from-primary/80 to-primary" />

              <div className="border-b border-border bg-muted bg-section-header px-6 py-4">
                <h2 className="text-sm font-semibold text-card-foreground">Docs Summary</h2>
              </div>
              <div className="divide-y divide-border p-6">
                <div className="flex items-center gap-4 pb-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground">Registration</div>
                    <div className="text-base font-semibold text-card-foreground">{quoteData.customerData.registration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Car className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground">Vehicle</div>
                    <div className="text-base font-semibold text-card-foreground">{quoteData.customerData.vehicle.make} {quoteData.customerData.vehicle.model}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 py-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Clock className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground">Duration</div>
                    <div className="text-base font-semibold text-card-foreground">{quoteData.breakdown.duration}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4 pt-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="text-xs font-medium text-muted-foreground">Name</div>
                    <div className="text-base font-semibold text-card-foreground">{quoteData.customerData.firstName} {quoteData.customerData.lastName}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
              <div className="h-1 bg-gradient-to-r from-primary/80 to-primary" />

              <div className="p-6">
                <div className="mb-6 flex items-center gap-3 border-b border-border pb-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <h2 className="text-base font-semibold text-foreground">Payment Method</h2>
                </div>

                <div className="mb-6 rounded-lg border border-border bg-primary/5 p-5 text-center">
                  <div className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Amount Due
                  </div>
                  <div className="text-4xl font-bold text-primary">£{(quoteData.total).toFixed(2)}</div>
                </div>

                {paymentView === "selection" && (
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
                          />
                        </div>
                      )}
                    </div>
                  </>
                )}

                {paymentView === "card-details" && (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <div className="font-medium text-card-foreground">Credit or Debit Card</div>
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
                                className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                        />
                    ) : selectedPaymentMethod === 'lemonsqueezy' ? (
                      <Button
                      onClick={handleCompletePayment}
                      className="h-14 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
                      disabled={!allTermsAccepted || isProcessingPayment}
                      >
                      {isProcessingPayment ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Lock className="mr-2 h-5 w-5" />}
                      {isProcessingPayment ? 'Processing...' : `Pay £${(quoteData.total).toFixed(2)}`}
                      </Button>
                    )
                     : selectedPaymentMethod !== 'square' && (
                        <Button
                        onClick={handleCompletePayment}
                        className="h-14 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
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
                    <div className="flex items-center gap-3 rounded-lg bg-primary/10 p-4">
                      <Building2 className="h-5 w-5 text-primary" />
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
                                className="mt-0.5 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
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
                      className="h-14 w-full rounded-lg bg-primary text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30 hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
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

            <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Shield className="h-5 w-5 text-primary" />
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
                    className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
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

  const paymentProvider = settings?.paymentProvider?.activeProcessor;

  useEffect(() => {
    if (paymentProvider === 'stripe' && process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) {
      setStripePromise(loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY));
    }
  }, [paymentProvider, settings]);

  if (!settings) {
    return <Loading />; 
  }

  const page = <DynamicQuoteCheckoutPage />;

  if (paymentProvider === 'stripe' && stripePromise) {
    return <Elements stripe={stripePromise}>{page}</Elements>;
  }

  return page;
}