import { db } from "@/lib/db";
import { tickets } from "@/lib/schema";
import { eq } from "drizzle-orm";

const DISCORD_API_BASE = "https://discord.com/api/v10";

function getDiscordConfig() {
  const botToken = process.env.DISCORD_BOT_TOKEN;
  const guildId = process.env.DISCORD_GUILD_ID;
  const categoryId = process.env.DISCORD_TICKET_CATEGORY_ID;
  const supportRoleId = process.env.DISCORD_SUPPORT_ROLE_ID;
  const ownerUserId = process.env.DISCORD_OWNER_USER_ID;

  if (!botToken || !guildId || !categoryId || !supportRoleId || !ownerUserId) {
    return null;
  }

  return { botToken, guildId, categoryId, supportRoleId, ownerUserId };
}

async function discordRequest(path: string, init: RequestInit, botToken: string) {
  const response = await fetch(`${DISCORD_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bot ${botToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Discord API ${response.status}: ${body}`);
  }

  return response.status === 204 ? null : response.json();
}

export async function getOrCreateTicketDiscordChannel(ticketId: number) {
  const config = getDiscordConfig();
  if (!config) return null;

  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  const ticket = ticketRows[0];
  if (!ticket) return null;
  if (ticket.discordChannelId) return ticket.discordChannelId;

  const channelName = `ticket-${ticket.id}`;
  const created = await discordRequest(`/guilds/${config.guildId}/channels`, {
    method: "POST",
    body: JSON.stringify({
      name: channelName,
      type: 0,
      parent_id: config.categoryId,
      topic: `Ticket #${ticket.id} | ${ticket.firstName} ${ticket.lastName} <${ticket.email}>`,
      permission_overwrites: [
        { id: config.guildId, type: 0, deny: "1024" },
        { id: config.supportRoleId, type: 0, allow: "1024" },
        { id: config.ownerUserId, type: 1, allow: "1024" },
      ],
    }),
  }, config.botToken);

  await db.update(tickets).set({
    discordChannelId: created.id,
    updatedAt: new Date().toISOString(),
  }).where(eq(tickets.id, ticketId));

  return created.id as string;
}

export async function sendDiscordTicketMessage(ticketId: number, text: string, isAdmin: boolean, attachmentUrls: string[] = []) {
  const config = getDiscordConfig();
  if (!config) return;

  const channelId = await getOrCreateTicketDiscordChannel(ticketId);
  if (!channelId) return;

  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  const ticket = ticketRows[0];
  if (!ticket) return;

  const lines = [
    `**Ticket #${ticket.id}**`,
    `**Subject:** ${ticket.subject}`,
    `**Customer:** ${ticket.firstName} ${ticket.lastName} (${ticket.email})`,
    `**From:** ${isAdmin ? "Support" : "Customer"}`,
    `**Timestamp (UTC):** ${new Date().toISOString()}`,
    "",
    text,
  ];

  if (attachmentUrls.length > 0) {
    lines.push("", "**Attachments:**", ...attachmentUrls);
  }

  await discordRequest(`/channels/${channelId}/messages`, {
    method: "POST",
    body: JSON.stringify({ content: lines.join("\n") }),
  }, config.botToken);
}

export async function closeDiscordTicketChannel(ticketId: number) {
  const config = getDiscordConfig();
  if (!config) return;

  const ticketRows = await db.select().from(tickets).where(eq(tickets.id, ticketId)).limit(1);
  const ticket = ticketRows[0];
  if (!ticket?.discordChannelId) return;
  const channelId = ticket.discordChannelId;
  await discordRequest(`/channels/${channelId}`, { method: "DELETE" }, config.botToken);
  await db.update(tickets).set({ discordChannelId: null, updatedAt: new Date().toISOString() }).where(eq(tickets.id, ticketId));
}