import 'server-only';
import bcrypt from 'bcryptjs';
import type { Role, SessionUser } from './roles';

interface DemoUser extends SessionUser { passwordHash: string }

// Seeded demo accounts. Passwords are bcrypt hashes; the plaintext demo passwords are shown on the login page.
const USERS: DemoUser[] = [
  { id: 'u-viewer', name: 'Vera Viewer', email: 'viewer@paddock.demo', role: 'viewer', passwordHash: '$2b$10$gQeg0IoilI/aOBptRIOewu2H690PQ4KWg9P/y4AjA3NFBM6ISSPUK' },
  { id: 'u-analyst', name: 'Ana Analyst', email: 'analyst@paddock.demo', role: 'analyst', passwordHash: '$2b$10$sPy6usiPBH6HTrPXBo3Zq.vyAzhx8ZJXvIcDoH4DNffD.Wes9EjyK' },
  { id: 'u-admin', name: 'Adam Admin', email: 'admin@paddock.demo', role: 'admin', passwordHash: '$2b$10$V9eciu62ELN0HStXrOpABefwVmvTWNLDhkoC0xtwAcdZlyRD0gbkm' },
];

const toSessionUser = ({ id, name, email, role }: DemoUser): SessionUser => ({ id, name, email, role });

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const user = USERS.find((u) => u.email === email.trim().toLowerCase());
  // Compare against a dummy hash when the user is unknown so timing doesn't reveal which emails exist.
  const ok = await bcrypt.compare(password, user?.passwordHash ?? USERS[0].passwordHash);
  return user && ok ? toSessionUser(user) : null;
}

export const listUsers = (): { id: string; name: string; email: string; role: Role }[] => USERS.map(toSessionUser);
