import { unstable_noStore as noStore } from 'next/cache';
import { db } from "@/lib/db"
import { quotes, users, settings } from "@/lib/schema"
import { eq, and } from "drizzle-orm"
import type { Quote, User } from "@/core/types"

import { desc } from "drizzle-orm"

export async function fetchOrdersByUserId(userId: string): Promise<any[]> {
  const userPolicies = await db.select().from(quotes).where(and(eq(quotes.userId, userId), eq(quotes.paymentStatus, 'paid'))).orderBy(desc(quotes.createdAt))

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

export async function fetchMemberById(userId: string): Promise<any | null> {
  const [user] = await db.select().from(users).where(eq(users.userId, parseInt(userId, 10)))
  return user || null
}

export async function updateMember(userId: string, updates: Partial<User>): Promise<User | null> {
  const [updatedUser] = await db.update(users).set(updates).where(eq(users.userId, parseInt(userId, 10))).returning()
  return updatedUser || null
}

export async function fetchSetting(param: string): Promise<any | null> {
  noStore();
  if (!process.env.DATABASE_URL) return null;
  try {
    const [setting] = await db.select().from(settings).where(eq(settings.param, param))
    if (setting && setting.value !== null && setting.value !== undefined) {
      if (typeof setting.value === 'object') return setting.value;
      if (typeof setting.value === 'string') {
        try {
          return JSON.parse(setting.value)
        } catch (e) {
          return setting.value
        }
      }
      return setting.value;
    }
    return null
  } catch (error) {
    console.error(`Failed to fetch setting "${param}":`, error)
    return null
  }
}

export async function fetchAllSettings(): Promise<any | null> {
  noStore();
  if (!process.env.DATABASE_URL) return null;
  try {
    const allSettings = await db.select().from(settings);
    if (!allSettings) return null;

    const settingsObject: { [key: string]: any } = {};
    for (const setting of allSettings) {
      if (setting.param && setting.value !== null && setting.value !== undefined) {
        if (typeof setting.value === 'object') {
          settingsObject[setting.param] = setting.value;
        } else if (typeof setting.value === 'string') {
          try {
            settingsObject[setting.param] = JSON.parse(setting.value);
          } catch (e) {
            settingsObject[setting.param] = setting.value;
          }
        } else {
          settingsObject[setting.param] = setting.value;
        }

      }
    }
    return settingsObject;
  } catch (error) {
    console.error("Failed to fetch all settings:", error)
    return null
  }
}
