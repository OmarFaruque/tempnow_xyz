import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { paddleRefundEvents } from "@/lib/schema"
import { desc } from "drizzle-orm"

export async function GET() {
  try {
    const data = await db
      .select()
      .from(paddleRefundEvents)
      .orderBy(desc(paddleRefundEvents.updatedAt))
      .limit(200)

    return NextResponse.json({ data })
  } catch (error) {
    console.error("Failed to load refund events:", error)
    return NextResponse.json({ error: "Failed to load refund events" }, { status: 500 })
  }
}