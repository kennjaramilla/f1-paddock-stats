import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { isRole, type SessionUser } from './roles';

export const SESSION_COOKIE = 'paddock_session';
export const SESSION_TTL_SECONDS = 60 * 60;

// Must match Auth:Issuer / Auth:Audience in the .NET API, which validates the same token.
const ISSUER = 'paddock-stats';
const AUDIENCE = 'paddock-api';

function secret(): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 32) {
    if (process.env.NODE_ENV === 'production') throw new Error('AUTH_SECRET must be set (32+ chars)');
    return new TextEncoder().encode('dev-only-secret-change-me-0123456789abcdef');
  }
  return new TextEncoder().encode(value);
}

export async function signSession(user: SessionUser): Promise<string> {
  return new SignJWT({ name: user.name, email: user.email, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(user.id)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_TTL_SECONDS}s`)
    .sign(secret());
}

/** Returns the user for a valid, unexpired token; null for anything else. */
export async function verifySession(token: string | undefined): Promise<SessionUser | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret(), { issuer: ISSUER, audience: AUDIENCE, algorithms: ['HS256'] });
    if (!payload.sub || !isRole(payload.role)) return null;
    return { id: payload.sub, name: String(payload.name), email: String(payload.email), role: payload.role };
  } catch {
    return null;
  }
}

export const sessionCookie = (token: string) => ({
  name: SESSION_COOKIE,
  value: token,
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_TTL_SECONDS,
});
