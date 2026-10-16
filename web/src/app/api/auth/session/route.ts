import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';

/** The browser can't read the httpOnly cookie, so it asks who it is here. */
export async function GET() {
  const user = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  return NextResponse.json({ user }, { headers: { 'Cache-Control': 'no-store' } });
}
