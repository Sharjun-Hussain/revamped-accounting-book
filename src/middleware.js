import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";

// Routes that are always publicly accessible (no login needed)
const PUBLIC_PAGE_PREFIXES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/verify-token',
  '/error',
];

// API routes that don't need a session
const PUBLIC_API_PREFIXES = [
  '/api/auth',          // NextAuth internals
  '/api/contact-admin', // Public contact form
];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Always allow static assets
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/assets')
  ) {
    return NextResponse.next();
  }

  // Always allow public pages
  if (PUBLIC_PAGE_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Always allow public API routes
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Check for a valid session token
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token) {
    // API routes → return 401 JSON (don't redirect, clients can't follow it)
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Page routes → redirect to /login preserving the intended URL
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated — add security headers to every response
  const response = NextResponse.next();

  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      "connect-src 'self' https://app.text.lk https://*.supabase.co wss://*.supabase.co",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  return response;
}

export const config = {
  matcher: [
    // Match everything except Next.js internals and static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};