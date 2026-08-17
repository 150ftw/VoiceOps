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
  '/api',
];

function isPublic(pathname: string): boolean {
  return PUBLIC_PATHS.some(
    (p) =>
      pathname === p ||
      pathname.startsWith(p + '/') ||
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api')
  );
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Always allow public paths & API routes
  if (isPublic(pathname)) {
    return NextResponse.next();
  }

  // Check for auth token in cookie
  const token =
    request.cookies.get('voiceops_token')?.value ||
    request.cookies.get('access_token')?.value;

  if (!token) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  // Exclude /api, /_next/static, images, icons from middleware execution
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$|.*\\.ico$).*)'],
};
