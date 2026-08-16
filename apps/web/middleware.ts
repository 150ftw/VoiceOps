import { NextRequest, NextResponse } from 'next/server';

/**
 * Routes that are ALWAYS accessible (no token required).
 * Everything else under / is a protected dashboard route.
 */
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/register',
  '/founder',
  '/callback/github',
  '/_next',
  '/favicon.ico',
  '/logo.png',
  '/founder.png',
  '/icon.png',
  '/api',          // backend proxy passthrough
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/') || pathname.startsWith('/_next') || pathname.startsWith('/api'));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token in localStorage via cookie fallback
  // The frontend stores the JWT in localStorage (setAuthToken in api-client.ts).
  // We mirror it to a cookie on login so the middleware can read it.
  const token =
    request.cookies.get('voiceops_token')?.value ||
    request.cookies.get('access_token')?.value;

  if (!token) {
    // Redirect to login, preserve intended destination
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Match all routes except static files and Next.js internals
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
};
