import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { messages, tickets } from "@/lib/schema";
import { and, eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendTicketReplyEmail } from "@/lib/email";
import { revalidatePath } from "next/cache";
import { closeDiscordTicketChannel } from "@/lib/discord";

export async function POST(req: Request) {
  try {
    const apiKey = req.headers.get("x-discord-relay-key");
    if (!process.env.DISCORD_RELAY_API_KEY || apiKey !== process.env.DISCORD_RELAY_API_KEY) {
      console.error("[discord-relay] Unauthorized access attempt");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    // Support both the original relay format and raw Discord message format from Pipedream
    const channelId = body.channelId || body.channel_id;
    const messageContent = body.message || body.content;
    const author = body.author;
    const attachments = body.attachments || [];

    if (!channelId || (!messageContent && attachments.length === 0)) {
      return NextResponse.json({ error: "Invalid payload: channelId and message/attachments are required" }, { status: 400 });
    }

    // Ignore bot messages to prevent loops
    if (author?.bot) {
      return NextResponse.json({ ok: true, message: "Ignored bot message" });
    }

    const ticketRows = await db.select().from(tickets).where(eq(tickets.discordChannelId, channelId)).limit(1);
    if (ticketRows.length === 0) {
      console.error(`[discord-relay] No ticket mapping found for channel ${channelId}`);
      return NextResponse.json({ error: "Ticket channel mapping not found" }, { status: 404 });
    }
    const ticket = ticketRows[0];
    const ticketId = ticket.id;

    // Handle attachments from Discord's raw format
    const attachmentUrls = Array.isArray(attachments) 
      ? attachments.map((a: any) => typeof a === 'string' ? a : a.url)
      : [];

    const suffix = attachmentUrls.length > 0
      ? `\n\n${attachmentUrls.map(url => `[Download Attachment](${url})`).join("\n")}`
      : "";

    const finalMessage = `${messageContent || "(attachment only)"}${suffix}`;



    if(finalMessage.toLocaleLowerCase().includes("close ticket")) {
      await db.update(tickets)
        .set({ isClosed: true, status: 'closed', updatedAt: new Date().toISOString() })
        .where(eq(tickets.id, ticketId));
      
      await closeDiscordTicketChannel(ticketId);

      return NextResponse.json({ ok: true, message: "Ticket closed" });
    }

    const inserted = await db.insert(messages).values({
      ticketId,
      messageId: uuidv4(),
      message: finalMessage,
      isAdmin: true,
    }).returning();

    await db.update(tickets)
      .set({ updatedAt: new Date().toISOString() })
      .where(and(eq(tickets.id, ticketId), eq(tickets.isClosed, false)));

    // Send email notification to the customer
    try {
      const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || "").replace(/\/$/, "");
      const ticketUrl = `${baseUrl}/ticket/${ticket.token}`;
      await sendTicketReplyEmail({
        to: ticket.email,
        name: `${ticket.firstName} ${ticket.lastName}`,
        ticketId: ticket.token,
        message: messageContent || "View attachment in ticket",
        ticketUrl: ticketUrl,
      });
    } catch (emailError) {
      console.error("[discord-relay] Failed to send email:", emailError);
    }

    // Revalidate paths for admin and dashboard
    revalidatePath('/api/admin/tickets');
    revalidatePath('/administrator');

    return NextResponse.json({ ok: true, message: inserted[0] });
  } catch (error) {
    console.error("[discord-relay] API Error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}