import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiDocuments } from "@/lib/schema";
import { and, desc, eq } from "drizzle-orm";
import { v4 as uuidv4 } from 'uuid';
import { sendEmail, createAIDocumentPurchaseEmail, createAdminNotificationEmail, getAdminEmail } from "@/lib/email";


export async function POST(req: Request) {
  try {
    const { docDetails, userDetails, transaction } = await req.json();

    const paymentIntentId =
      transaction?.id ||
      transaction?.payment_intent ||
      transaction?.paymentIntentId ||
      (typeof transaction === "string" && transaction !== "paid"
        ? transaction
        : null);

    if (paymentIntentId) {
      const existingByPayment = await db
        .select({ id: aiDocuments.id, uuid: aiDocuments.uuid })
        .from(aiDocuments)
        .where(eq(aiDocuments.paymentIntentId, paymentIntentId))
        .limit(1);

      if (existingByPayment.length > 0) {
        return NextResponse.json({
          success: true,
          documentId: existingByPayment[0].id,
          documentUuid: existingByPayment[0].uuid,
        });
      }
    }

    const recentDuplicate = await db
      .select({ id: aiDocuments.id, uuid: aiDocuments.uuid })
      .from(aiDocuments)
      .where(
        and(
          eq(aiDocuments.userId, userDetails.id),
          eq(aiDocuments.prompt, docDetails.prompt),
          eq(aiDocuments.content, docDetails.content),
          eq(aiDocuments.status, "paid"),
        ),
      )
      .orderBy(desc(aiDocuments.id))
      .limit(1);

    if (recentDuplicate.length > 0) {
      return NextResponse.json({
        success: true,
        documentId: recentDuplicate[0].id,
        documentUuid: recentDuplicate[0].uuid,
      });
    }


    const newDocument = await db.insert(aiDocuments).values({
      uuid: uuidv4(),
      prompt: docDetails.prompt,
      content: docDetails.content,
      email: userDetails.email,
      userId: userDetails.id,
      amount: docDetails.price,
      status: 'paid',
      paymentIntentId
    }).returning({ id: aiDocuments.id, uuid: aiDocuments.uuid });

    const documentId = newDocument[0].id;
    const documentUuid = newDocument[0].uuid;

    // Send email in the background
    (async () => {
      try {
        const downloadLink = `${process.env.NEXT_PUBLIC_BASE_URL}/api/ai-documents/download-pdf/${documentUuid}`;
        const emailData = await createAIDocumentPurchaseEmail(
          userDetails.firstName,
          userDetails.lastName,
          documentId.toString(),
          new Date().toLocaleDateString(),
          docDetails.price,
          docDetails.prompt,
          downloadLink,
          docDetails.content,
        );
        const adminNotificationData = await createAdminNotificationEmail(
          "ai_document",
          userDetails.firstName,
          userDetails.email,
          docDetails.price,
          `Document Type: ${docDetails.prompt}`,
        );

        await sendEmail({
          to: userDetails.email,
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

    return NextResponse.json({ success: true, documentId, documentUuid });

  } catch (error) {
    console.error("Error saving document:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}