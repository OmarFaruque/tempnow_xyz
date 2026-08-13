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

    // Also create a letterise admin_session cookie so a single login works for both dashboards.
    // The letterise admin uses JWT_SECRET (or ADMIN_JWT_SECRET) with role:'admin'.
    const letteriseSecret = new TextEncoder().encode(
      process.env.ADMIN_JWT_SECRET || process.env.JWT_SECRET || 'change-this-admin-secret-in-production'
    );
    const letteriseToken = await new SignJWT({ email: result.user.email, role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('8h')
      .sign(letteriseSecret);

    const response = NextResponse.json({
      success: true,
      user: {
        id: result.user.id,
        email: result.user.email,
        role: result.user.role,
      },
      token,
    });

    // Set the letterise admin_session as httpOnly cookie (same as letterise's createAdminSession does)
    response.cookies.set('admin_session', letteriseToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 8, // 8 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error("Admin login error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}
