import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE } from '@/lib/auth/session';

// Server-side URL of the .NET API (inside Docker this is the service name, not localhost).
const API_URL = (process.env.API_INTERNAL_URL ?? process.env.NEXT_PUBLIC_API_URL)?.replace(/\/$/, '');

/**
 * Same-origin proxy to the .NET API: the browser never sees the JWT; it's read from the httpOnly
 * cookie here and forwarded as a Bearer token. The API does the real authorization.
 */
async function forward(request: Request, { params }: { params: Promise<{ path: string[] }> }) {
  if (!API_URL) return NextResponse.json({ error: 'Live API is not configured.' }, { status: 404 });
  const { path } = await params;
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const upstream = await fetch(`${API_URL}/api/${path.map(encodeURIComponent).join('/')}`, {
    method: request.method,
    headers: { Accept: request.headers.get('Accept') ?? 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    cache: 'no-store',
  });
  const headers: Record<string, string> = { 'Content-Type': upstream.headers.get('Content-Type') ?? 'application/json' };
  const disposition = upstream.headers.get('Content-Disposition');
  if (disposition) headers['Content-Disposition'] = disposition;
  return new NextResponse(upstream.status === 204 ? null : upstream.body, { status: upstream.status, headers });
}

export { forward as GET, forward as POST };
