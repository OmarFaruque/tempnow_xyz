import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const url = request.nextUrl.clone()

  // --- START: New Redirect Logic ---
  // We only run the redirect logic on page loads, not on static assets or API routes
  // to avoid unnecessary fetches. The matcher below should handle this, but this is an extra safeguard.
  const isAdminPath = pathname.startsWith("/administrator") || pathname.startsWith("/admin-login");
  if (!pathname.startsWith('/_next') && !pathname.startsWith('/api') && !isAdminPath) {
      try {
        // Fetch settings from the internal API endpoint.
        // The response of this fetch will be cached by Next.js.
          
          const fetchUrl = new URL('/api/internal/settings', url);
          
          const settingsResponse = await fetch(fetchUrl, {
            // It's good practice to set a timeout for fetches in middleware.
            // This is not natively supported in Node's fetch, but some runtimes (like Vercel Edge) might handle it.
            // For now, we rely on the overall middleware timeout as a safety net.
        });

        if (settingsResponse.ok) {
          const settings = await settingsResponse.json();

          if (String(settings?.activeRedirection) === "1" && settings?.redirectUrl) {
            const configuredTargetUrl = new URL(settings.redirectUrl, request.url);
            const shouldUseSpecificRedirectPath =
              settings?.useSpecificRedirectPath === true || settings?.useSpecificRedirectPath === "yes";

            if (shouldUseSpecificRedirectPath) {
              const targetWithSamePathAndQuery = new URL(request.nextUrl.pathname + request.nextUrl.search, configuredTargetUrl.origin);

              if (targetWithSamePathAndQuery.href !== request.nextUrl.href) {
                return NextResponse.redirect(targetWithSamePathAndQuery);
              }
            } else if (configuredTargetUrl.href !== request.nextUrl.href) {
              return NextResponse.redirect(configuredTargetUrl);
            }
          }
        }
      } catch (error) {
        console.error('Middleware redirect fetch error:', error);
        // If the API call fails, we continue without redirecting.
        // This makes the redirect non-critical and prevents the site from going down.
      }
  }
  // --- END: New Redirect Logic ---

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
