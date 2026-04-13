import { type NextRequest, NextResponse } from "next/server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if route requires authentication
  if (pathname.startsWith("/dashboard")) {
    // TODO: Implement Supabase auth check
    // For now, we'll skip middleware implementation
    // In production, you would:
    // 1. Get the session from Supabase
    // 2. Verify the user is authenticated
    // 3. Redirect to /login if not authenticated

    // const response = await supabase.auth.getUser();
    // if (!response.data.user) {
    //   return NextResponse.redirect(new URL("/login", request.url));
    // }
  }

  // Redirect authenticated users away from auth pages
  if (pathname.startsWith("/login") || pathname.startsWith("/register")) {
    // TODO: Check if user is already authenticated
    // If so, redirect to /dashboard
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login", "/register"],
};
