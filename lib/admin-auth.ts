import { NextRequest } from "next/server";
import { createRateLimiter } from "./validation"
import { db } from '@/lib/db';
import { admins } from '@/lib/schema';
import { eq } from 'drizzle-orm';
import { compare } from 'bcryptjs';
import { jwtVerify } from "jose";

// Rate limiter for admin login attempts
const adminLoginRateLimit = createRateLimiter(15 * 60 * 1000, 5) // 5 attempts per 15 minutes

export interface AdminUser {
  admin_id: number;
  email: string | null;
  role: string | null;
}

export async function validateAdminCredentials(email: string, password_provided: string, clientIP: string) {
    const { success, remaining } = adminLoginRateLimit.limit(clientIP);
    if (!success) {
        return { isValid: false, rateLimited: true, error: "Too many login attempts. Please try again later." };
    }

    const adminUsers = await db.select().from(admins).where(eq(admins.email, email));

    if (adminUsers.length === 0) {
        return { isValid: false, error: "Invalid credentials" };
    }

    const adminUser = adminUsers[0];
    const storedPassword = adminUser.password || "";

    const isPasswordValid = await compare(password_provided, storedPassword);

    if (!isPasswordValid) {
        return { isValid: false, error: "Invalid credentials" };
    }

    return { isValid: true, user: { id: adminUser.adminId, email: adminUser.email, role: adminUser.role } };
}


export async function isAdmin(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get('adminAuthToken')?.value;

  if (!token) {
    return false;
  }

  try {
    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'your-fallback-secret');
    await jwtVerify(token, secret);
    return true;
  } catch (error) {
    console.error("JWT verification failed:", error);
    return false;
  }
}

export function setAdminAuthToken(token: string): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("adminAuthToken", token)
  }
}

export function clearAdminAuthToken(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("adminAuthToken")
  }
}