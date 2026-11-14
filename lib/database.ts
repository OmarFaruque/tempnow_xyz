import { unstable_noStore as noStore } from 'next/cache';
import { db } from "./db"
import { quotes, users, settings } from "./schema"
import { eq, and } from "drizzle-orm"
import type { Quote, User } from "./definitions"

import { desc } from "drizzle-orm"

export async function getPoliciesByUserId(userId: string): Promise<any[]> {
  const userPolicies = await db.select().from(quotes).where(and(eq(quotes.userId, parseInt(userId, 10)), eq(quotes.paymentStatus, 'paid'))).orderBy(desc(quotes.createdAt))

  const now = new Date();

  return userPolicies.map(policy => {
    const startDate = new Date(policy.startDate);
    const endDate = new Date(policy.endDate);
    let status = policy.status; // Preserve existing status if set (e.g., 'cancelled')

    if (status !== 'cancelled') { // Only calculate if not explicitly cancelled
      if (now < startDate) {
        status = 'pending';
      } else if (now >= startDate && now <= endDate) {
        status = 'active';
      } else if (now > endDate) {
        status = 'expired';
      }
    }

    return { ...policy, status };
  });
}

export async function getUserById(userId: string): Promise<any | null> {
  const [user] = await db.select().from(users).where(eq(users.userId, parseInt(userId, 10)))
  return user || null
}

export async function updateUser(userId: string, updates: Partial<User>): Promise<User | null> {
  const [updatedUser] = await db.update(users).set(updates).where(eq(users.userId, parseInt(userId, 10))).returning()
  return updatedUser || null
}

// Settings hardly ever change, so keep one copy in memory instead of
// asking the database on every request.
const SETTINGS_TTL = 60 * 1000

type SettingsStore = {
  data: { [key: string]: any } | null
  loadedAt: number
  pending: Promise<{ [key: string]: any }> | null
}

const globalStore = globalThis as unknown as { __settingsStore?: SettingsStore }
const settingsStore: SettingsStore =
  globalStore.__settingsStore || (globalStore.__settingsStore = { data: null, loadedAt: 0, pending: null })

async function loadSettings() {
  const rows = await db.select().from(settings)
  const result: { [key: string]: any } = {}
  for (const row of rows) {
    if (!row.param || !row.value) continue
    try {
      result[row.param] = JSON.parse(row.value)
    } catch (e) {
      console.error(`Bad settings value for "${row.param}"`, e)
    }
  }
   return result
}

export function clearSettingsCache() {
  settingsStore.data = null
  settingsStore.loadedAt = 0
  settingsStore.pending = null
}

export async function getAllSettings(): Promise<any | null> {
  noStore();
  if (settingsStore.data && Date.now() - settingsStore.loadedAt < SETTINGS_TTL) {
    return settingsStore.data
  }
  
   // if a load is already running, wait for that one
  if (!settingsStore.pending) {
    const pending = loadSettings()
      .then((data) => {
        if (settingsStore.pending === pending) {
          settingsStore.data = data
          settingsStore.loadedAt = Date.now()
        }
        return data
      })
      .finally(() => {
        if (settingsStore.pending === pending) settingsStore.pending = null
      })
    settingsStore.pending = pending
  }

  return settingsStore.pending
}

export async function getSettings(param: string): Promise<any | null> {
  const all = await getAllSettings()
  const value = all?.[param]
  if (value === undefined || value === null) return null
  // hand out a copy so callers can't change the cached one by accident
  return typeof value === "object" ? structuredClone(value) : value
}

// Straight from the database, no cache. For values the app itself rewrites
// while running (payment quota windows etc).
export async function getFreshSettings(param: string): Promise<any | null> {
  noStore();
  const [setting] = await db.select().from(settings).where(eq(settings.param, param))
  if (setting && setting.value) {
    return JSON.parse(setting.value)
  }
  return null
}