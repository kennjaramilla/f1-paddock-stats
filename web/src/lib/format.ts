export const fmtPoints = (p: number) => (Number.isInteger(p) ? p.toString() : p.toFixed(1));

export const fmtPct = (r: number, digits = 0) => `${(r * 100).toFixed(digits)}%`;

export function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

/** Short race label: "Bahrain Grand Prix" → "Bahrain". */
export const shortRace = (name: string) => name.replace(/\s*Grand Prix$/i, '').replace(/^Grand Prix of\s*/i, '');

export const driverLabel = (d: { code?: string | null; name: string }) => d.code ?? d.name.split(' ').slice(-1)[0].slice(0, 3).toUpperCase();

export const fmtDate = (iso: string | null) =>
  iso ? new Date(iso + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }) : '';

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
