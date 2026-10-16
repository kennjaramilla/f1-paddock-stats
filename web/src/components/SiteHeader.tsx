'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { dataMode } from '@/lib/api';
import { useAppDispatch } from '@/store/store';
import { themeChanged } from '@/store/uiSlice';
import { useResolvedTheme } from './Providers';

const NAV = [
  { href: '/', label: 'Seasons', match: (p: string) => p === '/' || p.startsWith('/season') },
  { href: '/compare', label: 'Head-to-head', match: (p: string) => p.startsWith('/compare') },
  { href: '/circuits', label: 'Circuits', match: (p: string) => p.startsWith('/circuits') },
  { href: '/drivers', label: 'Drivers', match: (p: string) => p.startsWith('/drivers') },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg/85 backdrop-blur supports-[backdrop-filter]:bg-bg/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2" aria-label="Paddock Stats home">
          <Logo />
          <span className="font-display text-xl font-bold uppercase tracking-wide">
            Paddock<span className="text-accent">Stats</span>
          </span>
        </Link>
        <nav aria-label="Primary" className="ml-2 hidden md:block">
          <ul className="flex items-center gap-1">
            {NAV.map((n) => {
              const active = n.match(pathname);
              return (
                <li key={n.href}>
                  <Link
                    href={n.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-md px-3 py-2 text-sm font-medium ${active ? 'bg-surface-2 text-ink' : 'text-ink-2 hover:text-ink'}`}
                  >
                    {n.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <ModeBadge />
          <ThemeToggle />
        </div>
      </div>
      <nav aria-label="Primary mobile" className="border-t border-line md:hidden">
        <ul className="mx-auto flex max-w-7xl overflow-x-auto px-2">
          {NAV.map((n) => {
            const active = n.match(pathname);
            return (
              <li key={n.href} className="shrink-0">
                <Link
                  href={n.href}
                  aria-current={active ? 'page' : undefined}
                  className={`block border-b-2 px-3 py-2.5 text-sm font-medium ${active ? 'border-accent text-ink' : 'border-transparent text-ink-2'}`}
                >
                  {n.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" aria-hidden>
      <rect width="28" height="28" rx="7" fill="var(--ink)" />
      <path d="M7 19 L13 9 L21 9" stroke="var(--accent)" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 19 L21 19" stroke="var(--bg)" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function ModeBadge() {
  const live = dataMode === 'live';
  return (
    <span
      title={live ? 'Data served live by the .NET API' : 'Data served from a snapshot exported by the .NET API'}
      className="hidden items-center gap-1.5 rounded-full border border-line px-2.5 py-1 text-xs font-medium text-ink-2 sm:inline-flex"
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${live ? 'bg-good' : 'bg-ink-3'}`} />
      {live ? 'Live API' : 'Snapshot'}
    </span>
  );
}

function ThemeToggle() {
  const theme = useResolvedTheme();
  const dispatch = useAppDispatch();
  const next = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      onClick={() => dispatch(themeChanged(next))}
      aria-label={`Switch to ${next} theme`}
      className="grid h-9 w-9 place-items-center rounded-lg border border-line text-ink-2 hover:text-ink"
    >
      {theme === 'dark' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      )}
    </button>
  );
}
