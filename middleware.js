import { NextResponse } from "next/server";

// Changed to export default
export default function proxy(request) {
  // Check for your backend's refresh token cookie to verify session existence
  const hasToken = request.cookies.has("refreshToken"); 
  
  const pathname = request.nextUrl.pathname;
  const isAuthRoute = pathname.startsWith("/login") || pathname.startsWith("/register");
  
  // Protect all routes outlined in your architecture plan
  const protectedPaths = [
    "/feed", "/liked", "/playlists", "/tweets",
    "/upload", "/go-live", "/dashboard", "/channel/edit",
    "/activity",   // ← ADD
    "/settings",   // ← ADD
]
  
  const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));

  // Redirect unauthorized users to login
  if (isProtectedRoute && !hasToken) {
     const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("redirect", pathname)  // ← ADD: redirect back after login
        return NextResponse.redirect(loginUrl)
  }

  // Redirect authenticated users away from auth pages
  if (isAuthRoute && hasToken) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};