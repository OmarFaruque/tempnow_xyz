import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import { and, eq, ilike, isNull, or } from "drizzle-orm"
import { db } from "@/lib/db"
import { quotes, blacklist } from "@/lib/schema"

// Lets a customer who picked the vehicle by make/model add the registration
// number to an order they already paid for.
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const token = cookies().get("auth_token")?.value
    if (!token || !process.env.JWT_SECRET) {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    let userId = ""
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: number | string }
      userId = String(decoded.id)
    } catch {
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 })
    }

    const quoteId = Number(params.id)
    if (!Number.isSafeInteger(quoteId) || quoteId <= 0) {
      return NextResponse.json({ error: "Invalid order" }, { status: 400 })
    }

    const body = await request.json().catch(() => null)
    const registration = String(body?.registration || "").replace(/\s+/g, "").toUpperCase()
    if (!/^[A-Z0-9]{2,7}$/.test(registration)) {
      return NextResponse.json({ error: "Please enter a valid registration number." }, { status: 400 })
    }

    const [quote] = await db
      .select()
      .from(quotes)
      .where(and(eq(quotes.id, quoteId), eq(quotes.userId, userId)))
      .limit(1)

    if (!quote || quote.paymentStatus !== "paid") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    // Only a missing number can be filled in. Changing an existing one would
    // move the document to a different vehicle.
    if (quote.regNumber && quote.regNumber.trim() !== "") {
      return NextResponse.json({ error: "This order already has a registration number." }, { status: 409 })
    }

    if (quote.endDate && new Date(quote.endDate) < new Date()) {
      return NextResponse.json({ error: "This document has expired and can no longer be changed." }, { status: 400 })
    }

    const blocked = await db
      .select({ id: blacklist.id })
      .from(blacklist)
      .where(and(eq(blacklist.type, "reg_number"), ilike(blacklist.regNumber, registration)))
      .limit(1)
    if (blocked.length > 0) {
      return NextResponse.json({ error: "This registration number cannot be used." }, { status: 403 })
    }

    // quote_data keeps its own copy of the registration, used by the emails
    let quoteData = quote.quoteData
    try {
      const parsed = JSON.parse(quote.quoteData || "")
      if (parsed?.customerData) {
        parsed.customerData.registration = registration
        quoteData = JSON.stringify(parsed)
      }
    } catch {
      // leave quote_data as it is
    }

    const updated = await db
      .update(quotes)
      .set({ regNumber: registration, quoteData, updatedAt: new Date().toISOString() })
      .where(and(eq(quotes.id, quoteId), or(isNull(quotes.regNumber), eq(quotes.regNumber, ""))))
      .returning({ id: quotes.id })

    if (updated.length === 0) {
      return NextResponse.json({ error: "This order already has a registration number." }, { status: 409 })
    }

    return NextResponse.json({ success: true, regNumber: registration })
  } catch (error) {
    console.error("Error saving registration number:", error)
    return NextResponse.json({ error: "Could not save the registration number. Please try again." }, { status: 500 })
  }
}