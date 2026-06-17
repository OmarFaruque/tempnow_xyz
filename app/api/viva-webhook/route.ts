import { NextRequest, NextResponse } from "next/server";
import { getVivaClient } from "@/lib/viva";
import { db } from "@/lib/db";
import { aiDocuments, quotes } from "@/lib/schema";
import { eq, and } from "drizzle-orm";
import { sendEmail, createAIDocumentPurchaseEmail, createAdminNotificationEmail, getAdminEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";

interface PaymentMetadata {
  type: 'ai-document' | 'quote';
  documentId?: string;
  policyNumber?: string;
}

export async function POST(request: NextRequest) {
  try {
    const event = await request.json();

    // Verify the event
    if (event.EventTypeId === 1792) { // Transaction Payment Created
      const viva = await getVivaClient();
      const transaction = await viva.retrieveTransaction(event.EventData.TransactionId);

      if (transaction.StatusId === 'F') { // Success
        const metadata: PaymentMetadata = JSON.parse(transaction.Order.CustomerTrns);

        if (metadata.type === 'ai-document') {
          const updatedDocs = await db.update(aiDocuments)
            .set({
              status: 'paid',
            })
            .where(and(eq(aiDocuments.id, metadata.documentId!), eq(aiDocuments.status, 'pending')))
            .returning();

            if (updatedDocs.length > 0) {
              const doc = updatedDocs[0];

              (async () => {
                try {
                  const downloadLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-documents/download-pdf/${doc.uuid}`;
                  const emailData = await createAIDocumentPurchaseEmail(
                    doc.email.split('@')[0],
                    '',
                    transaction.TransactionId,
                    new Date(transaction.Created).toLocaleDateString(),
                    transaction.Amount / 100,
                    doc.prompt,
                    downloadLink,
                    doc.content || undefined,
                  );
                  const adminNotificationData = await createAdminNotificationEmail(
                    "ai_document",
                    doc.email.split('@')[0],
                    doc.email,
                    transaction.Amount / 100,
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
            }

        } else if (metadata.type === 'quote') {
          const updateTimestamp = new Date().toISOString();
          const updatedQuotes = await db.update(quotes)
            .set({
              paymentStatus: 'paid',
              status: 'completed',
              mailSent: false,
              paymentMethod: 'viva',
              paymentIntentId: transaction.TransactionId,
              paymentDate: updateTimestamp,
              updatedAt: updateTimestamp,
            })
            .where(eq(quotes.policyNumber, metadata.policyNumber))
            .returning({ id: quotes.id });

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
          } else {
            console.error(`Webhook Error: Could not find quote with policy number ${metadata.policyNumber} to update.`);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Failed to process webhook" }, { status: 500 });
  }
}
