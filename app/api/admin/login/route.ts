import { type NextRequest, NextResponse } from "next/server"
import { validateAdminCredentials } from "@/lib/admin-auth"
import { SignJWT } from "jose";

export async function POST(request: NextRequest) {
  try {
    const { email, password, clientIP } = await request.json()




    if (!email || !password) {
      return NextResponse.json({ success: false, error: "Email and password are required" }, { status: 400 })
    }

    const result = await validateAdminCredentials(email, password, clientIP || "unknown")

    if (result.rateLimited) {
      return NextResponse.json({ success: false, error: result.error }, { status: 429 })
    }

    if (!result.isValid || !result.user) {
      return NextResponse.json({ success: false, error: result.error }, { status: 401 })
    }

    const secret = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || 'your-fallback-secret');
    const token = await new SignJWT({ id: result.user.id, email: result.user.email, role: result.user.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);

    return NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
      token,
    })
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
