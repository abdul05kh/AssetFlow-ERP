# Testing & QA Architecture — AssetFlow ERP

This document defines the testing philosophy, CI pipelines, local execution targets, and database provider-aware concurrency scaling strategy for AssetFlow ERP.

---

## 1. Testing Philosophy

To maximize reliability without compromising delivery speed or introducing flaky pipelines, testing responsibilities are separated into three independent suites:

```
┌──────────────────────────────────────────────────────────────────┐
│                          AssetFlow ERP                           │
└────────────────────────────────┬─────────────────────────────────┘
                                 │
         ┌───────────────────────┼───────────────────────┐
         ▼                       ▼                       ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│   Integration    │    │      Stress      │    │   Performance    │
│ (Functional QA)  │    │  (Scalability)   │    │  (Latency/Load)  │
├──────────────────┤    ├──────────────────┤    ├──────────────────┤
│ SQLite           │    │ DB-Provider Aware│    │ Event Loop       │
│ Fast / Local / CI│    │ Manual / Nightly │    │ Metrics / P95    │
└──────────────────┘    └──────────────────┘    └──────────────────┘
```

- **Integration Suite**: Verifies **functional correctness** (Authentication, RBAC, business workflows, DB constraints). Runs on SQLite. Fast, deterministic, and required to pass on every push.
- **Stress Suite**: Verifies **scalability** under concurrent load (Parallel allocations, transfers, log writes). Leverages DB-provider limits (low concurrency for SQLite fallback, high worker concurrency for PostgreSQL production databases). Runs manual or nightly.
- **Performance Suite**: Measures **latencies, throughput, memory, and database operation timings** under load. Runs manually to identify regressions before releases.

---

## 2. CI/CD Lifecycle & Workflow Actions

Three distinct GitHub Actions automate these validations:

1. **`Continuous Integration` (ci.yml)**:
   - Triggers on push or pull requests to `main`.
   - Runs `npm run lint`, builds the application workspaces, boots SQLite, executes integration tests, and runs Playwright E2E browser checks.
2. **`Nightly Concurrency & Stress Tests` (stress-tests.yml)**:
   - Runs nightly at 2:00 AM UTC and on manual execution (`workflow_dispatch`).
   - Runs the provider-aware concurrency test, outputting `STRESS_TEST_REPORT.md` and archiving benchmark results as workflow build artifacts.
3. **`Production Release Validation` (release-validation.yml)**:
   - Triggers on release tags (e.g. `v1.0.0`) and manual executions.
   - Runs linting, checks Prisma schema validity, executes all tests (Integration + Playwright), compiles local Docker builds, and logs release telemetry reports.

---

## 3. Database Provider-Aware Execution

The stress and performance test suites auto-detect the database provider using the following precedence rules:
1. `DB_PROVIDER` environment variable value.
2. Prisma schema `datasource db` provider type (parsed from file).
3. `DATABASE_URL` protocol string protocol fallback.

### Concurrency Scaling Rules
- **SQLite fallback**: Limits concurrent writers to **3 parallel workers** to prevent database locks and contentions.
- **PostgreSQL production**: Runs **25+ parallel workers** representing enterprise workloads.

---

## 4. Benchmark Interpretations & SLAs
Performance indicators output metrics to `docs/benchmarks/`:
- **Throughput**: Target > 15 requests/sec on SQLite.
- **Average Latency**: Target < 100ms.
- **P95 Latency**: Target < 250ms.
- **Queue Dropped Jobs**: Must remain **0** at all times.

---

## 5. E2E Test Hardening & Hydration Safety

To achieve 100% deterministic test execution and avoid flaky behavior, AssetFlow ERP incorporates specific architectural solutions for client-side hydration and testing diagnostics.

### 5.1 Next.js SSR Hydration Safety
- **The Issue**: Zustand store tokens are initialized directly from `localStorage` on client load. During Next.js Server-Side Rendering (SSR), `window` is undefined, so the server renders the login UI. If a token exists on the client, React tries to render the Dashboard immediately during hydration, causing a DOM hydration mismatch that detaches event handlers.
- **The Solution**: In `apps/web/src/app/page.tsx`, we implement a `mounted` local state variable. The portal renders the static Login UI shell when `!mounted` (matching the server-rendered HTML exactly) with `data-hydrated="false"`. Once mounted, React transitions cleanly to either the Dashboard or the interactive Login UI, setting `data-hydrated="true"`.

### 5.2 Deterministic Playwright Orchestration
- **The Issue**: E2E tests often interact with input elements or submit buttons before the React event listeners have fully hydrated and attached to the DOM. This results in standard browser GET actions (appending `?` and reloading the page), causing inputs to lose values.
- **The Solution**: We implement a custom helper `gotoAndHydrate(page)` in `e2e.spec.ts`. This wrapper runs `page.goto("/")` and explicitly blocks until `[data-hydrated='true']` is matched, ensuring event listeners are fully attached.

### 5.3 Next.js allowedDevOrigins configuration
- **The Issue**: In development testing, the dev server HMR client connects to `ws://127.0.0.1:3000/_next/webpack-hmr`. Next.js blocks this by default to prevent cross-site request forgery.
- **The Solution**: We explicitly configure `allowedDevOrigins` to include `127.0.0.1` and `localhost` in `apps/web/next.config.ts`.

### 5.4 failure Diagnostic Logging
- **The Issue**: Debugging failing headless browser tests in CI pipelines is notoriously difficult without context.
- **The Solution**: The test runner is configured with diagnostic hooks (`test.beforeEach` and `test.afterEach`) that stream all browser console logs, network requests/responses, failed requests, and JavaScript page errors into a memory buffer. On failure, these logs are automatically dumped into a `browser-debug.log` file inside the test's result directory, alongside Playwright's screenshots, videos, and trace artifacts.

