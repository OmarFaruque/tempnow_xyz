import { NextRequest, NextResponse } from "next/server"
import { and, eq, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { blacklist, paddleRefundEvents, quotes } from "@/lib/schema"

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const params = await context.params
    const eventId = Number(params.id)
    const body = await request.json().catch(() => ({}))
    const shouldBlacklistEmail = body?.blacklistEmail !== false
    const shouldBlacklistAddress = body?.blacklistAddress === true

    if (!eventId) {
      return NextResponse.json({ error: "Invalid event id" }, { status: 400 })
    }

    const [event] = await db.select().from(paddleRefundEvents).where(eq(paddleRefundEvents.id, eventId)).limit(1)
    if (!event) {
      return NextResponse.json({ error: "Refund event not found" }, { status: 404 })
    }

    if (!shouldBlacklistEmail && !shouldBlacklistAddress) {
      return NextResponse.json({ error: "Select at least one blacklist target" }, { status: 400 })
    }

    
    const quoteMatch = shouldBlacklistAddress && event.transactionId
      ? await db
          .select({ address: quotes.address })
          .from(quotes)
          .where(or(eq(quotes.paymentIntentId, event.transactionId), eq(quotes.spaymentId, event.transactionId)))
          .limit(1)
      : []

    const resolvedAddress = quoteMatch[0]?.address?.trim()

    if (shouldBlacklistAddress && !resolvedAddress) {
      return NextResponse.json({ error: "Address not found for this refund event" }, { status: 400 })
    }


    const selectedTargets = [
      shouldBlacklistEmail ? "email" : null,
      shouldBlacklistAddress ? "address" : null,
    ].filter(Boolean).join(", ")

    if (shouldBlacklistEmail) {
      if (!event.email) {
        return NextResponse.json({ error: "Refund event has no email to blacklist" }, { status: 400 })
      }

      const existing = await db
        .select({ id: blacklist.id })
        .from(blacklist)
        .where(and(eq(blacklist.type, "user"), eq(blacklist.email, event.email)))
        .limit(1)

      if (existing.length === 0) {
        await db.insert(blacklist).values({
          type: "user",
          firstName: event.firstName ?? undefined,
          lastName: event.lastName ?? undefined,
          email: event.email,
          reason: `Blacklisted from ${event.eventType} event`,
        })
      }
    }

    if (shouldBlacklistAddress) {
      const existingAddress = await db
        .select({ id: blacklist.id })
        .from(blacklist)
        .where(and(eq(blacklist.type, "address"), eq(blacklist.address, resolvedAddress)))
        .limit(1)

      if (existingAddress.length === 0) {
        await db.insert(blacklist).values({
          type: "address",
          address: resolvedAddress,
          reason: `Blacklisted from ${event.eventType} event`,
        })
      }


    }

    await db
      .update(paddleRefundEvents)
      .set({
        blacklistedAt: new Date().toISOString(),
        blacklistedTargets: selectedTargets,
        address: resolvedAddress ?? event.address ?? null,
        updatedAt: new Date().toISOString(),
      })
      .where(eq(paddleRefundEvents.id, eventId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Failed to blacklist refund event user:", error)
    return NextResponse.json({ error: "Failed to blacklist user" }, { status: 500 })
  }
}