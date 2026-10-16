// One data layer, two sources: the live .NET API (via the same-origin /api/live proxy), or the static
// snapshot the API exported (same JSON shapes).
const LIVE = !!process.env.NEXT_PUBLIC_API_URL;

export const dataMode: 'live' | 'snapshot' = LIVE ? 'live' : 'snapshot';

/** Maps an API route like `seasons/2021` to its URL in the active mode. */
export function resolveUrl(route: string, live: boolean = LIVE): string {
  const clean = route.replace(/^\/+|\/+$/g, '');
  return live ? `/api/live/${clean}` : `/data/${clean}.json`;
}
