import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { quotes } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { getPaddleApiKey, getPaddleEnvironment } from '@/lib/paddle'
import { isRequestThrottled } from '@/core/session-guard'
import { getPaymentCustomerIdentity } from '@/core/payment-auth'
import {
    getPaymentGatewayAttempt,
    isPaymentGatewayAttemptOwnedByCustomer,
    markPaymentGatewayAttempt,
} from '@/core/payment-rotation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * Confirm-on-return for Paddle (the counterpart of `verify-stripe`).
 *
 * Paddle's overlay reports success in the browser, but a browser can claim
 * anything. This endpoint asks Paddle for the transaction, checks that it is
 * really paid and that it belongs to the routed attempt, and only then settles
 * the attempt and marks the quote as paid. If Paddle is unreachable the caller
 * keeps its legacy behaviour, so a network hiccup never blocks a real payment.
 */

const PAID_STATUSES = new Set(['completed', 'billed', 'paid'])

function readCustomData(transaction: any): Record<string, any> | null {
    const direct = transaction?.custom_data ?? transaction?.customData
    if (direct && typeof direct === 'object') return direct
    const items = Array.isArray(transaction?.items) ? transaction.items : []
    for (const item of items) {
        const nested = item?.price?.custom_data ?? item?.price?.customData
        if (nested && typeof nested === 'object') return nested
    }
    return null
}

export async function POST(request: NextRequest) {
    if (isRequestThrottled(request)) {
        return NextResponse.json({ success: false, error: 'Too many requests.' }, { status: 429 })
    }

    let body: { gatewayAttemptId?: unknown; transactionId?: unknown } | null = null
    try {
        body = await request.json()
    } catch {
        body = null
    }

    const gatewayAttemptId = typeof body?.gatewayAttemptId === 'string' ? body.gatewayAttemptId : ''
    const transactionId = typeof body?.transactionId === 'string' ? body.transactionId : ''
    if (!gatewayAttemptId || !transactionId) {
        return NextResponse.json({ success: false, error: 'gatewayAttemptId and transactionId are required.' }, { status: 400 })
    }

    const customer = await getPaymentCustomerIdentity(request)
    if (!customer) {
        return NextResponse.json({ success: false, error: 'Sign in to confirm this payment.' }, { status: 401 })
    }

    const attempt = await getPaymentGatewayAttempt(gatewayAttemptId)
    if (!attempt || !(await isPaymentGatewayAttemptOwnedByCustomer(gatewayAttemptId, customer.id, customer.email))) {
        return NextResponse.json({ success: false, error: 'Payment attempt not found.' }, { status: 404 })
    }
    if (attempt.gateway !== 'paddle') {
        return NextResponse.json({ success: false, error: 'This payment attempt is not a Paddle checkout.' }, { status: 409 })
    }
    const quoteId = attempt.checkoutId.startsWith('quote:') ? attempt.checkoutId.slice('quote:'.length) : ''
    const numericQuoteId = Number(quoteId)
    if (!quoteId || !Number.isSafeInteger(numericQuoteId) || numericQuoteId <= 0) {
        return NextResponse.json({ success: false, error: 'This payment attempt is not a quote checkout.' }, { status: 409 })
    }

    let apiKey: string
    let environment: string
    try {
        apiKey = await getPaddleApiKey()
        environment = String(await getPaddleEnvironment())
    } catch (error) {
        console.error('Paddle verification: credentials are not configured.', error)
        return NextResponse.json({ success: false, error: 'Paddle is not configured.' }, { status: 500 })
    }

    const apiUrl = environment === 'production' ? 'https://api.paddle.com' : 'https://sandbox-api.paddle.com'

    let transaction: any = null
    try {
        const response = await fetch(`${apiUrl}/transactions/${encodeURIComponent(transactionId)}`, {
            headers: { Authorization: `Bearer ${apiKey}` },
            cache: 'no-store',
        })
        const payload = await response.json().catch(() => null)
        if (!response.ok || !payload?.data) {
            console.error(`Paddle verification: transaction ${transactionId} could not be read (status ${response.status}).`, payload)
            return NextResponse.json({ success: false, error: 'Could not verify this payment with Paddle.' }, { status: 502 })
        }
        transaction = payload.data
    } catch (error) {
        console.error(`Paddle verification: request for transaction ${transactionId} failed.`, error)
        return NextResponse.json({ success: false, error: 'Could not reach Paddle to verify this payment.' }, { status: 502 })
    }

    const status = String(transaction?.status || '').toLowerCase()
    if (!PAID_STATUSES.has(status)) {
        return NextResponse.json({
            success: false,
            outcome: 'not-paid',
            status,
            error: `Paddle reports this transaction as "${status || 'unknown'}".`,
        }, { status: 409 })
    }

    const customData = readCustomData(transaction)
    if (customData?.gatewayAttemptId && String(customData.gatewayAttemptId) !== gatewayAttemptId) {
        console.error(`Paddle verification: attempt mismatch (${customData.gatewayAttemptId} !== ${gatewayAttemptId}).`)
        return NextResponse.json({ success: false, error: 'This payment belongs to a different checkout attempt.' }, { status: 409 })
    }
    if (customData?.quote_details) {
        try {
            const details = typeof customData.quote_details === 'string' ? JSON.parse(customData.quote_details) : customData.quote_details
            if (details?.id && String(details.id) !== String(numericQuoteId)) {
                return NextResponse.json({ success: false, error: 'This payment belongs to a different quote.' }, { status: 409 })
            }
        } catch {
            // Unreadable metadata is not a reason to reject a paid transaction.
        }
    }

    await markPaymentGatewayAttempt(gatewayAttemptId, 'succeeded', { providerReference: transactionId })

    const paidAt = new Date().toISOString()
    await db.update(quotes).set({
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'paddle',
        paymentIntentId: transactionId,
        paymentDate: paidAt,
        updatedAt: paidAt,
    }).where(eq(quotes.id, numericQuoteId))

    revalidatePath('/api/quotes')
    revalidatePath('/administrator')
    revalidatePath('/api/admin/quotes')

    // Fire-and-forget so the confirmation page is not held up by email.
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
    }).catch((error) => console.error('Error calling send-confirmation after Paddle verification:', error))

    console.log(`[payment-routing] Paddle attempt ${gatewayAttemptId} verified as ${status} (transaction ${transactionId}).`)
    return NextResponse.json({ success: true, quoteId, transactionId, status })
}
