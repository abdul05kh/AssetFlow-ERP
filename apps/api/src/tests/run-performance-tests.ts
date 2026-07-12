import { execSync } from "child_process";
import { Server } from "http";
import app from "../app";
import fs from "fs";
import path from "path";
import os from "os";
import assert from "assert";

const API_BASE = "http://localhost:4000/api/v1";
const HEALTH_URL = "http://localhost:4000/health";

async function fetchSafe(url: string, init?: RequestInit): Promise<Response> {
  const correlationId = Math.random().toString(36).substring(2, 15);
  const headers = new Headers(init?.headers);
  headers.set("x-correlation-id", correlationId);

  const finalInit = { ...init, headers };
  try {
    return await fetch(url, finalInit);
  } catch (err: any) {
    throw new Error(`Fetch failed to ${url}: ${err.message}`);
  }
}

async function measureEventLoopDelay(): Promise<number> {
  const start = Date.now();
  return new Promise((resolve) => {
    setImmediate(() => {
      resolve(Date.now() - start);
    });
  });
}

async function runPerformanceTests() {
  console.log("\n==================================================");
  console.log("   ASSETFLOW ERP SYSTEM PERFORMANCE PROFILER      ");
  console.log("==================================================\n");

  console.log("[Bootstrap] Preparing clean database for profiling...");
  try {
    execSync("npx prisma generate --schema=../../prisma/schema.prisma", { stdio: "ignore" });
    execSync("npx prisma db push --schema=../../prisma/schema.prisma --force-reset --accept-data-loss", { stdio: "ignore" });
    execSync("npx ts-node src/seed.ts", { stdio: "ignore" });
  } catch (err: any) {
    console.error(`❌ Performance bootstrap failed: ${err.message}`);
    process.exit(1);
  }

  let server: Server | null = null;
  const port = 4000;

  try {
    server = app.listen(port);
    let healthy = false;
    for (let i = 0; i < 20; i++) {
      try {
        const res = await fetch(HEALTH_URL);
        if (res.status === 200) {
          healthy = true;
          break;
        }
      } catch (e) {}
      await new Promise((r) => setTimeout(r, 200));
    }
    if (!healthy) throw new Error("Server failed health check.");

    // Login for authentication token
    const resLogin = await fetchSafe(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "admin@assetflow.erp", password: "Password123" }),
    });
    const payloadLogin = await resLogin.json();
    const adminToken = payloadLogin.data.accessToken;

    // Fetch dynamic Category and Department IDs
    const resDept = await fetchSafe(`${API_BASE}/departments`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const departments = await resDept.json();
    const testDeptId = departments.data?.[0]?.id;

    const resCat = await fetchSafe(`${API_BASE}/assets/categories`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const categories = await resCat.json();
    const testCategoryId = categories.data?.[0]?.id;

    const resUsers = await fetchSafe(`${API_BASE}/users`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const users = await resUsers.json();
    const devEmployee = users.data?.find((u: any) => u.email === "employee@assetflow.erp");
    const devEmployeeId = devEmployee?.id;

    console.log("[Profiler] Starting workload simulation (100 sequential asset operations)...");

    const startCpu = process.cpuUsage();
    const startTime = Date.now();
    const latencies: number[] = [];
    const eventLoopDelays: number[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Simulate 50 Asset Creations followed by 50 Category lookups
    for (let i = 0; i < 50; i++) {
      const serial = `SN-PERF-${i}-${Date.now()}`;
      const opStart = Date.now();

      try {
        const res = await fetchSafe(`${API_BASE}/assets`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminToken}` },
          body: JSON.stringify({
            name: `Perf Asset ${i}`,
            serialNumber: serial,
            categoryId: testCategoryId,
            departmentId: testDeptId,
            acquisitionDate: new Date().toISOString(),
            acquisitionCost: 200.0,
            currentLocation: "Perf Testing Suite",
            condition: "NEW",
            sharedResource: false,
          }),
        });
        const payload = await res.json();
        assert.ok(res.status === 201 || res.status === 210);
        latencies.push(Date.now() - opStart);
        successCount++;
      } catch (e) {
        errorCount++;
      }

      eventLoopDelays.push(await measureEventLoopDelay());
    }

    for (let i = 0; i < 50; i++) {
      const opStart = Date.now();
      try {
        const res = await fetchSafe(`${API_BASE}/assets/categories`, {
          headers: { Authorization: `Bearer ${adminToken}` },
        });
        assert.strictEqual(res.status, 200);
        latencies.push(Date.now() - opStart);
        successCount++;
      } catch (e) {
        errorCount++;
      }
      eventLoopDelays.push(await measureEventLoopDelay());
    }

    // Await background queue flushes
    console.log("[Profiler] Waiting for background queue to persist logging...");
    await new Promise((r) => setTimeout(r, 1000));

    // Retrieve database telemetry from metrics endpoint
    const resMetrics = await fetchSafe(`${API_BASE}/metrics`);
    const metricsPayload = await resMetrics.json();

    const totalRuntime = Date.now() - startTime;
    const endCpu = process.cpuUsage(startCpu);
    const cpuTimeMs = (endCpu.user + endCpu.system) / 1000;
    const memUsage = process.memoryUsage();

    // Latency percentiles
    latencies.sort((a, b) => a - b);
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / (latencies.length || 1);
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)] || 0;
    const p99Latency = latencies[Math.floor(latencies.length * 0.99)] || 0;
    const maxLatency = latencies[latencies.length - 1] || 0;
    const throughput = (successCount / (totalRuntime / 1000));

    // Event Loop delays
    const avgEventLoop = eventLoopDelays.reduce((a, b) => a + b, 0) / (eventLoopDelays.length || 1);
    const maxEventLoop = Math.max(...eventLoopDelays);

    // SQL / Query Telemetry
    const dbTelemetry = metricsPayload.database || { totalQueries: 0, totalReads: 0, totalWrites: 0, averageDurationMs: 0, slowestQueries: [] };
    const slowestSql = dbTelemetry.slowestQueries?.[0]?.queryArgs || "N/A";
    const slowestSqlTime = dbTelemetry.slowestQueries?.[0]?.durationMs || 0;

    const reportData = {
      timestamp: new Date().toISOString(),
      gitCommit: execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim(),
      branch: execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim(),
      nodeVersion: process.version,
      databaseProvider: metricsPayload.database?.provider || "SQLite/fallback",
      os: `${os.type()} ${os.release()}`,
      cpu: os.cpus()[0]?.model || "Unknown CPU",
      systemMetrics: {
        peakRssMemory: `${(memUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        cpuTimeMs,
        avgEventLoopDelayMs: parseFloat(avgEventLoop.toFixed(2)),
        maxEventLoopDelayMs: maxEventLoop,
      },
      httpMetrics: {
        totalRequestsSimulated: successCount + errorCount,
        successCount,
        errorCount,
        throughputOpsPerSecond: parseFloat(throughput.toFixed(2)),
        averageLatencyMs: parseFloat(avgLatency.toFixed(2)),
        p95LatencyMs: p95Latency,
        p99LatencyMs: p99Latency,
        maxLatencyMs: maxLatency,
        totalRuntimeMs: totalRuntime,
      },
      databaseMetrics: {
        totalQueries: dbTelemetry.totalQueries,
        totalReads: dbTelemetry.totalReads,
        totalWrites: dbTelemetry.totalWrites,
        avgQueryTimeMs: dbTelemetry.averageDurationMs,
        slowestQueryText: slowestSql,
        slowestQueryTimeMs: slowestSqlTime,
      },
    };

    console.log("\n==================================================");
    console.log("            PERFORMANCE PROFILE COMPLETED         ");
    console.log("==================================================");
    console.log(`Throughput:      ${reportData.httpMetrics.throughputOpsPerSecond} req/sec`);
    console.log(`Avg Latency:     ${reportData.httpMetrics.averageLatencyMs} ms`);
    console.log(`P95 Latency:     ${reportData.httpMetrics.p95LatencyMs} ms`);
    console.log(`P99 Latency:     ${reportData.httpMetrics.p99LatencyMs} ms`);
    console.log(`Event Loop Delay: ${reportData.systemMetrics.avgEventLoopDelayMs} ms`);
    console.log(`DB Queries:      ${reportData.databaseMetrics.totalQueries} (R: ${reportData.databaseMetrics.totalReads}, W: ${reportData.databaseMetrics.totalWrites})`);
    console.log(`DB Avg Time:     ${reportData.databaseMetrics.avgQueryTimeMs} ms`);
    console.log("==================================================\n");

    const reportDir = path.resolve(__dirname, "../../../../docs/benchmarks");
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    // Write Report Files
    fs.writeFileSync(path.join(reportDir, "perf-report.json"), JSON.stringify(reportData, null, 2));

    const dateStr = new Date().toISOString().split("T")[0];
    const mdReportPath = path.resolve(__dirname, "../../../../docs/PERFORMANCE_REPORT.md");
    const historyMdPath = path.join(reportDir, `perf-${dateStr}.md`);

    const mdContent = `# System Performance Telemetry Report — AssetFlow ERP

- **Timestamp**: ${reportData.timestamp}
- **Git Commit**: \`${reportData.gitCommit}\`
- **Branch**: \`${reportData.branch}\`
- **Node Version**: ${reportData.nodeVersion}

---

## 1. Request Performance Profile

| Performance Dimension | Measured Value |
| :--- | :--- |
| **Throughput** | ${reportData.httpMetrics.throughputOpsPerSecond} requests/sec |
| **Total Workload Run** | 100 requests (50 creations, 50 queries) |
| **Total Runtime** | ${totalRuntime} ms |
| **Success / Failure** | ${successCount} Success / ${errorCount} Failures |

---

## 2. Latency Metrics (HTTP SLAs)

| Percentile SLA | Latency (ms) |
| :--- | :--- |
| **Average Latency** | ${reportData.httpMetrics.averageLatencyMs} ms |
| **P95 Latency** | ${reportData.httpMetrics.p95LatencyMs} ms |
| **P99 Latency** | ${reportData.httpMetrics.p99LatencyMs} ms |
| **Maximum Latency** | ${reportData.httpMetrics.maxLatencyMs} ms |

---

## 3. Database Operation Telemetry

| Database Telemetry Metric | Measured Value |
| :--- | :--- |
| **Total Queries** | ${reportData.databaseMetrics.totalQueries} |
| **Total Reads** | ${reportData.databaseMetrics.totalReads} |
| **Total Writes** | ${reportData.databaseMetrics.totalWrites} |
| **Average Query Time** | ${reportData.databaseMetrics.avgQueryTimeMs} ms |
| **Slowest Query Time** | ${reportData.databaseMetrics.slowestQueryTimeMs} ms |
| **Slowest Query Args** | \`${reportData.databaseMetrics.slowestQueryText.substring(0, 100)}...\` |

---

## 4. System Telemetry & Event Loop Load

| System Telemetry Dimension | Measured Value |
| :--- | :--- |
| **Peak RSS Memory** | ${reportData.systemMetrics.peakRssMemory} |
| **Heap Memory Used** | ${reportData.systemMetrics.heapUsed} |
| **CPU Time** | ${reportData.systemMetrics.cpuTimeMs} ms |
| **Average Event Loop Delay** | ${reportData.systemMetrics.avgEventLoopDelayMs} ms |
| **Maximum Event Loop Delay** | ${reportData.systemMetrics.maxEventLoopDelayMs} ms |
`;

    fs.writeFileSync(mdReportPath, mdContent);
    fs.writeFileSync(historyMdPath, mdContent);

    console.log(`[Profiler] Telemetry logs saved:`);
    console.log(` - JSON: docs/benchmarks/perf-report.json`);
    console.log(` - Markdown: docs/PERFORMANCE_REPORT.md`);

  } catch (err: any) {
    console.error(`❌ Performance profiling execution failed: ${err.message}`);
    process.exit(1);
  } finally {
    if (server) {
      console.log("[Teardown] Gracefully shutting down Express test server listener...");
      server.close();
    }
  }
}

runPerformanceTests();
