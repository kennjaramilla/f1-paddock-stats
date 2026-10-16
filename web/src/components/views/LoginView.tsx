'use client';
import { useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { ROLE_LABEL, safeNext, type Role } from '@/lib/auth/roles';
import { useLoginMutation } from '@/store/authApi';

const DEMO_ACCOUNTS: { role: Role; email: string; password: string; can: string }[] = [
  { role: 'viewer', email: 'viewer@paddock.demo', password: 'viewer-demo', can: 'Seasons, circuits and driver careers' },
  { role: 'analyst', email: 'analyst@paddock.demo', password: 'analyst-demo', can: 'Everything a Viewer can, plus head-to-head analysis' },
  { role: 'admin', email: 'admin@paddock.demo', password: 'admin-demo', can: 'Everything, plus user management and data refresh' },
];

export function LoginView() {
  const next = safeNext(useSearchParams().get('next'));
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function signIn(credentials: { email: string; password: string }) {
    setError(null);
    const result = await login(credentials);
    if ('error' in result) {
      setError((result.error as { data?: { error?: string } }).data?.error ?? 'Sign in failed. Please try again.');
      return;
    }
    // Full navigation: the client router may hold a cached pre-login redirect for this route.
    window.location.assign(next);
  }

  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-tight">Sign in</h1>
      <p className="mt-3 max-w-2xl text-ink-2">
        This is a demo, so the accounts are public. Each role sees a different slice of the app: pick one to see role-based access in action.
      </p>

      <ul className="mt-8 grid gap-4 md:grid-cols-3">
        {DEMO_ACCOUNTS.map((a) => (
          <li key={a.role} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
            <span className="w-fit rounded-full bg-surface-2 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider text-ink-2">{ROLE_LABEL[a.role]}</span>
            <p className="mt-3 flex-1 text-sm text-ink-2">{a.can}</p>
            <dl className="mt-4 space-y-0.5 font-mono text-xs text-ink-3">
              <div><dt className="inline">email </dt><dd className="inline text-ink-2">{a.email}</dd></div>
              <div><dt className="inline">password </dt><dd className="inline text-ink-2">{a.password}</dd></div>
            </dl>
            <button
              onClick={() => signIn(a)}
              disabled={isLoading}
              className="mt-4 rounded-lg bg-ink px-4 py-2.5 text-sm font-semibold text-bg hover:opacity-90 disabled:opacity-50"
              data-testid={`login-${a.role}`}
            >
              Sign in as {ROLE_LABEL[a.role]}
            </button>
          </li>
        ))}
      </ul>

      <form
        className="mt-8 max-w-sm space-y-3"
        onSubmit={(e) => {
          e.preventDefault();
          signIn({ email, password });
        }}
      >
        <h2 className="text-sm font-semibold uppercase tracking-wider text-ink-3">Or use the form</h2>
        <label className="block text-sm">
          Email
          <input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3 outline-none focus:border-focus focus:ring-2 focus:ring-focus/30" />
        </label>
        <label className="block text-sm">
          Password
          <input type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)}
            className="mt-1 h-11 w-full rounded-xl border border-line bg-surface px-3 outline-none focus:border-focus focus:ring-2 focus:ring-focus/30" />
        </label>
        {error && <p role="alert" className="text-sm font-medium text-accent">{error}</p>}
        <button type="submit" disabled={isLoading} className="rounded-lg border border-line px-4 py-2 text-sm font-semibold hover:bg-surface-2 disabled:opacity-50">
          {isLoading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
