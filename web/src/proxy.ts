import { NextResponse, type NextRequest } from 'next/server';
import { decideAccess } from '@/lib/auth/roles';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';

/** Optimistic page gating by role. Data access is enforced again by the API (and the /api routes). */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const user = await verifySession(request.cookies.get(SESSION_COOKIE)?.value);
  const decision = decideAccess(pathname, user?.role ?? null);

  if (decision.type === 'login') {
    const url = new URL('/login', request.url);
    url.searchParams.set('next', pathname + search);
    return NextResponse.redirect(url);
  }
  if (decision.type === 'forbidden') {
    const url = new URL('/forbidden', request.url);
    url.searchParams.set('required', decision.required);
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Pages only: skip API routes, the data snapshot and static assets.
  matcher: ['/((?!api|data|_next/static|_next/image|favicon.ico).*)'],
};
