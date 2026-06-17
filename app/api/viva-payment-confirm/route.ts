import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quotes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';

export async function POST(req: NextRequest) {
  try {
    const { transactionId, orderCode, policyNumber } = await req.json();

    if (!transactionId || !policyNumber) {
      return NextResponse.json({ error: 'Missing transactionId or policyNumber' }, { status: 400 });
    }

    const updateTimestamp = new Date().toISOString();

    // Always use policyNumber for finding the quote
    const whereClause = eq(quotes.policyNumber, policyNumber);
    const identifier = `policyNumber: ${policyNumber}`;

    const [updatedQuote] = await db.update(quotes).set({
      status: 'completed',
      paymentStatus: 'paid',
      paymentMethod: 'viva',
      mailSent: false,
      paymentIntentId: orderCode, // Using Viva's orderCode (s parameter) as paymentIntentId
      paymentDate: updateTimestamp,
      updatedAt: updateTimestamp,
    }).where(whereClause).returning();

    if (!updatedQuote) {
      console.error(`Viva Webhook: No quote found with ${identifier}`);
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    // Revalidate paths
    revalidatePath('/api/quotes');
    revalidatePath('/administrator');
    revalidatePath('/api/admin/quotes');

    // Trigger the email sending API without awaiting the response (fire-and-forget)
    fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ quoteId: updatedQuote.id }),
    });

    return NextResponse.json({ success: true, quote: updatedQuote });

  } catch (error) {
    console.error('Error processing Viva payment confirmation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
