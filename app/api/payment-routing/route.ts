import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/admin-auth'
import { getPaymentCustomerIdentity } from '@/core/payment-auth'
import { db } from '@/lib/db'
import { quotes } from '@/lib/schema'
import { eq } from 'drizzle-orm'
import {
    getPaymentGatewayAttempt,
    getPaymentGatewayStats,
    isPaymentGatewayAttemptOwnedByCustomer,
    PaymentRoutingError,
    reserveNextPaymentGateway,
    retryPaymentGatewayAttempt,
} from '@/core/payment-rotation'
import type { PaymentProduct } from '@/core/payment-gateways'

export const dynamic = 'force-dynamic'
export const revalidate = 0

function publicError(error: unknown) {
    if (error instanceof PaymentRoutingError) {
        return NextResponse.json({ success: false, code: error.code, error: error.message }, { status: 409 })
    }
    console.error('Payment routing request failed:', error)
    return NextResponse.json({ success: false, error: 'Unable to prepare a secure payment option right now.' }, { status: 500 })
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
        const customer = await getPaymentCustomerIdentity(request)
        if (!customer) return NextResponse.json({ success: false, error: 'Sign in to continue checkout.' }, { status: 401 })

        if (body?.action === 'retry') {
            const attemptId = typeof body.attemptId === 'string' ? body.attemptId : ''
            const failureCode = typeof body.failureCode === 'string' ? body.failureCode.slice(0, 100) : 'payment_declined'
            const result = await retryPaymentGatewayAttempt(attemptId, failureCode, customer)
            return NextResponse.json({ success: true, ...result }, {
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

        return NextResponse.json({ success: true, ...result }, {
            headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' },
        })
    } catch (error) {
        return publicError(error)
    }
}