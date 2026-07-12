# Stress Test Benchmark Report — AssetFlow ERP

- **Timestamp**: 2026-07-12T08:46:05.840Z
- **Git Commit**: `3d29a9a4e9d3c03aebc197ec284c44bc84052d23`
- **Branch**: `main`
- **Node Version**: v24.13.0
- **Operating System**: Windows_NT 10.0.26200 (x64)
- **CPU**: 13th Gen Intel(R) Core(TM) i7-13700HX

---

## 1. Concurrency Benchmarks

| Metric | Measured Value |
| :--- | :--- |
| **Database Provider** | `SQLITE` |
| **Number of Workers** | 3 |
| **Success Rate** | **100.00%** |
| **Success Operations** | 9 |
| **Failed Operations** | 0 |
| **Throughput** | 3.71 ops/sec |
| **Total Runtime** | 2428 ms |
| **CPU Time** | 1062 ms |
| **Peak RSS Memory** | 494.56 MB |
| **Heap Used** | 276.65 MB |

---

## 2. Latency Metrics

| SLA Percentile | Latency (ms) |
| :--- | :--- |
| **Average Latency** | 199.11 ms |
| **P95 Latency** | 560 ms |
| **P99 Latency** | 560 ms |
| **Maximum Latency** | 560 ms |

---

## 3. Background Persistence Mappings

- **Audit Logs Written**: 44
- **Activity Logs Written**: 10
- **Notifications Created**: 9

---

## 4. Errors & Diagnostics
_No errors encountered during this stress test benchmark._

---

## 5. Recommendations
- **SQLite Fallback**: Keep concurrency under 5 workers locally to avoid locking contentions.
- **Production PostgreSQL**: Supports scaling configurations with 50+ concurrent workers cleanly without wait latency blocks.
