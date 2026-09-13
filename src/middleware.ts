import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware - Perimeter Request Gate
 * Runs on V8 Edge runtime. Does NOT perform DB queries directly.
 * Verifies presence of session cookie and intercepts unauthenticated requests before page/server resources compile.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Guard protected routes: /dashboard and /headmaster
  if (pathname.startsWith('/dashboard') || pathname.startsWith('/headmaster')) {
    const sessionId = request.cookies.get('mssms_session_id')?.value;
    const authHeader = request.headers.get('authorization');

    if (!sessionId && (!authHeader || !authHeader.startsWith('Bearer '))) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-current-pathname', pathname);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/headmaster/:path*',
  ],
};
