# System Performance Telemetry Report — AssetFlow ERP

- **Timestamp**: 2026-07-12T08:46:43.038Z
- **Git Commit**: `3d29a9a4e9d3c03aebc197ec284c44bc84052d23`
- **Branch**: `main`
- **Node Version**: v24.13.0

---

## 1. Request Performance Profile

| Performance Dimension | Measured Value |
| :--- | :--- |
| **Throughput** | 20.13 requests/sec |
| **Total Workload Run** | 100 requests (50 creations, 50 queries) |
| **Total Runtime** | 4967 ms |
| **Success / Failure** | 100 Success / 0 Failures |

---

## 2. Latency Metrics (HTTP SLAs)

| Percentile SLA | Latency (ms) |
| :--- | :--- |
| **Average Latency** | 38.98 ms |
| **P95 Latency** | 89 ms |
| **P99 Latency** | 101 ms |
| **Maximum Latency** | 101 ms |

---

## 3. Database Operation Telemetry

| Database Telemetry Metric | Measured Value |
| :--- | :--- |
| **Total Queries** | 510 |
| **Total Reads** | 409 |
| **Total Writes** | 101 |
| **Average Query Time** | 5.95 ms |
| **Slowest Query Time** | 67 ms |
| **Slowest Query Args** | `{"data":{"action":"CREATE","targetType":"Asset","targetId":"210425dd-be05-4d47-b106-0c51c9ec3c87","c...` |

---

## 4. System Telemetry & Event Loop Load

| System Telemetry Dimension | Measured Value |
| :--- | :--- |
| **Peak RSS Memory** | 492.24 MB |
| **Heap Memory Used** | 303.39 MB |
| **CPU Time** | 3312 ms |
| **Average Event Loop Delay** | 0.4 ms |
| **Maximum Event Loop Delay** | 3 ms |
