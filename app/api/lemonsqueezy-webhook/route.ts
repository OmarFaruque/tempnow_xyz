import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiDocuments, quotes, users } from "@/lib/schema";
import { eq, and, gte, lte } from "drizzle-orm";
import { sendEmail, createAIDocumentPurchaseEmail, createAdminNotificationEmail, getAdminEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { getLemonSqueezySettings } from "@/lib/lemonsqueezy";

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text();
    const signature = request.headers.get("x-signature");

    if (!signature) {
      return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    const { webhookSecret } = await getLemonSqueezySettings();

    const hmac = crypto.createHmac("sha256", webhookSecret);
    const digest = Buffer.from(hmac.update(rawBody).digest("hex"), "hex");
    const signatureBuffer = Buffer.from(signature, "hex");

    if (!crypto.timingSafeEqual(digest, signatureBuffer)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }


    const payload = JSON.parse(rawBody);
    const { meta, data } = payload;


    if (meta.event_name === "order_created") {
      // Extract payment data from Lemon Squeezy webhook
      const userEmail = data.attributes.user_email;
      const orderId = data.id;
      const createdAt = new Date(data.attributes.created_at);
      const timeWindow = 10 * 60 * 1000; // 10 minutes in milliseconds
      const minTime = new Date(createdAt.getTime() - timeWindow);
      const maxTime = new Date(createdAt.getTime() + timeWindow);

      

      // Step 1: Try to find matching quote
      // Find user by email first
      const userRecord = await db.select().from(users).where(eq(users.email, userEmail));

      if (userRecord.length > 0) {
        const userId = userRecord[0].userId;

        // Look for quote with matching email and time window (no amount comparison)
        const matchingQuotes = await db.select().from(quotes).where(
          and(
            eq(quotes.userId, userId.toString()),
            gte(quotes.createdAt, minTime.toISOString()),
            lte(quotes.createdAt, maxTime.toISOString())
          )
        );


        // Take the most recent quote within the time window
        if (matchingQuotes.length > 0) {
          const matchedQuote = matchingQuotes[matchingQuotes.length - 1]; // Get the last one (most recent)

          const updateTimestamp = new Date().toISOString();
          const updatedQuotes = await db.update(quotes)
            .set({
              paymentStatus: 'paid',
              status: 'completed',
              mailSent: false,
              paymentMethod: 'lemonsqueezy',
              paymentIntentId: orderId,
              paymentDate: updateTimestamp,
              updatedAt: updateTimestamp,
            })
            .where(eq(quotes.id, matchedQuote.id))
            .returning({ id: quotes.id, policyNumber: quotes.policyNumber });

          if (updatedQuotes.length > 0) {
            revalidatePath('/api/quotes');
            revalidatePath('/administrator');
            revalidatePath('/api/admin/quotes');
            const quoteId = updatedQuotes[0].id;
            fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-confirmation`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ quoteId }),
            });
            console.log(`Quote ${matchedQuote.policyNumber} updated to paid`);
            return NextResponse.json({ received: true, message: "Quote payment processed." });
          }
        }
      }

      // Step 2: If not found in quotes, try to find matching aiDocument
      // Match by email and time window (no amount comparison)
      const matchingDocs = await db.select().from(aiDocuments).where(
        and(
          eq(aiDocuments.email, userEmail),
          gte(aiDocuments.createdAt, minTime.toISOString()),
          lte(aiDocuments.createdAt, maxTime.toISOString())
        )
      );

      if (matchingDocs.length > 0) {
        const matchedDoc = matchingDocs[matchingDocs.length - 1]; // Get the most recent

        const updatedDocs = await db.update(aiDocuments)
          .set({
            status: 'paid',
            paymentIntentId: orderId,
          })
          .where(eq(aiDocuments.id, matchedDoc.id))
          .returning();

        if (updatedDocs.length > 0) {
          const doc = updatedDocs[0];

          // Only send emails if email and prompt are present
          if (doc.email && doc.prompt) {
            (async () => {
              try {
                const downloadLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-documents/download-pdf/${doc.uuid}`;
                const docAmount = doc.amount ? parseFloat(doc.amount as string) : 0;
                const emailData = await createAIDocumentPurchaseEmail(
                  doc.email.split('@')[0],
                  '',
                  orderId,
                  new Date(data.attributes.created_at).toLocaleDateString(),
                  docAmount,
                  doc.prompt,
                  downloadLink,
                  doc.content || undefined,
                );
                const adminNotificationData = await createAdminNotificationEmail(
                  "ai_document",
                  doc.email.split('@')[0],
                  doc.email,
                  docAmount,
                  `Document Type: ${doc.prompt}`,
                );

                await sendEmail({
                  to: doc.email,
                  subject: emailData.subject,
                  html: emailData.html,
                });

                const adminEmail = await getAdminEmail();
                await sendEmail({
                  to: adminEmail,
                  subject: adminNotificationData.subject,
                  html: adminNotificationData.html,
                });
              } catch (emailError) {
                console.error("Error sending email in background:", emailError);
              }
            })();
          } else {
            console.warn(`Missing email or prompt for AI document ${doc.uuid}. Skipping email notification.`);
          }
          console.log(`AI Document ${matchedDoc.uuid} updated to paid`);
          return NextResponse.json({ received: true, message: "AI document payment processed." });
        }
      }

      // If neither quotes nor aiDocuments found
      console.error(`Webhook Error: Could not find quote or AI document with email ${userEmail} within time window.`);
      return NextResponse.json({ received: true, message: "No matching record found for update." });
    }
    return NextResponse.json({ received: true, message: "Webhook event received but not 'order_created'." });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
