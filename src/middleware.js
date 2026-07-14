import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import createIntlMiddleware from 'next-intl/middleware';
import { locales } from './i18n';

const intlMiddleware = createIntlMiddleware({
  locales: locales,
  defaultLocale: 'en'
});

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

  // Strip locale for prefix checking
  const localePrefixPattern = new RegExp(`^/(${locales.join('|')})`);
  const pathWithoutLocale = pathname.replace(localePrefixPattern, '') || '/';

  // Always allow public pages
  if (PUBLIC_PAGE_PREFIXES.some(p => pathWithoutLocale.startsWith(p))) {
    // Run intl middleware to handle localization for public pages
    const response = intlMiddleware(req);
    return addSecurityHeaders(response);
  }

  // Always allow public API routes
  if (PUBLIC_API_PREFIXES.some(p => pathname.startsWith(p))) {
    return addSecurityHeaders(NextResponse.next());
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
    // We should redirect to the localized login page, e.g. /en/login
    // intlMiddleware handles the locale injection, so we can just redirect to /login
    // Wait, we need to redirect to the correct locale. We will redirect to /login and intlMiddleware will catch it on the next request.
    const loginUrl = new URL('/login', req.url);
    loginUrl.searchParams.set('callbackUrl', req.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated
  if (pathname.startsWith('/api/')) {
    return addSecurityHeaders(NextResponse.next());
  }

  // For authenticated page routes, run intl middleware
  const response = intlMiddleware(req);
  return addSecurityHeaders(response);
}

function addSecurityHeaders(response) {
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