import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_PATHS = new Set(['/login']);

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const uid = request.cookies.get('fincontrol_uid')?.value;
  const isPublic = PUBLIC_PATHS.has(pathname);

  if (!uid && !isPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (uid && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|mf-proxy/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)'],
};
