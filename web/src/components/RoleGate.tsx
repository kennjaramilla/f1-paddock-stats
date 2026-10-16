'use client';
import Link from 'next/link';
import { ROLE_LABEL, type Role } from '@/lib/auth/roles';
import { useSession } from '@/store/authApi';

export function LockIcon({ className = '' }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden className={className}>
      <rect x="5" y="11" width="14" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </svg>
  );
}

/** A link that stays visible but locked when the user lacks the role, so the feature is still discoverable. */
export function GatedLink({ role, href, className, children }: { role: Role; href: string; className: string; children: React.ReactNode }) {
  const { can } = useSession();
  if (can(role)) return <Link href={href} className={className}>{children}</Link>;
  return (
    <span className={`${className} inline-flex cursor-not-allowed items-center gap-1.5 opacity-60`} title={`Requires ${ROLE_LABEL[role]} role`} aria-disabled="true">
      <LockIcon />
      {children}
      <span className="sr-only">(requires {ROLE_LABEL[role]} role)</span>
    </span>
  );
}
