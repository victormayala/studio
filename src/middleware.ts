
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const accessCookie = request.cookies.get('app-access-granted');
  const appAccessCookieValue = process.env.APP_ACCESS_COOKIE_VALUE;

  // Define public paths that don't require the access password
  const publicPaths = [
    '/', // Marketing home
    '/how-it-works',
    '/pricing',
    '/faq',
    '/terms',
    '/privacy',
    '/contact',
    '/signin', // Firebase sign-in
    '/signup', // Firebase sign-up
    '/access-login', // The app access login page itself
    // Asset paths often start with these, but the matcher should ideally handle most static assets.
    // Explicitly listing them here can be a fallback.
    '/clipart/',
    '/free-designs/',
    '/premium-designs/',
    '/logo.png',
  ];

  // Allow direct access to Next.js internals and common static asset patterns
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') || // Generic static folder
    pathname.includes('.') // Generally, files with extensions (e.g., .ico, .json, .xml, .txt)
  ) {
    return NextResponse.next();
  }

  const isPublicPath = publicPaths.some(p => {
    if (p.endsWith('/')) { // If public path ends with a slash, it's a directory prefix
      return pathname.startsWith(p);
    }
    return pathname === p;
  });

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Define protected paths (everything else that's not explicitly public or an asset)
  // This is a simplified check; for more complex scenarios, you might list protected prefixes.
  // For this setup, if it's not public and not an asset, it's considered protected.

  if (accessCookie?.value === appAccessCookieValue) {
    // User has the correct access cookie
    return NextResponse.next();
  }

  // No valid cookie, redirect to access-login page
  // Store the attempted URL to redirect after successful login
  const loginUrl = new URL('/access-login', request.url);
  const attemptedPath = pathname + search; // Include query parameters
  if (attemptedPath !== '/') { // Avoid redirecting to '/' from '/'
      loginUrl.searchParams.set('redirect', attemptedPath);
  }
  return NextResponse.redirect(loginUrl);
}

// Matcher to specify which paths the middleware should run on.
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes) - assuming API routes have their own auth or are public
     * - _next/static (Next.js static files)
     * - _next/image (Next.js image optimization files)
     * - Specific static files like favicon.ico
     * - This matcher tries to be broad but exclude common static assets.
     *   Adjust if you have other specific public asset paths not caught by the checks above.
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
