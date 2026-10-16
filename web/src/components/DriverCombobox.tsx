'use client';
import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { DriverIndexItem } from '@/lib/types';
import { TeamSwatch } from './ui';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function filterDrivers(drivers: DriverIndexItem[], query: string, limit = 40): DriverIndexItem[] {
  const q = norm(query.trim());
  if (!q) return [...drivers].sort((a, b) => b.seasons.at(-1)!.season - a.seasons.at(-1)!.season || b.points - a.points).slice(0, limit);
  return drivers
    .map((d) => {
      const full = norm(`${d.givenName} ${d.familyName}`);
      const code = (d.code ?? '').toLowerCase();
      const score = code === q ? 0 : norm(d.familyName).startsWith(q) ? 1 : full.startsWith(q) ? 2 : full.includes(q) ? 3 : -1;
      return { d, score };
    })
    .filter((x) => x.score >= 0)
    .sort((a, b) => a.score - b.score || b.d.points - a.d.points)
    .slice(0, limit)
    .map((x) => x.d);
}

interface Props {
  label: string;
  drivers: DriverIndexItem[];
  value: string | null;
  onChange: (driverId: string) => void;
  exclude?: string | null;
  testId?: string;
}

/** WAI-ARIA combobox (list autocomplete) for picking a driver. */
export function DriverCombobox({ label, drivers, value, onChange, exclude, testId }: Props) {
  const id = useId();
  const listId = `${id}-list`;
  const selected = drivers.find((d) => d.driverId === value);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const options = useMemo(() => filterDrivers(drivers.filter((d) => d.driverId !== exclude), query), [drivers, exclude, query]);

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: 'nearest' });
  }, [active]);

  function choose(d: DriverIndexItem) {
    onChange(d.driverId);
    setQuery('');
    setOpen(false);
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setOpen(true); setActive((a) => Math.min(options.length - 1, open ? a + 1 : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Enter' && open && options[active]) { e.preventDefault(); choose(options[active]); }
    else if (e.key === 'Escape') { if (open) { e.preventDefault(); setOpen(false); } else setQuery(''); }
    else if (e.key === 'Home' && open) { e.preventDefault(); setActive(0); }
    else if (e.key === 'End' && open) { e.preventDefault(); setActive(options.length - 1); }
  }

  const last = (d: DriverIndexItem) => d.seasons.at(-1)!;
  const span = (d: DriverIndexItem) => {
    const f = d.seasons[0].season, l = last(d).season;
    return f === l ? `${f}` : `${f}–${l}`;
  };

  return (
    <div className="relative w-full" data-testid={testId}>
      <label htmlFor={`${id}-input`} className="mb-1 block text-xs font-medium uppercase tracking-wider text-ink-3">{label}</label>
      <div className="flex items-center gap-2 rounded-xl border border-line bg-surface px-3 focus-within:border-focus focus-within:ring-2 focus-within:ring-focus/30">
        {selected && !open && <TeamSwatch constructorId={last(selected).constructorId} className="h-5" />}
        <input
          ref={inputRef}
          id={`${id}-input`}
          role="combobox"
          aria-expanded={open}
          aria-controls={listId}
          aria-autocomplete="list"
          aria-activedescendant={open && options[active] ? `${id}-opt-${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={selected ? '' : 'Search drivers…'}
          value={open ? query : selected ? `${selected.givenName} ${selected.familyName}` : query}
          onChange={(e) => { setQuery(e.target.value); setOpen(true); setActive(0); }}
          onFocus={(e) => { setOpen(true); setActive(0); e.currentTarget.select(); }}
          onBlur={() => setTimeout(() => setOpen(false), 120)}
          onKeyDown={onKeyDown}
          className="h-11 w-full bg-transparent text-base font-medium outline-none placeholder:text-ink-3"
        />
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-ink-3" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
      </div>
      {open && (
        <ul
          ref={listRef}
          id={listId}
          role="listbox"
          aria-label={label}
          className="absolute z-30 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-surface p-1 shadow-xl"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-sm text-ink-3" role="option" aria-selected={false} aria-disabled>No drivers match “{query}”</li>
          ) : (
            options.map((d, i) => (
              <li
                key={d.driverId}
                id={`${id}-opt-${i}`}
                role="option"
                data-index={i}
                aria-selected={d.driverId === value}
                onMouseDown={(e) => { e.preventDefault(); choose(d); }}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-center gap-2 rounded-lg px-3 py-2 text-sm ${i === active ? 'bg-surface-2' : ''}`}
              >
                <TeamSwatch constructorId={last(d).constructorId} />
                <span className="font-medium">{d.givenName} {d.familyName}</span>
                {d.code && <span className="text-xs text-ink-3">{d.code}</span>}
                <span className="ml-auto text-xs text-ink-3 tabular">{span(d)}</span>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
