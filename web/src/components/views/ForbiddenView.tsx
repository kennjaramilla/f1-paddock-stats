'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ROLE_LABEL, isRole, safeNext } from '@/lib/auth/roles';
import { useSession } from '@/store/authApi';
import { LockIcon } from '../RoleGate';

export function ForbiddenView() {
  const sp = useSearchParams();
  const required = sp.get('required');
  const from = safeNext(sp.get('from'));
  const { user } = useSession();
  const label = isRole(required) ? ROLE_LABEL[required] : 'a higher';

  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-accent-soft text-accent"><LockIcon className="h-6 w-6" /></div>
      <p className="mt-4 font-display text-6xl font-bold text-accent">403</p>
      <h1 className="mt-1 font-display text-3xl font-semibold uppercase">Requires {label} role</h1>
      <p className="mt-2 text-ink-2">
        {user ? <>You&apos;re signed in as <strong>{user.name}</strong> ({ROLE_LABEL[user.role]}).</> : 'You are not signed in.'} This page needs {label} access.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <Link href={`/login?next=${encodeURIComponent(from)}`} className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-bg">Switch account</Link>
        <Link href="/" className="rounded-lg border border-line px-4 py-2 text-sm font-medium hover:bg-surface-2">Back to seasons</Link>
      </div>
    </div>
  );
}
