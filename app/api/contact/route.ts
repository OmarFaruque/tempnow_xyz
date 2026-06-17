
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tickets, messages } from "@/lib/schema";
import { sendTicketConfirmationEmail, sendExistingTicketEmail } from "@/lib/email";
import { sendDiscordTicketMessage } from "@/lib/discord";
import { eq, and, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export async function POST(req: Request) {
  try {
    const { firstName, lastName, email, subject, message } = await req.json();

    if (!firstName || !lastName || !email || !subject || !message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const existingTicket = await db.query.tickets.findFirst({
      where: and(
        eq(tickets.email, email),
        eq(tickets.isClosed, false),
        ne(tickets.status, "closed")
      ),
    });

    if (existingTicket) {
      // If an open ticket exists, send an email and do not create a new message or update the ticket.
      await sendExistingTicketEmail({
        to: email,
        name: `${firstName} ${lastName}`,
        ticketToken: existingTicket.token,
      });

      return NextResponse.json(
        {
          message: "An open ticket already exists. We've sent you an email with a link to view it.",
          existingTicket: true,
        },
        { status: 200 }
      );
    }

    // Create new ticket if no open ticket was found
    const newTicket = await db
      .insert(tickets)
      .values({
        firstName,
        lastName,
        email,
        subject,
        token: Math.random().toString(36).substring(2, 15),
      })
      .returning();
      
    const ticketId = newTicket[0].id;
    const ticketToken = newTicket[0].token;

    // Add the first message to the new ticket
    await db.insert(messages).values({
      ticketId: ticketId,
      messageId: Math.random().toString(36).substring(2, 15),
      message: message,
    });

    await sendDiscordTicketMessage(ticketId, message, false);
    // Send a confirmation email for the new ticket
    await sendTicketConfirmationEmail({
      to: email,
      subject: "We have received your ticket",
      name: `${firstName} ${lastName}`,
      ticketId: ticketToken,
    });

    revalidatePath('/api/admin/tickets');
    revalidatePath('/administrator');

    return NextResponse.json({ message: "Ticket created successfully", ticket: { id: ticketId, token: ticketToken } }, { status: 201 });
  } catch (error) {
    console.error("Error processing contact form:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
