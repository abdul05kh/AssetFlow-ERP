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
