# memory.md: project context for future sessions

Read this and `application-flow.md` before changing anything.

## Status (2026-10-16)

- Live: https://f1-paddock-stats.vercel.app (snapshot mode). Repo: https://github.com/kennjaramilla/f1-paddock-stats (public).
- Built for an interview demo (React + C#/.NET role at a healthcare startup on AWS serverless). Code quality gets walked through, so
  keep it idiomatic and small.
- Tests: xUnit 17 (calculator + API auth), Vitest 48, Cypress 15 (all green locally). CI runs dotnet build/test and
  web lint, typecheck, Vitest and build.
- Demo users (public on the login page): `viewer@paddock.demo` / `viewer-demo`, `analyst@…` / `analyst-demo`, `admin@…` / `admin-demo`.

## Layout

```
api/                   .NET 10 minimal API
  Endpoints/           route mapping only (MapPaddockApi, MapAdminApi)
  Stats/               StatsService (read side, cache) + StatsCalculator (pure LINQ) + DTO records
  Ingestion/           IngestionService (Jolpica → SQLite, one season per transaction)
  Jolpica/             typed HttpClient, Ergast payload records, throttle + resilience registration
  Data/                EF Core entities + DbContext (EnsureCreated, no migrations)
  Export/              SnapshotExporter (GET responses → web/public/data)
  Infrastructure/      auth (JWT + policies), rate limiting, correlation id, DB setup, CLI
  seed/paddock.db      committed pre-seeded DB, copied on first start
tests/PaddockStats.Tests   xUnit
web/                   Next.js 16 (App Router), proxy.ts, RTK store in src/store, views in src/components/views
```

## How to

- **Refresh data:** `dotnet run --project api -- ingest 2014 2026`, then `dotnet run --project api -- export web/public/data`, then
  copy `api/paddock.db` over `api/seed/paddock.db` and commit both. The export log lists any season whose computed standings don't match
  the official ones (currently none).
- **Redeploy web:** `cd web && npx vercel@latest deploy --prod --yes` (project `f1-paddock-stats`, account kennjaramilla).
  `AUTH_SECRET` is set in Vercel for production and preview.
- **Live mode locally:** run the API on :5102 (`ASPNETCORE_URLS=http://localhost:5102 dotnet run --no-launch-profile` in `api/`), then
  `NEXT_PUBLIC_API_URL=http://localhost:5102 npm run dev` in `web/`. In dev, both sides fall back to the same dev secret.
- **Tests:** `dotnet test`; `cd web && npm test`; `cd web && npm run e2e:ci` (builds must exist: `npm run build` first).

## Design decisions & trade-offs (interview talking points)

- **Snapshot mode.** Vercel can't run .NET and the demo must not depend on a third-party API during the meeting. The API exports
  its own responses as static JSON (same DTOs and serializer), and RTK Query's `baseQuery` switches source. One code path, two
  deploy targets; the snapshot is also a deterministic test fixture.
- **SQLite + EF Core.** About 270 races fit in less than 1 MB; zero ops; the file ships with the app (Docker volume seed, read-only on Lambda).
  `EnsureCreated` instead of migrations because the DB is rebuilt from source, not evolved. Postgres/Aurora is the move once there's
  user-owned, writable data.
- **Server-side aggregation.** Points progression, countback tie-breaks and reconciliation live in a pure `StatsCalculator`
  (easy to unit-test, no I/O), so clients get chart-ready data. Head-to-head is the exception: any pair over any range, so it's
  computed client-side from per-season results instead of caching N² combinations.
- **Reconciliation as a correctness check.** Every season's computed totals are compared with the official standings (one bug
  found this way: countback must ignore unclassified finishes). The UI shows the result as a trust signal.
- **Resilient ingestion.** Typed `HttpClient` + `AddStandardResilienceHandler` (retries 429/5xx, honours Retry-After) wrapping a
  throttle handler, so retries are spaced too. Idempotent per-season replace in a transaction.
- **Custom SVG charts (d3-scale/d3-shape).** Full control over the UX details: end-of-line labels with collision avoidance, dashed
  second car (colour is never the only cue), team colours contrast-adjusted per theme to 3:1, keyboard scrubbing with a live region,
  table fallback for every chart.
- **Auth as a BFF.** Login runs in Next route handlers; the JWT is in an httpOnly cookie, so JavaScript can't read it (limits XSS
  token theft). The browser calls a same-origin `/api/live` proxy that adds the Bearer header, which keeps CORS tight. The API validates
  the same JWT with policy-based authorization. A shared HS256 secret is fine for a demo; in production on AWS I'd use Cognito (or another
  OIDC provider) with asymmetric keys/JWKS, so the API never holds a signing secret.
- **Least privilege.** Viewer → Analyst → Admin, enforced at the API; the UI shows locked features with "Requires X role" instead of
  hiding them (except Admin), which keeps them discoverable. This maps to HIPAA-style access control and minimum-necessary access;
  an audit log is the next step (below).

## NgRx → Redux Toolkit mapping (Kenneth's background)

| NgRx | Here |
| --- | --- |
| `createAction` + `createReducer` | `createSlice` (`store/uiSlice.ts`): actions generated from reducers, Immer for immutable updates |
| `createSelector` | the same function from RTK (`store/selectors.ts`), memoized and parameterized by year/theme |
| Effects | RTK Query for data fetching (`store/api.ts`), listener middleware for other side effects (`store/preferences.ts` persists prefs) |
| `@ngrx/entity` / data services | RTK Query endpoints + cache tags (`Season` invalidated after an admin refresh) |
| `StoreModule.forRoot` | `makeStore()` per request/tab in `StoreProvider` (App Router guidance: no module-level store) |

## Gotchas

- Next 16: `middleware.ts` is now `proxy.ts`; `cacheComponents` is on, so client views that read `useSearchParams`/`useParams` sit inside `<Suspense>`.
- Tailwind v4 uses the `@tailwindcss/turbopack` CSS rule in `next.config.ts`; don't remove it.
- Cypress (Electron) reports React hydration error #418 because it injects a script into `<head>`. Real Chromium doesn't (checked with
  Playwright), so the Cypress support file ignores only that error.
- `fetchBaseQuery` reports a missing snapshot file as `PARSING_ERROR` with `originalStatus: 404` (the 404 page is HTML); `isNotFound` handles both.
- zsh: never name a shell loop variable `path` (it overwrites `$PATH`).
- `dotnet run` uses launchSettings unless `--no-launch-profile`, which ignores `ASPNETCORE_URLS`.

## Next steps (cut for time; roadmap talking points)

- Saved comparisons owned by users: resource-based authorization (owner check, 404 for others' private items), revocable share links,
  soft delete, "download my data". Needs a writable DB (Postgres) and a real user store.
- Audit log of sign-ins and admin actions (with masked emails), plus CSV export of any chart's table.
- AWS deploy: `Amazon.Lambda.AspNetCoreServer.Hosting` is already wired (`AddAWSLambdaHosting(HttpApi)`; plain Kestrel locally).
  Next is a SAM template (HttpApi + function, read-only bundled SQLite), with Cognito replacing the shared-secret JWT.
- Observability: OpenTelemetry traces/metrics (CloudWatch/X-Ray), web-vitals reporting, an error boundary that reports.
- Cypress in CI (cypress-io/github-action against `next start`), and a `TESTING.md`.
