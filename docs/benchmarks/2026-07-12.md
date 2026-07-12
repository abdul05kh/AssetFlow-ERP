# Stress Test Benchmark Report — AssetFlow ERP

- **Timestamp**: 2026-07-12T11:04:48.107Z
- **Git Commit**: `05290a85a9f5a20757198c51f4ec8a20def26dcc`
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
| **Throughput** | 5.13 ops/sec |
| **Total Runtime** | 1755 ms |
| **CPU Time** | 234 ms |
| **Peak RSS Memory** | 499.02 MB |
| **Heap Used** | 312.63 MB |

---

## 2. Latency Metrics

| SLA Percentile | Latency (ms) |
| :--- | :--- |
| **Average Latency** | 43.78 ms |
| **P95 Latency** | 219 ms |
| **P99 Latency** | 219 ms |
| **Maximum Latency** | 219 ms |

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
