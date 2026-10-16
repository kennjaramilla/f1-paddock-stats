import { NextResponse } from 'next/server';
import { sessionCookie, signSession } from '@/lib/auth/session';
import { authenticate } from '@/lib/auth/users';

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { email?: unknown; password?: unknown } | null;
  if (typeof body?.email !== 'string' || typeof body?.password !== 'string')
    return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });

  const user = await authenticate(body.email, body.password);
  if (!user) return NextResponse.json({ error: 'Incorrect email or password.' }, { status: 401 });

  const response = NextResponse.json({ user });
  response.cookies.set(sessionCookie(await signSession(user)));
  return response;
}
