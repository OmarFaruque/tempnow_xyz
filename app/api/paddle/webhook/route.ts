import { type NextRequest, NextResponse } from "next/server"
import crypto from "crypto"
import { db } from "@/lib/db"
import { getSettings } from "@/lib/database";
import { paddleRefundEvents, quotes, users, aiDocuments  } from "@/lib/schema"
import { and, eq,  or, sql } from "drizzle-orm"
import { sendEmail, createAIDocumentPurchaseEmail, createAdminNotificationEmail, getAdminEmail } from '@/lib/email';
import { revalidatePath } from 'next/cache';
import { v4 as uuidv4 } from 'uuid';

type NormalizedRefundEvent = {
  paddleEventId: string | null
  eventName: string | null
  eventType: "refund" | "chargeback"
  status: string | null
  firstName: string | null
  lastName: string | null
  email: string | null
  policyNumber: string | null
  amount: string | null
  currency: string | null
  transactionId: string | null
  address: string | null
  reason: string | null
  payload: any
}


export async function POST(request: NextRequest) {
  try {

    const body = await request.text()
    const signature = request.headers.get("paddle-signature")
    const publicKey = process.env.PADDLE_WEBHOOK_PUBLIC_KEY


    if (publicKey) {
      if (!signature) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 })
      }

      const expectedSignature = crypto.createHmac("sha256", publicKey).update(body).digest("hex")
      if (signature !== expectedSignature) {
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 })
      }
    }


    const webhookData = JSON.parse(body)
    const eventName = webhookData.alert_name ?? webhookData.event_type ?? ""


    if (isRefundOrChargebackWebhook(webhookData, eventName)) {
      await handleRefundOrChargeback(webhookData)
    } else {
       switch (eventName) {
        case "transaction.completed":
        case "transaction.paid":
          await handlePaymentSucceeded(webhookData)
          break
        case "transaction.payment_failed":
          await handlePaymentFailed(webhookData)
          break
        default:
          console.log("Unhandled webhook event:", eventName)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}


function isRefundOrChargebackWebhook(data: any, eventName: string) {
  const lowered = String(eventName || "").toLowerCase()
  const action = String(data.action ?? data.data?.action ?? "").toLowerCase()

  return (
    lowered.includes("payment_refunded") ||
    lowered.includes("chargeback") ||
    lowered === "adjustment.updated" ||
    action === "refund" ||
    action === "chargeback" ||
    action === "dispute"
  )
}

async function handlePaymentSucceeded(data: any) {

  const transaction = data.data || data;
  const transactionId = transaction.id || transaction.transaction_id || transaction.checkout_id || transaction.order_id;
  
  // Custom data can be at the transaction level or nested in the price object of the first item
  let customData = transaction.custom_data || transaction.customData;
  
  if (!customData && transaction.items && transaction.items.length > 0) {
    const firstItem = transaction.items[0];
    customData = firstItem.price?.custom_data || firstItem.price?.customData;
  }

  if (!customData) {
    console.log("No custom_data found in Paddle transaction:", transactionId);
    return;
  }



  try {
    // Handle Quote
    if (customData.quote_details) {
      const quoteDetails = typeof customData.quote_details === 'string' ? JSON.parse(customData.quote_details) : customData.quote_details;
      const quoteId = quoteDetails.id;

      if (!quoteId) {
        console.error("No quoteId found in custom_data.quote_details");
        return;
      }

      // Check if already processed (check paymentIntentId)
      const existingQuote = await db.select({ paymentIntentId: quotes.paymentIntentId })
        .from(quotes)
        .where(eq(quotes.id, quoteId))
        .limit(1);

      if (existingQuote.length > 0 && existingQuote[0].paymentIntentId) {
        console.log(`Quote ${quoteId} already processed with paymentIntentId: ${existingQuote[0].paymentIntentId}`);
        return;
      }

      const updateTimestamp = new Date().toISOString();
      await db.update(quotes).set({
        status: 'completed',
        paymentStatus: 'paid',
        paymentMethod: 'paddle',
        paymentIntentId: transactionId,
        paymentDate: updateTimestamp,
        updatedAt: updateTimestamp,
      }).where(eq(quotes.id, quoteId));

      revalidatePath('/api/quotes');
      revalidatePath('/administrator');
      revalidatePath('/api/admin/quotes');

      // Trigger the email sending API without awaiting the response (fire-and-forget)
      fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/send-confirmation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quoteId }),
      }).catch(err => console.error("Error calling send-confirmation:", err));

    } 
    // Handle AI Document
    else if (
      customData.document_id ||
      customData.doc_details ||
      customData.document_details
    ) {
      if (customData.document_id) {
        const documentId = Number(customData.document_id);
        if (!Number.isFinite(documentId)) {
          console.error("Invalid document_id in custom_data:", customData.document_id);
          return;
        }

        const updatedDocs = await db
          .update(aiDocuments)
          .set({
            status: "paid",
            paymentIntentId: transactionId,
          })
          .where(
            and(
              eq(aiDocuments.id, documentId),
              eq(aiDocuments.status, "pending"),
            ),
          )
          .returning({
            id: aiDocuments.id,
            uuid: aiDocuments.uuid,
            prompt: aiDocuments.prompt,
            email: aiDocuments.email,
            amount: aiDocuments.amount,
            content: aiDocuments.content,
          });

        if (updatedDocs.length === 0) {
          console.log(`AI Document ${documentId} was already processed or not found.`);
          return;
        }

        const doc = updatedDocs[0];
        const emailName = doc.email?.split("@")[0] || "Customer";
        const docAmount = Number(doc.amount || 0);

        const downloadLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-documents/download-pdf/${doc.uuid}`;
        const emailData = await createAIDocumentPurchaseEmail(
          emailName,
          "",
          transactionId,
          new Date().toLocaleDateString(),
          docAmount,
          doc.prompt || "AI Document",
          downloadLink,
          doc.content || undefined
        );

        if (doc.email) {
          await sendEmail({
            to: doc.email,
            subject: emailData.subject,
            html: emailData.html,
          });

          const adminNotificationData = await createAdminNotificationEmail(
            "ai_document",
            emailName,
            doc.email,
            docAmount,
            `Document Type: ${doc.prompt || "AI Document"}`
          );
          const adminEmail = await getAdminEmail();
          await sendEmail({
            to: adminEmail,
            subject: adminNotificationData.subject,
            html: adminNotificationData.html,
          });
        }
        return;
      }
      const docDetailsStr = customData.doc_details || customData.document_details;
      const userDetailsStr = customData.user_details;

      if (!docDetailsStr || !userDetailsStr) {
        console.error("Missing doc_details or user_details in custom_data");
        return;
      }

      const docDetails = typeof docDetailsStr === 'string' ? JSON.parse(docDetailsStr) : docDetailsStr;
      const userDetails = typeof userDetailsStr === 'string' ? JSON.parse(userDetailsStr) : userDetailsStr;

      // Check if already processed (check if aiDocuments record with this paymentIntentId exists)
      const existingDoc = await db.select({ id: aiDocuments.id })
        .from(aiDocuments)
        .where(eq(aiDocuments.paymentIntentId, transactionId))
        .limit(1);

      if (existingDoc.length > 0) {
        console.log(`AI Document already processed for transaction ${transactionId}`);
        return;
      }

      const newDocument = await db.insert(aiDocuments).values({
        uuid: uuidv4(),
        prompt: docDetails.prompt,
        content: docDetails.content,
        email: userDetails.email,
        userId: userDetails.id,
        amount: docDetails.price,
        status: 'paid',
        paymentIntentId: transactionId,
      }).returning({ id: aiDocuments.id, uuid: aiDocuments.uuid });

      const documentUuid = newDocument[0].uuid;

      const downloadLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-documents/download-pdf/${documentUuid}`;
      const emailData = await createAIDocumentPurchaseEmail(
        userDetails.firstName,
        userDetails.lastName,
        transactionId,
        new Date().toLocaleDateString(),
        docDetails.price,
        docDetails.prompt,
        downloadLink,
        docDetails.content,
      );

      await sendEmail({
        to: userDetails.email,
        subject: emailData.subject,
        html: emailData.html,
      });

      const adminNotificationData = await createAdminNotificationEmail(
        "ai_document",
        userDetails.firstName,
        userDetails.email,
        docDetails.price,
        `Document Type: ${docDetails.prompt}`
      );
      const adminEmail = await getAdminEmail();
      await sendEmail({
        to: adminEmail,
        subject: adminNotificationData.subject,
        html: adminNotificationData.html,
      });
    }
  } catch (error) {
    console.error("Error processing handlePaymentSucceeded:", error);
  }
}

async function handlePaymentFailed(data: any) {
  console.log("Payment failed:", data)
}


// Convert various Paddle amount formats into a consistent string representation in major currency units (e.g. "12.34"). Handles both minor unit integers and decimal strings, returning null for invalid or empty inputs.
function normalizePaddleAmount(amount: unknown): string | null {
  if (amount === null || amount === undefined) return null

  const raw = String(amount).trim()
  if (!raw) return null

  // Paddle adjustment totals commonly arrive in minor units ("1252" => "12.52")
  if (/^\d+$/.test(raw)) {
    const asMinor = Number(raw)
    if (Number.isFinite(asMinor)) {
      return (asMinor / 100).toFixed(2)
    }
  }

  const parsed = Number(raw)
  return Number.isFinite(parsed) ? parsed.toFixed(2) : raw
}

function normalizeRefundEvent(data: any): NormalizedRefundEvent | null {
  const eventName = data.alert_name || data.event_type || ""
  const loweredEvent = String(eventName).toLowerCase()
  const action = String(data.action ?? data.data?.action ?? "").toLowerCase()

  const eventType: "refund" | "chargeback" =
    loweredEvent.includes("chargeback") || action === "chargeback" || action === "dispute"
      ? "chargeback"
      : "refund"

  const eventId = data.event_id ?? data.id ?? data.paddle_event_id ?? null
  const amountRaw =
    data.amount ??
    data.refund_amount ??
    data.earnings_decrease ??
    data.data?.amount ??
    data.data?.totals?.total ??
    data.data?.totals?.grand_total ??
    null


    const normalizedAmount = normalizePaddleAmount(amountRaw)


    return {
      paddleEventId: eventId ? String(eventId) : null,
      eventName: eventName ? String(eventName) : null,
      eventType,
      status: data.status ?? data.refund_status ?? data.data?.status ?? null,
      firstName: null,
      lastName: null,
      email : null,
      policyNumber: null,
      amount: normalizedAmount,
      currency:
        data.currency ??
        data.currency_code ??
        data.data?.currency_code ??
        data.data?.totals?.currency_code ??
        null,
      transactionId:
        data.order_id ??
        data.subscription_payment_id ??
        data.checkout_id ??
        data.transaction_id ??
        data.data?.transaction_id ??
        data.data?.id ??
        null,
      address: null,  
      reason:
        data.refund_reason ??
        data.reason ??
        data.chargeback_reason ??
        data.data?.reason ??
        null,
      payload: data,
  }
}

async function enrichEventFromQuote(event: NormalizedRefundEvent): Promise<NormalizedRefundEvent> {
  if (!event.transactionId) {
    return event
  }

  try {
    const match = await db
      .select({
        quoteFirstName: quotes.firstName,
        quoteLastName: quotes.lastName,
        quotePolicyNumber: quotes.policyNumber,
        quoteAddress: quotes.address,
        userEmail: users.email,
      })
      .from(quotes)
      .leftJoin(users, sql`CAST(${quotes.userId} as integer) = ${users.userId}`)
      .where(
        or(
          eq(quotes.paymentIntentId, event.transactionId),
          eq(quotes.spaymentId, event.transactionId),
        ),
      )
      .limit(1)

    if (match.length === 0) {
      return event
    }

    const row = match[0]
    return {
      ...event,
      firstName: event.firstName ?? row.quoteFirstName ?? null,
      lastName: event.lastName ?? row.quoteLastName ?? null,
      email: event.email ?? row.userEmail ?? null,
      policyNumber: event.policyNumber ?? row.quotePolicyNumber ?? null,
      address: event.address ?? row.quoteAddress ?? null,
    }
  } catch (error) {
    console.error("Failed to enrich refund event from quote:", error)
    return event
  }
}


async function sendDiscordRefundNotification(event: NormalizedRefundEvent) {
  const settings = await getSettings("paddle");
  const webhookUrl: string | undefined = settings?.discordRefundWebhookUrl;

  if (!webhookUrl) {
    return
  }

  const amountLabel = event.amount ? `${event.currency ?? ""} ${event.amount}`.trim() : "N/A"
  const fullName = `${event.firstName ?? ""} ${event.lastName ?? ""}`.trim() || "Unknown"
  const generalSettings = await getSettings("general");
  const text = [
    `🚨 Paddle ${event.eventType.toUpperCase()} received from ${generalSettings?.siteName ?? "Unknown"}`,
    `Name: ${fullName}`,
    `Email: ${event.email ?? "N/A"}`,
    `Amount: ${amountLabel}`,
    `Transaction: ${event.transactionId ?? "N/A"}`,
    `Status: ${event.status ?? "N/A"}`,
  ].join("\n")

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: text }),
    })
  } catch (error) {
    console.error("Failed to send Discord notification:", error)
  }
}



async function handleRefundOrChargeback(data: any) {
  const normalized = normalizeRefundEvent(data)
  if (!normalized) {
    return
  }

  const enriched = await enrichEventFromQuote(normalized)
  const now = new Date().toISOString()


  if (normalized.paddleEventId) {
    const existing = await db
      .select({ id: paddleRefundEvents.id })
      .from(paddleRefundEvents)
      .where(eq(paddleRefundEvents.paddleEventId, normalized.paddleEventId))
      .limit(1)

    if (existing.length > 0) {
      await db
        .update(paddleRefundEvents)
        .set({
          eventType: enriched.eventType,
          eventName: enriched.eventName,
          status: enriched.status,
          firstName: enriched.firstName,
          lastName: enriched.lastName,
          email: enriched.email,
          policyNumber: enriched.policyNumber,
          amount: enriched.amount,
          currency: enriched.currency,
          transactionId: enriched.transactionId,
          address: enriched.address,
          reason: enriched.reason,
          payload: enriched.payload,
          updatedAt: now,
        })
        .where(eq(paddleRefundEvents.id, existing[0].id))

      return
    }
  }

  await db.insert(paddleRefundEvents).values({
    paddleEventId: enriched.paddleEventId,
    eventType: enriched.eventType,
    eventName: enriched.eventName,
    status: enriched.status,
    firstName: enriched.firstName,
    lastName: enriched.lastName,
    email: enriched.email,
    policyNumber: enriched.policyNumber,
    amount: enriched.amount,
    currency: enriched.currency,
    transactionId: enriched.transactionId,
    address: enriched.address,
    reason: enriched.reason,
    payload: enriched.payload,
    createdAt: now,
    updatedAt: now,
  })
  await sendDiscordRefundNotification(enriched)
}