// Role model shared by the UI, the proxy and (mirrored) the .NET policies. Pure, so it is unit-tested.
export const ROLES = ['viewer', 'analyst', 'admin'] as const;
export type Role = (typeof ROLES)[number];

const RANK: Record<Role, number> = { viewer: 0, analyst: 1, admin: 2 };

export const ROLE_LABEL: Record<Role, string> = { viewer: 'Viewer', analyst: 'Analyst', admin: 'Admin' };

export const isRole = (value: unknown): value is Role => typeof value === 'string' && (ROLES as readonly string[]).includes(value);

/** Roles are hierarchical: an admin can do everything an analyst can. */
export const hasRole = (role: Role | null | undefined, required: Role) => role != null && RANK[role] >= RANK[required];

export interface SessionUser { id: string; name: string; email: string; role: Role }

/** Minimum role per route prefix; the first match wins. Everything else needs a signed-in viewer. */
const ROUTE_RULES: { prefix: string; role: Role }[] = [
  { prefix: '/admin', role: 'admin' },
  { prefix: '/compare', role: 'analyst' },
];

const PUBLIC_PATHS = ['/login', '/forbidden'];

export const requiredRoleFor = (pathname: string): Role =>
  ROUTE_RULES.find((r) => pathname === r.prefix || pathname.startsWith(r.prefix + '/'))?.role ?? 'viewer';

export type AccessDecision = { type: 'allow' } | { type: 'login' } | { type: 'forbidden'; required: Role };

/** What the proxy does for a page request. UI gating only; the API enforces the same rules on data. */
export function decideAccess(pathname: string, role: Role | null): AccessDecision {
  if (PUBLIC_PATHS.includes(pathname)) return { type: 'allow' };
  if (!role) return { type: 'login' };
  const required = requiredRoleFor(pathname);
  return hasRole(role, required) ? { type: 'allow' } : { type: 'forbidden', required };
}

/** Only same-site relative paths are allowed as post-login redirects (prevents open redirects). */
export const safeNext = (next: string | null | undefined) => (next && next.startsWith('/') && !next.startsWith('//') ? next : '/');
