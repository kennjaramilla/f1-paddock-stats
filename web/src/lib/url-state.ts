export type ParamValue = string | number | null | undefined;

export function parseEnum<T extends string>(value: string | null, allowed: readonly T[], fallback: T): T {
  return value && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

export function parseIntParam(value: string | null, fallback: number, range?: { min?: number; max?: number }): number {
  if (value == null || !/^-?\d+$/.test(value)) return fallback;
  const n = Number(value);
  if (range?.min != null && n < range.min) return fallback;
  if (range?.max != null && n > range.max) return fallback;
  return n;
}

/** Slug-ish ids only (driverId, circuitId); anything else is ignored. */
export const parseId = (value: string | null): string | null => (value && /^[a-z0-9_]{1,40}$/.test(value) ? value : null);

/**
 * Applies a patch to search params. Values equal to their default are dropped so URLs stay short;
 * null/undefined/'' removes the key. Keys are sorted for stable, shareable URLs.
 */
export function buildQuery(current: URLSearchParams | string, patch: Record<string, ParamValue>, defaults: Record<string, ParamValue> = {}): string {
  const params = new URLSearchParams(typeof current === 'string' ? current : current.toString());
  for (const [key, raw] of Object.entries(patch)) {
    const value = raw == null ? '' : String(raw);
    if (value === '' || (defaults[key] != null && String(defaults[key]) === value)) params.delete(key);
    else params.set(key, value);
  }
  params.sort();
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export interface CompareState { a: string | null; b: string | null; from: number | null; to: number | null }

export function parseCompareState(sp: URLSearchParams, bounds: { min: number; max: number }): CompareState {
  let from: number | null = parseIntParam(sp.get('from'), NaN, bounds);
  let to: number | null = parseIntParam(sp.get('to'), NaN, bounds);
  if (Number.isNaN(from)) from = null;
  if (Number.isNaN(to)) to = null;
  if (from != null && to != null && from > to) [from, to] = [to, from];
  return { a: parseId(sp.get('a')), b: parseId(sp.get('b')), from, to };
}
