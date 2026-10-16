'use client';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback } from 'react';
import { buildQuery, parseCompareState, parseEnum, type CompareState, type ParamValue } from './url-state';

/** Writes URL state. push = a Back-able step (picking drivers); replace = refinements (typing a filter). */
function useQueryUpdater(defaults: Record<string, ParamValue> = {}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  return useCallback(
    (patch: Record<string, ParamValue>, { replace = false } = {}) => {
      const href = pathname + buildQuery(sp, patch, defaults);
      if (replace) router.replace(href, { scroll: false });
      else router.push(href, { scroll: false });
    },
    // defaults is a module-level constant at every call site
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [router, pathname, sp],
  );
}

/** Head-to-head selection: shareable, so it lives in the URL. */
export function useCompareParams(bounds: { min: number; max: number }) {
  const sp = useSearchParams();
  const update = useQueryUpdater();
  const state: CompareState = parseCompareState(new URLSearchParams(sp.toString()), bounds);
  const setParams = useCallback((patch: Partial<Record<keyof CompareState, string | number | null>>) => update(patch), [update]);
  return [state, setParams] as const;
}

/** Search + sort for list pages, kept in the URL so a filtered list can be shared. */
export function useListParams<S extends string>(sorts: readonly S[], defaultSort: S) {
  const sp = useSearchParams();
  const update = useQueryUpdater({ sort: defaultSort });
  const q = sp.get('q') ?? '';
  const sort = parseEnum(sp.get('sort'), sorts, defaultSort);
  const setQuery = useCallback((value: string) => update({ q: value }, { replace: true }), [update]);
  const setSort = useCallback((value: S) => update({ sort: value }, { replace: true }), [update]);
  return { q, sort, setQuery, setSort };
}
