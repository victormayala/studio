// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Temporarily pass through all requests for diagnostic purposes
  // console.log('Middleware triggered for path:', request.nextUrl.pathname);
  return NextResponse.next();
}

// Matcher remains the same, but the logic above is simplified.
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
