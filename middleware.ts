import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createMiddlewareSettingsCache } from "./lib/middleware-settings-cache"

// Settings changes may take up to 30 seconds to reach a warm middleware instance.
const getCachedSettings = createMiddlewareSettingsCache<any>(30_000)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isAdminPath = pathname.startsWith("/administrator") || pathname.startsWith("/admin-login")
  const isFrameworkPath = pathname.startsWith("/_next") || pathname.startsWith("/api")
  const isPublicAsset = /\.[^/]+$/.test(pathname)
  const isMaintenancePage = pathname === "/maintenance"

  // Only page requests need the site-wide routing settings.
  if (!isFrameworkPath && !isAdminPath && !isPublicAsset) {
      try {
      const settings = await getCachedSettings(request.nextUrl.origin, async () => {
        const response = await fetch(new URL("/api/internal/settings", request.url), {
          cache: "no-store",
          signal: AbortSignal.timeout(10000),
        })
        if (!response.ok) throw new Error(`Settings request failed: ${response.status}`)
        return response.json()
      })

         const aiSlug = settings?.aiSlug || settings?.general?.aiSlug || "ai-documents"
      if (aiSlug !== "ai-documents" && (pathname === `/${aiSlug}` || pathname.startsWith(`/${aiSlug}/`))) {
        const rest = pathname.slice(aiSlug.length + 1)
        return NextResponse.rewrite(new URL(`/ai-documents${rest}`, request.url))
      }

      if (settings?.maintenance?.enabled && !isMaintenancePage) {
        return NextResponse.rewrite(new URL("/maintenance", request.url))
      }

      if (String(settings?.activeRedirection) === "1" && settings?.redirectUrl) {
        const configuredTargetUrl = new URL(settings.redirectUrl, request.url)
        const shouldUseSpecificRedirectPath =
          settings?.useSpecificRedirectPath === true || settings?.useSpecificRedirectPath === "yes"
        if (shouldUseSpecificRedirectPath) {
          const target = new URL(request.nextUrl.pathname + request.nextUrl.search, configuredTargetUrl.origin)
          if (target.href !== request.nextUrl.href) return NextResponse.redirect(target)
        } else if (configuredTargetUrl.href !== request.nextUrl.href) {
          return NextResponse.redirect(configuredTargetUrl)
        }
      }
       } catch (error) {
      // Fail open and retry on the next request; errors are not cached.
      console.error("Middleware settings fetch error:", error)
    }
  }
  

  // Check if accessing admin routes
  if (pathname.startsWith("/administrator")) {
    // Check for admin authentication
    const adminToken = request.cookies.get("adminAuthToken")?.value
    const isAdminAuthenticated = request.cookies.get("isAdminAuthenticated")?.value

    // If not authenticated, redirect to admin login
    if (!adminToken || isAdminAuthenticated !== "true") {
      return NextResponse.redirect(new URL("/admin-login", request.url))
    }
  }

  // Add security headers
  const response = NextResponse.next()

  // Security headers
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("X-XSS-Protection", "1; mode=block")

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
