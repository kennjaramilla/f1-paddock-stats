import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { hasRole } from '@/lib/auth/roles';
import { SESSION_COOKIE, verifySession } from '@/lib/auth/session';
import { listUsers } from '@/lib/auth/users';

export async function GET() {
  const user = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  if (!hasRole(user.role, 'admin')) return NextResponse.json({ error: 'Requires Admin role.' }, { status: 403 });
  return NextResponse.json(listUsers(), { headers: { 'Cache-Control': 'no-store' } });
}
