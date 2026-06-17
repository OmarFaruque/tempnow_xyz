import { db } from '@/lib/db';
import { quotes } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getSettings } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const { policyId, note } = await request.json();

    if (!policyId) {
      return NextResponse.json({ success: false, error: 'Policy ID is required' }, { status: 400 });
    }

    // Retrieve the policy to verify it exists
    const policy = await db.select().from(quotes).where(eq(quotes.id, policyId)).limit(1);

    if (policy.length === 0) {
      return NextResponse.json({ success: false, error: 'Policy not found' }, { status: 404 });
    }

    // Update fraud status to 'ok' (approved) and set the fraud note
    await db
      .update(quotes)
      .set({
        fraudStatus: 'ok',
        fraudNote: note || undefined,
      })
      .where(eq(quotes.id, policyId));

    // Try to send feedback to FraudLabsPro so their system records this manual review
    try {
      const fraudSettings = await getSettings('fraudLabsPro');
      const apiKey = fraudSettings?.apiKey;
      if (apiKey) {
        // Fetch the updated quote row to get fraudDetails and identifiers
        const updated = await db.select().from(quotes).where(eq(quotes.id, policyId)).limit(1);
        const quote = updated[0];

        // Build JSON body matching the FraudLabsPro v2 sample (POST /v2/order/feedback)
        const body: Record<string, any> = {
          key: apiKey,
          format: 'json',
          action: 'APPROVE',
        };

        // Prefer provider-side id if available; fall back to our quote id / policy number
        try {
          const details = quote.fraudDetails as any;
          const providerId = details && typeof details === 'object'
            ? (details.fraudlabspro_id || details.id || details.transaction_id || details.order_id)
            : undefined;
          if (providerId) body.id = String(providerId);
        } catch (e) {
          // ignore parse errors
        }

        if (note) body.note = String(note);

        
        

        const fbUrl = 'https://api.fraudlabspro.com/v2/order/feedback';
        const fbRes = await fetch(fbUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        const fbRaw = await fbRes.text().catch(() => '');
        

        // Persist feedback response into `fraudDetails.feedback` (append) for audit
        try {
          const feedbackEntry = { time: new Date().toISOString(), status: fbRes.status, body: fbRaw };
          const existing = quote.fraudDetails;

          let newDetails: any;

          if (existing && typeof existing === 'object' && !Array.isArray(existing)) {
            // If existing is an object (provider details), preserve its fields and append feedback
            newDetails = { ...existing };
            if (Array.isArray(newDetails.feedback)) {
              newDetails.feedback = [...newDetails.feedback, feedbackEntry];
            } else {
              newDetails.feedback = [feedbackEntry];
            }
          } else if (existing) {
            // If existing is a primitive or array, move it into `original` and add feedback
            newDetails = { original: existing, feedback: [feedbackEntry] };
          } else {
            // No existing details; create a feedback array
            newDetails = { feedback: [feedbackEntry] };
          }

          await db.update(quotes).set({ fraudDetails: newDetails as any }).where(eq(quotes.id, policyId));
        } catch (e) {
          console.error('Failed to persist FraudLabsPro feedback response:', e);
        }
      }
    } catch (fbErr) {
      console.error('Error sending feedback to FraudLabsPro:', fbErr);
    }

    revalidatePath('/administrator');
    revalidatePath('/api/admin/policies');

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error approving fraud:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
