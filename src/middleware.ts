import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getToken } from "next-auth/jwt"

export async function middleware(req: NextRequest) {
  const pathname = req.nextUrl.pathname
  
  // Get the session token
  // NextAuth v5 uses 'next-auth.session-token' in development
  const token = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET,
    cookieName: "next-auth.session-token"
  })
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === "development" && pathname.startsWith("/dashboard")) {
    console.log("[Middleware] Path:", pathname)
    console.log("[Middleware] Token exists:", !!token)
    console.log("[Middleware] Cookies:", req.cookies.getAll().map(c => c.name))
  }

  // Allow access to public routes
  if (
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/reset-password") ||
    pathname.startsWith("/rsvp") ||
    pathname.startsWith("/api/rsvp") ||
    pathname.startsWith("/api/auth") ||
    pathname === "/"
  ) {
    return NextResponse.next()
  }

  // Protect dashboard and event routes
  if (
    pathname.startsWith("/dashboard") ||
    (pathname.startsWith("/events") && !pathname.startsWith("/events/new")) ||
    pathname.startsWith("/api/events")
  ) {
    // If not authenticated, redirect to login
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("callbackUrl", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
