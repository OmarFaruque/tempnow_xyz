import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { getPaymentCustomerIdentity } from '@/core/payment-auth'
import { db } from '@/lib/db'
import { quotes } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import {
    getPaymentGatewayAttempt,
    getPaymentGatewayStats,
    getRecentPaymentGatewayAttempts,
    isPaymentGatewayAttemptOwnedByCustomer,
    PaymentRoutingError,
    recordPaymentGatewayAttemptError,
    reserveNextPaymentGateway,
    resetPaymentQuotaRounds,
    retryPaymentGatewayAttempt,
} from '@/core/payment-rotation'
import { PAYMENT_GATEWAYS, type PaymentGatewayId, type PaymentProduct } from '@/core/payment-gateways'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function publicError(error: unknown) {
    if (error instanceof PaymentRoutingError) {
        return NextResponse.json({ success: false, code: error.code, error: error.message }, { status: 409 })
    }
    console.error('Payment routing request failed:', error)
    return NextResponse.json({ success: false, error: 'Unable to prepare a secure payment option right now.' }, { status: 500 })
}

function asGateway(value: unknown): PaymentGatewayId | null {
    return (PAYMENT_GATEWAYS as readonly { id: string }[]).some((entry) => entry.id === value)
        ? (value as PaymentGatewayId)
        : null
}

export async function GET(request: NextRequest) {
    try {
        if (request.nextUrl.searchParams.get('stats') === '1') {
            if (!(await isAdmin(request))) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
            }
            return NextResponse.json({ success: true, gateways: await getPaymentGatewayStats() }, {
                headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
            })
        }

        // Operator diagnostics: the most recent attempts with the exact reason
        // each one failed. This is what turns "the gateway failed" into
        // "Square returned CARD_DECLINED at 14:02".
        if (request.nextUrl.searchParams.get('attempts') === '1') {
            if (!(await isAdmin(request))) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
            }
            const limit = Number(request.nextUrl.searchParams.get('limit') || 50)
            const gateway = asGateway(request.nextUrl.searchParams.get('gateway'))
            return NextResponse.json({ success: true, attempts: await getRecentPaymentGatewayAttempts(limit, gateway) }, {
                headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
            })
        }

        const customer = await getPaymentCustomerIdentity(request)
        if (!customer) return NextResponse.json({ success: false, error: 'Sign in to continue checkout.' }, { status: 401 })

        const attemptId = request.nextUrl.searchParams.get('attemptId') || ''
        const attempt = await getPaymentGatewayAttempt(attemptId)
        if (!attempt || !(await isPaymentGatewayAttemptOwnedByCustomer(attemptId, customer.id, customer.email))) {
            return NextResponse.json({ success: false, error: 'Payment attempt not found.' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            attempt: {
                id: attempt.id,
                provider: attempt.gateway,
                product: attempt.product,
                checkoutId: attempt.checkoutId,
                attemptNumber: attempt.attemptNumber,
                status: attempt.status,
            },
        }, { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } })
    } catch (error) {
        return publicError(error)
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()

        console.log('payment routing body', body);

        // The routing ledger drives live money flows, so only an authenticated
        // operator may force a round reset.
        if (body?.action === 'reset-round') {
            if (!(await isAdmin(request))) {
                return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
            }
            const result = await resetPaymentQuotaRounds()
            return NextResponse.json({ success: true, ...result, gateways: await getPaymentGatewayStats() }, {
                headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
            })
        }

        const customer = await getPaymentCustomerIdentity(request)
        if (!customer) return NextResponse.json({ success: false, error: 'Sign in to continue checkout.' }, { status: 401 })

        if (body?.action === 'retry') {
            const attemptId = typeof body.attemptId === 'string' ? body.attemptId : ''
            const failureCode = typeof body.failureCode === 'string' ? body.failureCode.slice(0, 100) : 'payment_declined'
            const failureMessage = typeof body.failureMessage === 'string' ? body.failureMessage.slice(0, 1000) : null
            const result = await retryPaymentGatewayAttempt(attemptId, failureCode, customer, failureMessage)
            return NextResponse.json({ success: true, ...result }, {
                headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
            })
        }

        // A provider-side error the customer hit without the attempt dying
        // (Paddle overlay error, tokenisation rejection, ...). Recorded for
        // diagnostics, the routing state stays untouched.
        if (body?.action === 'report') {
            const attemptId = typeof body.attemptId === 'string' ? body.attemptId : ''
            const attempt = await getPaymentGatewayAttempt(attemptId)
            if (!attempt || !(await isPaymentGatewayAttemptOwnedByCustomer(attemptId, customer.id, customer.email))) {
                return NextResponse.json({ success: false, error: 'Payment attempt not found.' }, { status: 404 })
            }
            const recorded = await recordPaymentGatewayAttemptError(attemptId, {
                failureCode: typeof body.failureCode === 'string' ? body.failureCode : null,
                failureMessage: typeof body.failureMessage === 'string' ? body.failureMessage : null,
            })
            return NextResponse.json({ success: true, recorded }, {
                headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
            })
        }

        if (body?.action !== 'allocate') {
            return NextResponse.json({ success: false, error: 'A valid routing action is required.' }, { status: 400 })
        }

        const checkoutId = typeof body.checkoutId === 'string' ? body.checkoutId.trim() : ''
        const product = body.product as PaymentProduct
        if (product === 'quote') {
            const quoteId = checkoutId.startsWith('quote:') ? checkoutId.slice('quote:'.length) : ''
            if (!quoteId || quoteId.length > 120) {
                return NextResponse.json({ success: false, error: 'A valid quote checkout reference is required.' }, { status: 400 })
            }
            const quoteRows = await db
                .select({ userId: quotes.userId, paymentStatus: quotes.paymentStatus })
                .from(quotes)
                .where(eq(quotes.id, quoteId))
                .limit(1)
            if (!quoteRows[0] || String(quoteRows[0].userId) !== customer.id) {
                return NextResponse.json({ success: false, error: 'Quote checkout not found.' }, { status: 404 })
            }
            if (quoteRows[0].paymentStatus === 'paid') {
                return NextResponse.json({ success: false, error: 'This quote has already been paid.' }, { status: 409 })
            }
        } else if (product !== 'doc-forge' || !checkoutId.startsWith(`doc-forge:${customer.id}:`) || !/^doc-forge:\d+:[a-zA-Z0-9_-]{8,120}$/.test(checkoutId)) {
            return NextResponse.json({ success: false, error: 'A valid checkout reference is required.' }, { status: 400 })
        }

        const result = await reserveNextPaymentGateway({
            checkoutId,
            product,
            customerId: customer.id,
            customerEmail: customer.email,
        })

        // Admins testing the rotation can see exactly why a provider was
        // chosen; outside production every developer does too. Regular
        // customers only get what the checkout needs.
        const routingTraceVisible = process.env.NODE_ENV !== 'production' || (await isAdmin(request))
        const payload = routingTraceVisible ? result : { attempt: result.attempt, maxRetries: result.maxRetries }

        return NextResponse.json({ success: true, ...payload }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        })
    } catch (error) {
        return publicError(error)
    }
}
