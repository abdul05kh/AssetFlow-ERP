# System Performance Telemetry Report — AssetFlow ERP

- **Timestamp**: 2026-07-12T10:15:55.380Z
- **Git Commit**: `15a22441de67179ddefc40834ee2a965c515c21e`
- **Branch**: `main`
- **Node Version**: v24.13.0

---

## 1. Request Performance Profile

| Performance Dimension | Measured Value |
| :--- | :--- |
| **Throughput** | 47.26 requests/sec |
| **Total Workload Run** | 100 requests (50 creations, 50 queries) |
| **Total Runtime** | 2116 ms |
| **Success / Failure** | 100 Success / 0 Failures |

---

## 2. Latency Metrics (HTTP SLAs)

| Percentile SLA | Latency (ms) |
| :--- | :--- |
| **Average Latency** | 11.02 ms |
| **P95 Latency** | 48 ms |
| **P99 Latency** | 62 ms |
| **Maximum Latency** | 62 ms |

---

## 3. Database Operation Telemetry

| Database Telemetry Metric | Measured Value |
| :--- | :--- |
| **Total Queries** | 510 |
| **Total Reads** | 409 |
| **Total Writes** | 101 |
| **Average Query Time** | 2.01 ms |
| **Slowest Query Time** | 64 ms |
| **Slowest Query Args** | `{"data":{"action":"CREATE","targetType":"Asset","targetId":"2061abb6-ab37-478d-ae0d-30011ba1449d","c...` |

---

## 4. System Telemetry & Event Loop Load

| System Telemetry Dimension | Measured Value |
| :--- | :--- |
| **Peak RSS Memory** | 496.23 MB |
| **Heap Memory Used** | 302.65 MB |
| **CPU Time** | 859 ms |
| **Average Event Loop Delay** | 0.06 ms |
| **Maximum Event Loop Delay** | 1 ms |
