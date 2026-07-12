# AssetFlow ERP — Enterprise Resource Management System

AssetFlow is a production-grade Enterprise Asset & Resource Management System designed for the Odoo Hiring Hackathon 2026. The solution features a robust modular Express.js + Prisma API backend, a PostgreSQL database layout, and a responsive Next.js 16 Web Dashboard interface.

---

## 🏗️ Monorepo Workspaces

The repository follows a clean, layered architecture organized into typescript packages:

- **`apps/api`**: Express.js + TypeScript REST backend implementing repositories, validation layers (Zod), logging contexts, and event streams.
- **`apps/web`**: Next.js 16 + React 19 Client Dashboard Portal styled with Tailwind CSS.
- **`packages/types`**: Shared corporate types and schema interfaces.
- **`packages/utils`**: Core helper routines and date validators.

---

## 🛠️ Infrastructure & Databases

### PostgreSQL (Production)
The authoritative production database. To boot the system using PostgreSQL:
1. Ensure your PostgreSQL server is active.
2. Adjust `provider = "postgresql"` in `prisma/schema.prisma`.
3. Set `DATABASE_URL="postgresql://user:password@localhost:5432/assetflow"` in `apps/api/.env`.
4. Run migrations:
   ```bash
   npx prisma migrate dev
   ```

### SQLite (Fallback Development Context)
For sandboxed local development (such as terminal virtualizations lacking Docker):
1. The datasource provider is configured to `provider = "sqlite"`.
2. The local database resides at `apps/api/dev.db` (initialized using `DATABASE_URL="file:./dev.db"`).

---

## 🛡️ Centralized Audit Logging & Job Queue

A modern, non-blocking Prisma Query Extension in `apps/api/src/config/db.ts` intercepts all database mutations and routes them to a generic, sequential background FIFO `BackgroundJobQueue` (concurrency = 1):
- **CREATE, UPDATE, DELETE** actions are trapped automatically.
- Logs include user identifiers, entity types, mutated row keys, old/new states as JSON, client IP addresses, user agent headers, and correlation tracking tokens.
- Deferring log persistence through the background queue eliminates SQLite writer deadlocks and minimizes business transaction times.
- Real-time telemetry is exposed via `GET /api/v1/metrics`. Detailed lifecycle info is mapped in [QUEUE_ARCHITECTURE.md](docs/QUEUE_ARCHITECTURE.md).

---

## 📖 Swagger API Documentation

Interactive OpenAPI 3.0 specs are exposed dynamically:
- **Interactive UI**: [http://localhost:4000/api/v1/docs](http://localhost:4000/api/v1/docs)
- **JSON Specification**: [http://localhost:4000/api/v1/docs-json](http://localhost:4000/api/v1/docs-json)

Endpoints cover:
- Authentication (`POST /auth/login`)
- Telemetry Metrics (`GET /api/v1/metrics`)
- Asset Registry (`GET /assets`, `POST /assets`)
- Allocations (`POST /allocations`)
- Asset Returns (`POST /returns`)
- Repairs Maintenance (`POST /maintenance`)
- Audit Checklists (`POST /audits`)
- Dashboard KPIs (`GET /dashboard/stats`)

---

## 🧪 Running Validation, Stress, & Performance Tests

AssetFlow implements three distinct, isolated test runners to assure stability, scalability, and latency targets. Detailed design info is mapped in [TESTING_ARCHITECTURE.md](docs/TESTING_ARCHITECTURE.md).

### 1. Functional Integration Tests
To run the deterministic, SQLite-compatible integration suite:
```bash
npm run test
```

### 2. Concurrency Stress Benchmarks
To run the provider-aware concurrency stress test (limits parallel workers to 3 for SQLite, 25+ for PostgreSQL):
```bash
npm run test:stress
```
Outputs results to `docs/STRESS_TEST_REPORT.md` and `docs/benchmarks/`.

### 3. Performance Telemetry Profiling
To measure latency, throughput, event loop delays, and CPU time:
```bash
npm run test:performance
```
Outputs reports to `docs/PERFORMANCE_REPORT.md`.

### 4. Playwright E2E Browser Tests
To run automated Next.js E2E browser tests:
```bash
npx playwright test --config=apps/web/playwright.config.ts
```

### 5. Automated CI/CD Workflows
Three distinct workflows are configured in `.github/workflows/`:
- **`ci.yml`**: Runs linting, build verification, integration tests, and Playwright tests on every push.
- **`stress-tests.yml`**: Nightly or manually runs the concurrency stress benchmarks.
- **`release-validation.yml`**: Runs comprehensive verification tests and Docker builds before production release.
