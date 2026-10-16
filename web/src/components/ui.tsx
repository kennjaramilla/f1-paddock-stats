'use client';
import { useId } from 'react';
import { teamColorFor } from '@/lib/colors';
import { useResolvedTheme } from './Providers';

export function Skeleton({ className = '', label }: { className?: string; label?: string }) {
  return <div className={`skeleton ${className}`} aria-hidden={label ? undefined : true} role={label ? 'status' : undefined} aria-label={label} />;
}

export function PageSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="Loading">
      <Skeleton className="h-10 w-72" />
      <Skeleton className="h-5 w-96 max-w-full" />
      <Skeleton className="h-[380px] w-full" />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Something went wrong', message, onRetry }: { title?: string; message?: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="rounded-xl border border-line bg-surface p-8 text-center">
      <p className="font-display text-2xl font-semibold uppercase tracking-wide">{title}</p>
      {message && <p className="mt-2 text-sm text-ink-2">{message}</p>}
      {onRetry && (
        <button onClick={onRetry} className="mt-4 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-bg hover:opacity-90">
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-line-strong bg-surface/60 p-8 text-center">
      <p className="font-display text-xl font-semibold uppercase tracking-wide">{title}</p>
      {children && <div className="mt-2 text-sm text-ink-2">{children}</div>}
    </div>
  );
}

export function TeamSwatch({ constructorId, className = '' }: { constructorId: string; className?: string }) {
  const theme = useResolvedTheme();
  return <span aria-hidden className={`inline-block h-3 w-1.5 shrink-0 rounded-full ${className}`} style={{ background: teamColorFor(constructorId, theme) }} />;
}

export interface SegmentOption<T extends string> { value: T; label: string }

export function Segmented<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: SegmentOption<T>[]; onChange: (v: T) => void;
}) {
  const id = useId();
  return (
    <div role="radiogroup" aria-labelledby={id} className="inline-flex items-center gap-2">
      <span id={id} className="text-xs font-medium uppercase tracking-wider text-ink-3">{label}</span>
      <div className="inline-flex rounded-lg border border-line bg-surface-2 p-0.5">
        {options.map((o) => {
          const checked = o.value === value;
          return (
            <button
              key={o.value}
              role="radio"
              aria-checked={checked}
              data-value={o.value}
              onClick={() => onChange(o.value)}
              onKeyDown={(e) => {
                const idx = options.findIndex((x) => x.value === value);
                if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); onChange(options[(idx + 1) % options.length].value); }
                if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); onChange(options[(idx - 1 + options.length) % options.length].value); }
              }}
              tabIndex={checked ? 0 : -1}
              className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${checked ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink'}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-surface px-4 py-3">
      <div className="text-xs font-medium uppercase tracking-wider text-ink-3">{label}</div>
      <div className="mt-1 font-display text-3xl font-semibold tabular leading-none">{value}</div>
      {hint && <div className="mt-1 text-xs text-ink-2">{hint}</div>}
    </div>
  );
}

export function Card({ title, actions, children, className = '' }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-6 ${className}`}>
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <h2 className="font-display text-xl font-semibold uppercase tracking-wide">{title}</h2>}
          {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
