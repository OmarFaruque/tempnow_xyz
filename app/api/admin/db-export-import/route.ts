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
    getMatchQuery: (row: any) => row.param ? eq(schema.settings.param, row.param) : sql`FALSE`,
  },
  admins: {
    table: schema.admins,
    label: "Admins",
    idColumn: "adminId",
    isSerial: true,
    getMatchQuery: (row: any) => row.email ? eq(schema.admins.email, row.email) : sql`FALSE`,
  },
  users: {
    table: schema.users,
    label: "Users",
    idColumn: "userId",
    isSerial: true,
    getMatchQuery: (row: any) => row.email ? eq(schema.users.email, row.email) : sql`FALSE`,
  },
  quotes: {
    table: schema.quotes,
    label: "Orders (Quotes)",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => row.policyNumber ? eq(schema.quotes.policyNumber, row.policyNumber) : sql`FALSE`,
  },
  coupons: {
    table: schema.coupons,
    label: "Coupons",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => row.promoCode ? eq(schema.coupons.promoCode, row.promoCode) : sql`FALSE`,
  },
  tickets: {
    table: schema.tickets,
    label: "Tickets",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => row.token ? eq(schema.tickets.token, row.token) : sql`FALSE`,
  },
  messages: {
    table: schema.messages,
    label: "Messages",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => row.messageId ? eq(schema.messages.messageId, row.messageId) : sql`FALSE`,
  },
  blacklist: {
    table: schema.blacklist,
    label: "Blacklist",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => {
      if (row.type === 'ip' && row.ipAddress) return eq(schema.blacklist.ipAddress, row.ipAddress);
      if (row.type === 'postcode' && row.postcode) return eq(schema.blacklist.postcode, row.postcode);
      if (row.type === 'reg_number' && row.regNumber) return eq(schema.blacklist.regNumber, row.regNumber);
      if (row.type === 'user' && row.email) return sql`${schema.blacklist.email} = ${row.email} AND ${schema.blacklist.firstName} = ${row.firstName} AND ${schema.blacklist.lastName} = ${row.lastName}`;
      return sql`FALSE`;
    },
  },
  aiDocuments: {
    table: schema.aiDocuments,
    label: "AI Documents",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => row.uuid ? eq(schema.aiDocuments.uuid, row.uuid) : sql`FALSE`,
  },
  paddleRefundEvents: {
    table: schema.paddleRefundEvents,
    label: "Paddle Refund Events",
    idColumn: "id",
    isSerial: true,
    getMatchQuery: (row: any) => row.paddleEventId ? eq(schema.paddleRefundEvents.paddleEventId, row.paddleEventId) : sql`FALSE`,
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


const IMPORT_ORDER = [
  "settings",
  "admins",
  "users",
  "coupons",
  "quotes",
  "blacklist",
  "paddleRefundEvents",
  "aiDocuments",
  "tickets",
  "messages",
];

const DELETE_ORDER = [...IMPORT_ORDER].reverse();


const resetSerialSequence = async (tx: any, tableKey: string) => {
  const config = TABLES_MAP[tableKey];
  const seqInfo = DB_TABLE_NAMES[tableKey];
  if (!config?.isSerial || !seqInfo) return;

  await tx.execute(
    sql.raw(
      `SELECT setval(pg_get_serial_sequence('"${seqInfo.tableName}"', '${seqInfo.idColumnName}'), COALESCE(max("${seqInfo.idColumnName}"), 1)) FROM "${seqInfo.tableName}"`
    )
  );
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
      const { payload, mode = "append", tables } = body;
      if (!payload || !payload.data || typeof payload.data !== "object") {
        return NextResponse.json({ error: "Invalid backup payload provided" }, { status: 400 });
      }

      if (!["append", "override"].includes(mode)) {
        return NextResponse.json({ error: "Invalid import mode" }, { status: 400 });
      }

      const { data } = payload;
      const backupTables = Object.keys(data);
      const importedTables = Array.isArray(tables) && tables.length > 0 ? tables : backupTables;

      // Verify that all selected keys exist in the backup and TABLES_MAP
      for (const tableKey of importedTables) {
        if (!TABLES_MAP[tableKey]) {
          return NextResponse.json({ error: `Unknown table selected for import: ${tableKey}` }, { status: 400 });
        }
        if (!backupTables.includes(tableKey)) {
          return NextResponse.json({ error: `Selected table is not present in backup: ${tableKey}` }, { status: 400 });
        }
      }

      // Pre-scan backup data to build maps
      const backupUserIdToEmail: Record<string | number, string> = {};
      const backupTicketIdToToken: Record<string | number, string> = {};

      if (data.users && Array.isArray(data.users)) {
        for (const u of data.users) {
          if (u.userId && u.email) {
            backupUserIdToEmail[u.userId] = u.email;
          }
        }
      }

      if (data.tickets && Array.isArray(data.tickets)) {
        for (const t of data.tickets) {
          if (t.id && t.token) {
            backupTicketIdToToken[t.id] = t.token;
          }
        }
      }

      // Execute imports inside a single transaction
      const stats = { updated: 0, inserted: 0, cleared: 0, skippedTables: backupTables.length - importedTables.length };

      await db.transaction(async (tx) => {
        // ID Mapping stores
        const userMap: Record<string | number, number> = {};
        const ticketMap: Record<string | number, number> = {};
        const dbEmailToUserId: Record<string, number> = {};
        const dbTokenToTicketId: Record<string, number> = {};

        // Fetch existing users and tickets from the database for mapping
        const existingUsers = await tx.select({ userId: schema.users.userId, email: schema.users.email }).from(schema.users);
        for (const u of existingUsers) {
          if (u.email) {
            dbEmailToUserId[u.email.toLowerCase()] = u.userId;
          }
        }

        const existingTickets = await tx.select({ id: schema.tickets.id, token: schema.tickets.token }).from(schema.tickets);
        for (const t of existingTickets) {
          if (t.token) {
            dbTokenToTicketId[t.token] = t.id;
          }
        }

        if (mode === "override") {
          for (const tableKey of DELETE_ORDER) {
            if (!importedTables.includes(tableKey)) continue;
            const config = TABLES_MAP[tableKey];
            const [{ countValue }] = await tx.select({ countValue: sql<number>`count(*)` }).from(config.table);
            await tx.delete(config.table);
            stats.cleared += Number(countValue);

            // Clear the local cache for deleted tables
            if (tableKey === "users") {
              for (const email in dbEmailToUserId) delete dbEmailToUserId[email];
            }
            if (tableKey === "tickets") {
              for (const token in dbTokenToTicketId) delete dbTokenToTicketId[token];
            }
          }
        }

        // Sort tables in dependency order
        const sortedImportedTables = [...importedTables].sort(
          (a, b) => IMPORT_ORDER.indexOf(a) - IMPORT_ORDER.indexOf(b)
        );

        for (const tableKey of sortedImportedTables) {
          const config = TABLES_MAP[tableKey];
          const rows = data[tableKey];

          if (!Array.isArray(rows)) continue;

          for (const rowData of rows) {
            const row = { ...rowData };

            // Apply ID mappings before checking/inserting
            if (tableKey === "quotes" || tableKey === "tickets" || tableKey === "aiDocuments") {
              if (row.userId !== undefined && row.userId !== null) {
                const backupUid = String(row.userId);
                let targetUid: number | undefined;

                if (userMap[backupUid]) {
                  targetUid = userMap[backupUid];
                } else {
                  const email = backupUserIdToEmail[backupUid];
                  if (email && dbEmailToUserId[email.toLowerCase()]) {
                    targetUid = dbEmailToUserId[email.toLowerCase()];
                  }
                }

                if (targetUid !== undefined) {
                  row.userId = tableKey === "aiDocuments" ? targetUid : String(targetUid);
                }
              }
            }

            if (tableKey === "messages") {
              if (row.ticketId !== undefined && row.ticketId !== null) {
                const backupTid = String(row.ticketId);
                let targetTid: number | undefined;

                if (ticketMap[backupTid]) {
                  targetTid = ticketMap[backupTid];
                } else {
                  const token = backupTicketIdToToken[backupTid];
                  if (token && dbTokenToTicketId[token]) {
                    targetTid = dbTokenToTicketId[token];
                  }
                }

                if (targetTid !== undefined) {
                  row.ticketId = targetTid;
                }
              }
            }

            // check duplicate
            let existingRecord: any = null;
            if (mode !== "override") {
              const query = config.getMatchQuery(row);
              const existingResult = await tx.select().from(config.table).where(query).limit(1);
              if (existingResult.length > 0) {
                existingRecord = existingResult[0];
              }
            }

            if (existingRecord) {
              // Update existing record (exclude primary key ID column)
              const updateData = { ...row };
              delete updateData[config.idColumn];

              await tx.update(config.table).set(updateData).where(eq(config.table[config.idColumn], existingRecord[config.idColumn]));
              stats.updated++;

              // Cache ID mappings
              if (tableKey === "users") {
                userMap[row.userId] = existingRecord.userId;
                if (row.email) {
                  dbEmailToUserId[row.email.toLowerCase()] = existingRecord.userId;
                }
              } else if (tableKey === "tickets") {
                ticketMap[row.id] = existingRecord.id;
                if (row.token) {
                  dbTokenToTicketId[row.token] = existingRecord.id;
                }
              }
            } else {
              // Insert new record
              // If isSerial is true and ID is specified, check if the ID already exists in DB to prevent conflicts
              let insertData = { ...row };
              let idConflict = false;

              if (config.isSerial && row[config.idColumn] !== undefined) {
                const checkId = await tx.select().from(config.table).where(eq(config.table[config.idColumn], row[config.idColumn])).limit(1);
                if (checkId.length > 0) {
                  idConflict = true;
                }
              }

              if (idConflict) {
                // Remove ID to let DB auto-increment generate a new one
                delete insertData[config.idColumn];
              }

              const insertedResult = await tx.insert(config.table).values(insertData).returning();
              const insertedRow = insertedResult[0];
              stats.inserted++;

              // Cache ID mappings
              if (tableKey === "users" && insertedRow) {
                userMap[row.userId] = insertedRow.userId;
                if (row.email) {
                  dbEmailToUserId[row.email.toLowerCase()] = insertedRow.userId;
                }
              } else if (tableKey === "tickets" && insertedRow) {
                ticketMap[row.id] = insertedRow.id;
                if (row.token) {
                  dbTokenToTicketId[row.token] = insertedRow.id;
                }
              }
            }
          }

          // Reset the serial sequence to ensure future auto-increment doesn't collide
          await resetSerialSequence(tx, tableKey);
        }
      });

      return NextResponse.json({
        success: true,
        message: `Import completed successfully. Imported ${stats.inserted} new rows, updated ${stats.updated} existing rows, cleared ${stats.cleared} rows from selected tables.`,
        stats,
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Export/Import execution error:", error);
    return NextResponse.json({ error: error.message || "Failed to process request" }, { status: 500 });
  }
}

