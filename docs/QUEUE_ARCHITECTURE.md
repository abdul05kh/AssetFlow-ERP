# Background Job Queue Architecture — AssetFlow ERP

AssetFlow implements an asynchronous background FIFO job queue to decouple business transactions from logging side effects. This architecture solves reader-writer deadlocks on single-writer databases (like SQLite fallback) and improves request response latency.

---

## 1. Sequence Flow Diagrams

```
[ HTTP Request Client ]
          │
          ▼
 [ Express Route Controller ] ─── (Initiates Business Logic)
          │
          ▼
┌────────────────────────────────────────────────────────┐
│               Prisma Interactive transaction           │
│                                                        │
│  - Update Asset Status                                 │
│  - Create Allocation Assignments                       │
│  - Capture previous records (oldState)                 │
└────────────────────────────────────────────────────────┘
          │
          ├─► [ Transaction Context ] (Collects log writers & events)
          │
          ▼
 [ Transaction Commits ] (Success Response to HTTP Client)
          │
          ▼
[ Asynchronous background queue trigger ]
          │
          ├─► Dispatch events via In-Memory EventBus
          │
          ▼
┌────────────────────────────────────────────────────────┐
│             BackgroundJobQueue (FIFO, Concurrency=1)   │
│                                                        │
│  - Job 1: Write AuditLog for Category                  │
│  - Job 2: Write AuditLog for Asset                     │
│  - Job 3: Write AuditLog for Allocation                │
└────────────────────────────────────────────────────────┘
          │
          ▼
 [ SQLite / PostgreSQL Database Engined Commit ]
```

---

## 2. Job Queue Implementation Mechanics

### BackgroundJobQueue
- **FIFO Ordering**: Ensures that all incoming logs and notifications are saved in the exact sequential order they occurred.
- **Concurrency = 1**: SQLite only allows one write query at any given moment. By setting worker concurrency limit to `1` (sequential), write contentions are completely eliminated.
- **Transient Failure Retries**: If the database throws a temporary socket timeout or busy code, the job queue waits `200ms` and retries up to 3 times before dropping the task.
- **Diagnostics Telemetry**: Real-time stats are exposed via `/api/v1/metrics`.

---

## 3. Real-Time Telemetry & Monitoring Endpoint

Real-time health statistics can be checked using the telemetry health route:
```bash
GET /api/v1/metrics
```

### JSON Response Body
```json
{
  "status": "ok",
  "queue": {
    "queueLength": 0,
    "completedJobs": 44,
    "failedJobs": 0,
    "retries": 0,
    "droppedJobs": 0,
    "averageExecutionTimeMs": 1.25,
    "processingRatePerSecond": 0.8
  },
  "database": {
    "totalQueries": 510,
    "totalReads": 409,
    "totalWrites": 101,
    "averageDurationMs": 5.95,
    "slowestQueries": [
      {
        "model": "Asset",
        "operation": "create",
        "durationMs": 42,
        "queryArgs": "{ ... }"
      }
    ]
  }
}
```
This telemetry simplifies profiling and capacity-planning checks for operations engineers.
