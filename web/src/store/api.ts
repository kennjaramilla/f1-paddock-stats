import { createApi, fetchBaseQuery, type BaseQueryFn, type FetchArgs, type FetchBaseQueryError } from '@reduxjs/toolkit/query/react';
import { resolveUrl } from '@/lib/api';
import type {
  CircuitDetail, CircuitIndexItem, DriverIndexItem, Meta, SeasonDetail, SeasonIndexItem, SeasonResults,
} from '@/lib/types';

const rawBaseQuery = fetchBaseQuery({ baseUrl: '' });

/** Routes like `seasons/2021` go to the live .NET API or the static snapshot, depending on NEXT_PUBLIC_API_URL. */
const apiOrSnapshot: BaseQueryFn<string, unknown, FetchBaseQueryError> = (route, api, extra) =>
  rawBaseQuery({ url: resolveUrl(route) } satisfies FetchArgs, api, extra);

export const paddockApi = createApi({
  reducerPath: 'paddockApi',
  baseQuery: apiOrSnapshot,
  // Historical data doesn't change while the app is open.
  keepUnusedDataFor: 30 * 60,
  tagTypes: ['Season'],
  endpoints: (build) => ({
    getMeta: build.query<Meta, void>({ query: () => 'meta' }),
    getSeasons: build.query<SeasonIndexItem[], void>({ query: () => 'seasons' }),
    getSeason: build.query<SeasonDetail, number>({ query: (year) => `seasons/${year}`, providesTags: (_r, _e, year) => [{ type: 'Season', id: year }] }),
    getDrivers: build.query<DriverIndexItem[], void>({ query: () => 'drivers' }),
    getCircuits: build.query<CircuitIndexItem[], void>({ query: () => 'circuits' }),
    getCircuit: build.query<CircuitDetail, string>({ query: (id) => `circuits/${id}` }),
    /** Head-to-head needs several seasons; fetched in parallel and returned in order. */
    getSeasonResults: build.query<SeasonResults[], number[]>({
      async queryFn(years, api, extra) {
        const responses = await Promise.all(years.map((y) => apiOrSnapshot(`seasons/${y}/results`, api, extra)));
        const failed = responses.find((r) => r.error);
        return failed?.error ? { error: failed.error } : { data: responses.map((r) => r.data as SeasonResults) };
      },
    }),
    /** Admin-only, live mode: re-ingests a season from Jolpica on the .NET side. */
    refreshSeason: build.mutation<void, number>({
      queryFn: async (year, api, extra) => {
        const result = await rawBaseQuery({ url: `/api/live/admin/seasons/${year}/refresh`, method: 'POST' }, api, extra);
        return result.error ? { error: result.error } : { data: undefined };
      },
      invalidatesTags: (_r, _e, year) => [{ type: 'Season', id: year }],
    }),
  }),
});

export const {
  useGetMetaQuery, useGetSeasonsQuery, useGetSeasonQuery, useGetDriversQuery,
  useGetCircuitsQuery, useGetCircuitQuery, useGetSeasonResultsQuery, useRefreshSeasonMutation,
} = paddockApi;

export const isNotFound = (error: unknown) => (error as FetchBaseQueryError | undefined)?.status === 404;
