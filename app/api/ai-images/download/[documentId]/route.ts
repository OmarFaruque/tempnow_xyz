import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { aiDocuments } from "@/lib/schema";
import { and, eq } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: { documentId: string } },
) {
  try {
    const record = await db
      .select({ content: aiDocuments.content })
      .from(aiDocuments)
      .where(
        and(
          eq(aiDocuments.uuid, params.documentId),
          eq(aiDocuments.status, "paid"),
        ),
      )
      .limit(1);

    if (!record.length || !record[0].content) {
      return NextResponse.json(
        { error: "Image not found or payment incomplete." },
        { status: 404 },
      );
    }

    const rawContent = record[0].content;
    const dataUrlMatch = rawContent.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);

    if (!dataUrlMatch) {
      return NextResponse.json(
        { error: "Stored content is not a valid downloadable image." },
        { status: 400 },
      );
    }

    const mimeType = dataUrlMatch[1];
    const base64Data = dataUrlMatch[2];
    const imageBuffer = Buffer.from(base64Data, "base64");

    const extension = mimeType.split("/")[1] || "png";

    return new NextResponse(imageBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Disposition": `attachment; filename="ai-image-${params.documentId}.${extension}"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Error downloading paid image:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}