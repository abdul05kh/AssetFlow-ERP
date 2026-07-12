# System Performance Telemetry Report — AssetFlow ERP

- **Timestamp**: 2026-07-12T11:05:05.374Z
- **Git Commit**: `05290a85a9f5a20757198c51f4ec8a20def26dcc`
- **Branch**: `main`
- **Node Version**: v24.13.0

---

## 1. Request Performance Profile

| Performance Dimension | Measured Value |
| :--- | :--- |
| **Throughput** | 45.58 requests/sec |
| **Total Workload Run** | 100 requests (50 creations, 50 queries) |
| **Total Runtime** | 2194 ms |
| **Success / Failure** | 100 Success / 0 Failures |

---

## 2. Latency Metrics (HTTP SLAs)

| Percentile SLA | Latency (ms) |
| :--- | :--- |
| **Average Latency** | 11.7 ms |
| **P95 Latency** | 45 ms |
| **P99 Latency** | 79 ms |
| **Maximum Latency** | 79 ms |

---

## 3. Database Operation Telemetry

| Database Telemetry Metric | Measured Value |
| :--- | :--- |
| **Total Queries** | 510 |
| **Total Reads** | 409 |
| **Total Writes** | 101 |
| **Average Query Time** | 2.47 ms |
| **Slowest Query Time** | 96 ms |
| **Slowest Query Args** | `{"data":{"action":"CREATE","targetType":"Asset","targetId":"0d525a72-c28f-49d1-aaff-0371a58a3f16","c...` |

---

## 4. System Telemetry & Event Loop Load

| System Telemetry Dimension | Measured Value |
| :--- | :--- |
| **Peak RSS Memory** | 496.66 MB |
| **Heap Memory Used** | 303.68 MB |
| **CPU Time** | 875 ms |
| **Average Event Loop Delay** | 0.03 ms |
| **Maximum Event Loop Delay** | 1 ms |
