# Git Release Commit Summary (v1.0.1)

This document lists the Conventional Commits grouped and published for the SQLite Transaction Concurrency & Boundary optimizations release (`v1.0.1`).

---

## Commit Log Overview

| Hash | Commit Title | Affected Modules | Files Changed |
| :--- | :--- | :--- | :--- |
| **84ca163** | `feat(db): implement telemetry hooks and SQLite transaction mutex coordinator` | Database / Telemetry | `apps/api/src/config/db.ts`, `apps/api/src/utils/context.ts` |
| **0ebf469** | `refactor(repository): reduce interactive transaction scope across repository modules` | Repositories (Allocation, Asset, Audit, Booking, Transfer) | `apps/api/src/modules/allocation/...`, `apps/api/src/modules/asset/...`, `apps/api/src/modules/audit/...`, `apps/api/src/modules/booking/...`, `apps/api/src/modules/transfer/...` |
| **cbd87e7** | `test(stress): update absolute path resolution in test runners` | Testing / Scripts | `apps/api/src/tests/run-performance-tests.ts`, `apps/api/src/tests/run-stress-tests.ts`, `apps/api/src/tests/run-tests.ts` |
| **5ac9ff8** | `docs(sqlite): document transaction analysis and performance benchmark results` | Documentation / Benchmarks | `docs/SQLITE_TRANSACTION_ANALYSIS.md`, `docs/STRESS_TEST_REPORT.md`, `docs/benchmarks/*` |

---

## Detailed Commit Specifications

### 1. `feat(db): implement telemetry hooks and SQLite transaction mutex coordinator` (Hash: `84ca163`)
- **Rationale:** High-concurrency operations on SQLite frequently hit database socket timeouts (`P1008`) and interactive transaction closure errors (`P2028`) due to SQLite's single-writer limitation. Telemetry was required to capture lock wait times, and coordination was necessary to prevent write contention.
- **Changes:**
  - Added query-level statement execution tracking and query counters inside active transaction contexts.
  - Implemented an application-level coordinated queue-based `Mutex` to serialize writes (both interactive transactions and single update/create queries) exclusively when using the SQLite database provider.
- **Impact:** Eliminates database lock contention on SQLite, resolving all `P1008`/`P2028` timeout failures while preserving fullMVCC parallel execution concurrency on PostgreSQL and MySQL.

### 2. `refactor(repository): reduce interactive transaction scope across repository modules` (Hash: `0ebf469`)
- **Rationale:** Minimizing the time during which SQLite write locks are held is key to reducing queuing delays. Removing long-running select operations and relation joins from the transaction helps keep lock hold times to a minimum.
- **Changes:**
  - Shifted category configuration, resource check validations, and final object relation-joining fetches completely outside the transaction callbacks.
  - Replaced read-before-write sequences in `AllocationRepository` with an atomic conditional `updateMany` update filtering on status (`AVAILABLE`).
- **Impact:** Decreases transaction durations from ~1 second to sub-millisecond execution times, reducing lock wait times by over 90%.

### 3. `test(stress): update absolute path resolution in test runners` (Hash: `cbd87e7`)
- **Rationale:** Seeding and schema bootstrap actions in test scripts failed or used incorrect database paths depending on the working directory of the invoking shell process.
- **Changes:**
  - Standardized absolute file path resolution using `path.resolve` for schema generation and database file location definitions.
- **Impact:** Ensures tests run reliably regardless of execution working directory.

### 4. `docs(sqlite): document transaction analysis and performance benchmark results` (Hash: `5ac9ff8`)
- **Rationale:** To establish a clear reference for the investigation findings, execution timeline descriptions, and performance profiling comparisons.
- **Changes:**
  - Created `docs/SQLITE_TRANSACTION_ANALYSIS.md` detailing root cause metrics, execution flows, and architectural scaling decisions.
  - Updated stress testing reports and benchmark snapshot output files.
- **Impact:** Outlines the empirical justification for the changes and guides future production scalability decisions.
