import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getAuthCookieName, isPasswordConfigured, isValidAuthToken } from '@/lib/auth';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/login') || pathname.startsWith('/api/postback')) {
    return NextResponse.next();
  }

  if (!isPasswordConfigured()) {
    return NextResponse.next();
  }

  const token = request.cookies.get(getAuthCookieName())?.value;
  if (isValidAuthToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
