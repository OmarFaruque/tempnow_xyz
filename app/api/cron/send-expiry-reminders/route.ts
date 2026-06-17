import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { quotes, users } from '@/lib/schema';
import { and, eq, gte, lte, sql, or, ne, lt } from 'drizzle-orm';
import { sendEmail, createPolicyExpiryEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';



async function cleanupExpiredUnpaidQuotes(now: Date) {
  // Run cleanup once a week (Sunday, 00:00 UTC) to keep only one Vercel cron job.
  if (!(now.getUTCDay() === 0 && now.getUTCHours() === 0 && now.getUTCMinutes() === 0)) {
    return { ran: false, deletedCount: 0 };
  }

  const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

  const deletedQuotes = await db
    .delete(quotes)
    .where(
      and(
        lt(quotes.createdAt, tenMinutesAgo.toISOString()),
        or(ne(quotes.paymentStatus, 'paid'), sql`"quotes"."payment_status" IS NULL`),
        or(ne(quotes.paymentMethod, 'bank_transfer'), sql`"quotes"."payment_method" IS NULL`)
      )
    )
    .returning({ id: quotes.id });

  return { ran: true, deletedCount: deletedQuotes.length };
}

// Define the POST handler logic
async function handleCronRequest(request: NextRequest) {
  // const authHeader = request.headers.get('authorization');
  // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
  //   return new Response('Unauthorized', { status: 401 });
  // }

  try {
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);
    const cleanupResult = await cleanupExpiredUnpaidQuotes(now);

    // Find quotes that expire within the next 10 minutes OR expired anytime in the past
    // and haven't had an email sent, and are paid.
    const expiringQuotes = await db.select().from(quotes).where(
      and(
        eq(quotes.expiryEmailSent, false),
        eq(quotes.paymentStatus, 'paid'),
        or(
          // Scenario 1: Expiring soon (within next 10 minutes)
          and(
            gte(quotes.endDate, now.toISOString()),
            lte(quotes.endDate, tenMinutesFromNow.toISOString())
          ),
          // Scenario 2: Missed (expired anytime in the past, email not sent)
          lte(quotes.endDate, now.toISOString()) // endDate is in the past or now
        )
      )
    );

    

    if (expiringQuotes.length === 0) {
      const cleanupMessage = cleanupResult.ran
        ? ` Cleanup deleted ${cleanupResult.deletedCount} expired unpaid quotes.`
        : '';

      return NextResponse.json({
        success: true,
        message: `No quotes expiring soon.${cleanupMessage}`
      });
    }

    let updatedCount = 0;
    for (const quote of expiringQuotes) {
      if (!quote.userId) {
        console.warn(`Quote ${quote.id} has no user ID, skipping expiry email.`);
        continue;
      }

      const userRecord = await db.select().from(users).where(eq(users.userId, quote.userId)).limit(1);
      if (!userRecord.length) {
        console.warn(`User not found for quote ${quote.id}, skipping expiry email.`);
        continue;
      }
      const user = userRecord[0];

      

      const fullQuoteData = JSON.parse(quote.quoteData as string);

      const emailHtml = await createPolicyExpiryEmail(
        user.firstName || '',
        user.lastName || '',
        quote.policyNumber,
        `${fullQuoteData.customerData.vehicle.year} ${fullQuoteData.customerData.vehicle.make} ${fullQuoteData.customerData.vehicle.model}`,
        quote.endDate,
        `${process.env.NEXT_PUBLIC_BASE_URL}`
      );

      await sendEmail({
        to: user.email,
        subject: emailHtml?.subject || 'Your Docs are Expiring Soon',
        html: emailHtml?.html || '',
      });

      // Mark email as sent
      await db.update(quotes).set({ expiryEmailSent: true }).where(eq(quotes.id, quote.id));
      updatedCount++;
    }

    if (updatedCount > 0) {
      revalidatePath('/api/quotes');
      revalidatePath('/administrator');
      revalidatePath('/api/admin/quotes');
    }

    const cleanupMessage = cleanupResult.ran
      ? ` Cleanup deleted ${cleanupResult.deletedCount} expired unpaid quotes.`
      : '';

    return NextResponse.json({
      success: true,
      message: `Sent ${expiringQuotes.length} expiry reminders.${cleanupMessage}`
    });

  } catch (error) {
    console.error('Error sending expiry reminders:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  return handleCronRequest(request);
}

export async function GET(request: NextRequest) {
  return handleCronRequest(request);
}
