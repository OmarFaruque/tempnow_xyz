"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CheckCircle, FileText, ArrowLeft } from "lucide-react"
import { Header } from "@/components/header"
import { useSearchParams, useRouter } from "next/navigation"



export default function PaymentConfirmationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [paymentStatus, setPaymentStatus] = useState("processing") // "processing", "success", "failed"
  const [quotes, setQuotes] = useState<any | null>(null) // Allow null for initial state
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const transactionId = searchParams.get("t")
    const orderCode = searchParams.get("s") // This is Viva's order code
    const paypalOrderId = searchParams.get("token") // This is PayPal's order ID for non-Viva payments
    const gatewayAttemptId = searchParams.get("gatewayAttemptId") // Routed gateway attempt (Stripe & friends)
    const localStoragePolicyNumber = localStorage.getItem('quotePolicyNumber'); // Get policyNumber from localStorage

    const quoteLocal = localStorage.getItem("quoteData")

    const readLocalQuote = () => {
      if (!quoteLocal) return null
      try {
        return JSON.parse(quoteLocal)
      } catch {
        return null
      }
    }

    // Scenario 1: Viva payment (with transactionId, orderCode, and localStoragePolicyNumber)
    if (transactionId && orderCode && localStoragePolicyNumber) {
      const confirmVivaPayment = async () => {
        try {
          const bodyData: { transactionId: string; orderCode: string; policyNumber: string } = {
            transactionId,
            orderCode,
            policyNumber: localStoragePolicyNumber,
          };

          const response = await fetch("/api/viva-payment-confirm", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyData),
          })

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || "Failed to confirm Viva payment.");
          }

          const data = await response.json()
          if (data.success) {
            setPaymentStatus("success")
            setQuotes(data.quote) // Assuming the updated quote is returned
            localStorage.removeItem('quotePolicyNumber'); // Clean up localStorage after successful Viva payment
          } else {
            setPaymentStatus("failed")
            setError(data.error || "Payment confirmation failed.")
          }
        } catch (err: any) {
          setPaymentStatus("failed")
          setError(err.message || "An unexpected error occurred.")
          router.push("/payment-failed") // Redirect to payment failed page on error
        }
      }
      confirmVivaPayment()
    }

    // Scenario 2: PayPal payment return (with token and quote in local storage)
    if (paypalOrderId && quoteLocal) {
      const confirmPayPalPayment = async () => {
        try {
          const quoteData = JSON.parse(quoteLocal)
          const policyNumber = quoteData?.policyNumber

          if (!policyNumber) {
            throw new Error("Policy number is missing for PayPal confirmation.")
          }

          const response = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              orderId: paypalOrderId,
              policyNumber,
            }),
          })

          const data = await response.json()
          if (!response.ok || !data.success) {
            throw new Error(data.error || 'Failed to confirm PayPal payment.')
          }

          setPaymentStatus('success')
          setQuotes(data.quote)
          localStorage.removeItem('quotePolicyNumber')
        } catch (err: any) {
          setPaymentStatus('failed')
          setError(err.message || 'An unexpected error occurred.')
          router.push('/payment-failed')
        }
      }

      confirmPayPalPayment()
      return
    }


    // Stripe before this page claims success, so the order is fulfilled even when
    // the webhook was delayed or dropped.
    if (gatewayAttemptId) {
      const settleAsPaid = (quote: any) => {
        const localQuote = readLocalQuote()
        setQuotes({
          ...(localQuote || {}),
          ...(quote || {}),
          policyNumber: quote?.policyNumber || localQuote?.policyNumber,
        })
        setPaymentStatus("success")
        localStorage.removeItem('quotePolicyNumber')
      }

      const confirmGatewayPayment = async () => {
        const localQuote = readLocalQuote()

        try {
          // Stripe is usually done by the time we get here, but give it a few
          // seconds for the rare "still processing" case.
          for (let poll = 0; poll < 5; poll++) {
            const response = await fetch('/api/quote-checkout/verify-stripe', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ gatewayAttemptId }),
            })
            const data = await response.json().catch(() => ({}))

            if (data?.outcome === 'succeeded') {
              settleAsPaid(data.quote)
              return
            }

            if (data?.outcome === 'failed') {
              setPaymentStatus('failed')
              setError(
                data?.message ||
                'Stripe did not complete this payment. You have not been charged - please try again.',
              )
              return
            }

            // Another gateway owns this attempt (or the attempt is unknown):
            // keep the previous behaviour for those flows.
            if (data?.outcome === 'not-stripe' || data?.outcome === 'unknown') break

            await new Promise((resolve) => setTimeout(resolve, 1500))
          }
        } catch (err) {
          console.error('Payment confirmation request failed:', err)
        }

        if (localQuote) {
          setQuotes(localQuote)
          setPaymentStatus("success") // Assume success if no confirmation is possible and local data exists
          localStorage.removeItem('quotePolicyNumber') // Clean up in case it was left over from a previous Viva attempt
          return
        }

        setProcessingNote(
          "Your payment went through, but Stripe is still confirming it. Refresh this page in a moment - your documents will be emailed as soon as it completes.",
        )
      }

      confirmGatewayPayment()
      return
    }
    // Scenario 4: Existing local storage quote data (non-Viva or initial load for other payment types)
    if (quoteLocal) {
      const quoteData = JSON.parse(quoteLocal)
      setQuotes(quoteData)
      setPaymentStatus("success") // Assume success if no Viva/PayPal params and local data exists
      localStorage.removeItem('quotePolicyNumber'); // Clean up in case it was left over from a previous Viva attempt
    }
    // Scenario 3: No relevant data, redirect to home
    else {
      router.push("/")
    }

  }, [router, searchParams])

  if (paymentStatus === "processing") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-teal-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-600">Please wait while we confirm your payment...</p>
          </div>
        </main>
      </div>
    )
  }

  if (paymentStatus === "failed") {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center p-8 bg-white shadow-lg rounded-xl">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Failed</h1>
            <p className="text-lg text-gray-600 mb-8">{error || "There was an issue processing your payment. Please try again."}</p>
            <Link href="/">
              <Button className="bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2">
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Home</span>
              </Button>
            </Link>
          </div>
        </main>
      </div>
    )
  }

  // If paymentStatus is "success"
  if (!quotes) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Loading Order Details...</h1>
            <p className="text-gray-600">Please wait while we retrieve your order information...</p>
          </div>
        </main>
      </div>
    )
  }



  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-lg border border-gray-200 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
            <p className="text-lg text-gray-600 mb-8">
              Your document has been purchased successfully. You should receive an email confirmation shortly.
            </p>

            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Number:</span>
                  <span className="font-medium">{quotes?.policyNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{new Date(quotes?.updatedAt).toLocaleDateString("en-GB")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount Paid:</span>
                  <span className="font-medium">£{Number(quotes?.updatePrice ?? quotes?.cpw).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/policy/view?number=${quotes?.policyNumber}`}>
                <Button className="bg-teal-600 hover:bg-teal-700 text-white flex items-center space-x-2">
                  <FileText className="w-4 h-4" />
                  <span>View Documents</span>
                </Button>
              </Link>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <Link href="/">
                <Button variant="ghost" className="flex items-center space-x-2 mx-auto">
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Home</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
