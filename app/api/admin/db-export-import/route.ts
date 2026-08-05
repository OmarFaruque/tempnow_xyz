import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";
import * as schema from "@/lib/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Mapping of table keys to their drizzle-orm table objects and primary/unique key info
const TABLES_MAP: Record<string, {
  table: any;
  label: string;
  idColumn: string;
  isSerial: boolean;
  getMatchQuery: (row: any) => any;
}> = {
  settings: {
    table: schema.settings,
    label: "Settings",
    idColumn: "param",
    isSerial: false,
    getMatchQuery: (row: any) => eq(schema.settings.param, row.param),
  },
  admins: {
    table: schema.admins,
    label: "Admins",
    idColumn: "adminId",
    isSerial: true,
    getMatchQuery: (row: any) => eq(schema.admins.email, row.email),
  },
  users: {
    table: schema.users,
    label: "Users",
    idColumn: "userId",
    isSerial: true,
    getMatchQuery: (row: any) => eq(schema.users.email, row.email),
  },
  quotes: {
    table: schema.quotes,
    label: "Orders (Quotes)",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => eq(schema.quotes.policyNumber, row.policyNumber),
  },
  coupons: {
    table: schema.coupons,
    label: "Coupons",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => eq(schema.coupons.promoCode, row.promoCode),
  },
  tickets: {
    table: schema.tickets,
    label: "Tickets",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => eq(schema.tickets.id, row.id),
  },
  messages: {
    table: schema.messages,
    label: "Messages",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => eq(schema.messages.id, row.id),
  },
  blacklist: {
    table: schema.blacklist,
    label: "Blacklist",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => eq(schema.blacklist.id, row.id),
  },
  aiDocuments: {
    table: schema.aiDocuments,
    label: "AI Documents",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => eq(schema.aiDocuments.id, row.id),
  },
  paddleRefundEvents: {
    table: schema.paddleRefundEvents,
    label: "Paddle Refund Events",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => eq(schema.paddleRefundEvents.id, row.id),
  },
};

// PostgreSQL actual table name mapper (for sequence resets)
const DB_TABLE_NAMES: Record<string, { tableName: string; idColumnName: string }> = {
  admins: { tableName: "admins", idColumnName: "admin_id" },
  users: { tableName: "users", idColumnName: "user_id" },
  quotes: { tableName: "quotes", idColumnName: "id" },
  coupons: { tableName: "coupons", idColumnName: "id" },
  tickets: { tableName: "tickets", idColumnName: "id" },
  messages: { tableName: "messages", idColumnName: "id" },
  blacklist: { tableName: "blacklist", idColumnName: "id" },
  aiDocuments: { tableName: "ai_documents", idColumnName: "id" },
  paddleRefundEvents: { tableName: "paddle_refund_events", idColumnName: "id" },
};

export async function GET(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const tableMetadata: any[] = [];

    for (const [key, config] of Object.entries(TABLES_MAP)) {
      const [{ countValue }] = await db.select({ countValue: sql<number>`count(*)` }).from(config.table);
      tableMetadata.push({
        id: key,
        label: config.label,
        rowsCount: Number(countValue),
      });
    }

    return NextResponse.json({ success: true, tables: tableMetadata });
  } catch (error: any) {
    console.error("Error fetching tables metadata:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch metadata" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!(await isAdmin(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === "export") {
      const { tables } = body;
      if (!tables || !Array.isArray(tables) || tables.length === 0) {
        return NextResponse.json({ error: "No tables selected for export" }, { status: 400 });
      }

      const exportedData: Record<string, any[]> = {};

      for (const tableKey of tables) {
        const config = TABLES_MAP[tableKey];
        if (!config) continue;

        const rows = await db.select().from(config.table);
        exportedData[tableKey] = rows;
      }

      return NextResponse.json({
        success: true,
        timestamp: new Date().toISOString(),
        version: "1.0",
        data: exportedData,
      });
    }

    if (action === "import") {
      const { payload } = body;
      if (!payload || !payload.data || typeof payload.data !== "object") {
        return NextResponse.json({ error: "Invalid backup payload provided" }, { status: 400 });
      }

      const { data } = payload;
      const importedTables = Object.keys(data);

      // Verify that all keys exist in TABLES_MAP
      for (const tableKey of importedTables) {
        if (!TABLES_MAP[tableKey]) {
          return NextResponse.json({ error: `Unknown table in backup: ${tableKey}` }, { status: 400 });
        }
      }

      // Execute upserts inside a single transaction
      const stats = { updated: 0, inserted: 0 };

      await db.transaction(async (tx) => {
        for (const tableKey of importedTables) {
          const config = TABLES_MAP[tableKey];
          const rows = data[tableKey];

          if (!Array.isArray(rows)) continue;

          for (const row of rows) {
            // Find and delete any conflicting existing rows to preserve exact user_id, quote id, and other properties
            let conflictFound = false;

            if (tableKey === "users") {
              const checkEmail = await tx.select().from(schema.users).where(eq(schema.users.email, row.email)).limit(1);
              const checkId = await tx.select().from(schema.users).where(eq(schema.users.userId, row.userId)).limit(1);
              if (checkEmail.length > 0 || checkId.length > 0) {
                conflictFound = true;
                await tx.delete(schema.users).where(
                  sql`${schema.users.email} = ${row.email} OR ${schema.users.userId} = ${row.userId}`
                );
              }
            } else if (tableKey === "quotes") {
              const checkPolicy = await tx.select().from(schema.quotes).where(eq(schema.quotes.policyNumber, row.policyNumber)).limit(1);
              const checkId = await tx.select().from(schema.quotes).where(eq(schema.quotes.id, row.id)).limit(1);
              if (checkPolicy.length > 0 || checkId.length > 0) {
                conflictFound = true;
                await tx.delete(schema.quotes).where(
                  sql`${schema.quotes.policyNumber} = ${row.policyNumber} OR ${schema.quotes.id} = ${row.id}`
                );
              }
            } else if (tableKey === "settings") {
              const checkParam = await tx.select().from(schema.settings).where(eq(schema.settings.param, row.param)).limit(1);
              if (checkParam.length > 0) {
                conflictFound = true;
                await tx.delete(schema.settings).where(eq(schema.settings.param, row.param));
              }
            } else if (tableKey === "admins") {
              const checkEmail = await tx.select().from(schema.admins).where(eq(schema.admins.email, row.email)).limit(1);
              const checkId = await tx.select().from(schema.admins).where(eq(schema.admins.adminId, row.adminId)).limit(1);
              if (checkEmail.length > 0 || checkId.length > 0) {
                conflictFound = true;
                await tx.delete(schema.admins).where(
                  sql`${schema.admins.email} = ${row.email} OR ${schema.admins.adminId} = ${row.adminId}`
                );
              }
            } else if (tableKey === "coupons") {
              const checkPromo = await tx.select().from(schema.coupons).where(eq(schema.coupons.promoCode, row.promoCode)).limit(1);
              const checkId = await tx.select().from(schema.coupons).where(eq(schema.coupons.id, row.id)).limit(1);
              if (checkPromo.length > 0 || checkId.length > 0) {
                conflictFound = true;
                await tx.delete(schema.coupons).where(
                  sql`${schema.coupons.promoCode} = ${row.promoCode} OR ${schema.coupons.id} = ${row.id}`
                );
              }
            } else {
              // Generic fallback delete by id column
              const idVal = row[config.idColumn];
              if (idVal !== undefined) {
                const checkId = await tx.select().from(config.table).where(eq(config.table[config.idColumn], idVal)).limit(1);
                if (checkId.length > 0) {
                  conflictFound = true;
                  await tx.delete(config.table).where(eq(config.table[config.idColumn], idVal));
                }
              }
            }

            // Insert row exactly as-is from backup (keeping original ids)
            await tx.insert(config.table).values(row);

            if (conflictFound) {
              stats.updated++;
            } else {
              stats.inserted++;
            }
          }

          // Reset the serial sequence to ensure future auto-increment doesn't collide
          const seqInfo = DB_TABLE_NAMES[tableKey];
          if (config.isSerial && seqInfo) {
            await tx.execute(
              sql.raw(
                `SELECT setval(pg_get_serial_sequence('"${seqInfo.tableName}"', '${seqInfo.idColumnName}'), COALESCE(max("${seqInfo.idColumnName}"), 1)) FROM "${seqInfo.tableName}"`
              )
            );
          }
        }
      });

      return NextResponse.json({
        success: true,
        message: `Import completed successfully. Imported ${stats.inserted} new rows, updated ${stats.updated} existing rows.`,
        stats,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Export/Import execution error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}
