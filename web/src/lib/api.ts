// One data layer, two sources: the live .NET API, or the static snapshot it exported (same JSON shapes).
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '');

export const dataMode: 'live' | 'snapshot' = API_URL ? 'live' : 'snapshot';

/** Maps an API route like `seasons/2021` to its URL in the active mode. */
export function resolveUrl(route: string, apiUrl: string | undefined = API_URL): string {
  const clean = route.replace(/^\/+|\/+$/g, '');
  return apiUrl ? `${apiUrl}/api/${clean}` : `/data/${clean}.json`;
}
