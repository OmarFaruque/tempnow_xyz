import 'server-only'

import jwt from 'jsonwebtoken'
import { eq } from 'drizzle-orm'
import type { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/schema'
import {
    isPaymentGatewayAttemptOwnedByCustomer,
    verifyPaymentGatewayAttempt,
    type PaymentGatewayAttempt,
} from '@/core/payment-rotation'
import type { PaymentGatewayId, PaymentProduct } from '@/core/payment-gateways'

export interface PaymentCustomerIdentity {
    id: string
    email: string
}

/** Resolve the signed-in checkout customer from the same JWT cookie used by the UI. */
export async function getPaymentCustomerIdentity(request: NextRequest): Promise<PaymentCustomerIdentity | null> {
    const cookieToken = request.cookies.get('auth_token')?.value
    const authorization = request.headers.get('authorization')
    const bearerToken = authorization?.startsWith('Bearer ') ? authorization.slice(7).trim() : undefined
    const token = cookieToken || bearerToken
    const secret = process.env.JWT_SECRET
    if (!token || !secret) return null

    try {
        const payload = jwt.verify(token, secret)
        if (!payload || typeof payload !== 'object' || !Number.isSafeInteger(Number(payload.id))) return null

        const userId = Number(payload.id)
        if (userId <= 0) return null

        const rows = await db
            .select({ id: users.userId, email: users.email })
            .from(users)
            .where(eq(users.userId, userId))
            .limit(1)

        const user = rows[0]
        if (!user) return null
        return { id: String(user.id), email: user.email ?? '' }
    } catch {
        return null
    }
}

export async function verifyOwnedPaymentAttempt(input: {
    request: NextRequest
    attemptId: string
    gateway: PaymentGatewayId
    product: PaymentProduct
    checkoutId?: string
}): Promise<{ customer: PaymentCustomerIdentity; attempt: PaymentGatewayAttempt } | null> {
    const customer = await getPaymentCustomerIdentity(input.request)
    if (!customer) return null

    const attempt = await verifyPaymentGatewayAttempt(input.attemptId, input.gateway, input.product)
    if (!attempt || (input.checkoutId && attempt.checkoutId !== input.checkoutId)) return null
    if (!(await isPaymentGatewayAttemptOwnedByCustomer(input.attemptId, customer.id, customer.email))) return null
    return { customer, attempt }
}