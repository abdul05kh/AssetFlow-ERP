import assert from "assert";
import { execSync } from "child_process";
import { Server } from "http";
import app from "../app";
import { prisma } from "../config/db";
import { jobQueue } from "../utils/job-queue";


const API_BASE = "http://localhost:4000/api/v1";
const HEALTH_URL = "http://localhost:4000/health";

const logTest = (name: string, status: "PASS" | "FAIL", details?: string) => {
  const color = status === "PASS" ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}[${status}]\x1b[0m ${name} ${details ? `(${details})` : ""}`);
};

// Phase 11 - Descriptive HTTP request wrapper to capture connection errors
async function fetchSafe(url: string, options: any = {}) {
  try {
    const res = await fetch(url, options);
    return res;
  } catch (err: any) {
    console.error(`\n❌ [API CONNECTION FAILURE]`);
    console.error(`Attempted URL : ${url}`);
    console.error(`Method        : ${options?.method || "GET"}`);
    console.error(`Error Code    : ${err.code || "UNKNOWN"}`);
    console.error(`Error Message : ${err.message}`);
    console.error(`Server Status : Connection refused. Check if the test server is listening on port 4000.\n`);
    throw err;
  }
}

async function waitForHealthCheck(attempts = 30, delayMs = 500): Promise<boolean> {
  console.log(`[HealthCheck] Polling health endpoint at ${HEALTH_URL}...`);
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(HEALTH_URL);
      if (res.status === 200) {
        const payload = await res.json();
        if (payload.status === "ok") {
          console.log(`[HealthCheck] Server is healthy and ready to process requests.`);
          return true;
        }
      }
    } catch (err) {
      // Ignore errors during polling startup phase
    }
    await new Promise((resolve) => setTimeout(resolve, delayMs));
  }
  return false;
}

async function runTests() {
  // Phase 5 & 6 - Database Initialization & Test Isolation
  console.log("\n[Bootstrap] Preparing clean database and running Prisma schema migrations...");
  try {
    execSync("npx prisma generate --schema=../../prisma/schema.prisma", { stdio: "ignore" });
    execSync("npx prisma db push --schema=../../prisma/schema.prisma --force-reset --accept-data-loss", { stdio: "ignore" });
    execSync("npx ts-node src/seed.ts", { stdio: "ignore" });
    console.log("[Bootstrap] Database migration and seed data applied successfully.");
  } catch (err: any) {
    console.error("❌ Database bootstrap failed:", err.message);
    process.exit(1);
  }

  // Phase 3 - Dynamic server startup
  let server: Server | null = null;
  try {
    console.log("[Server] Starting integration tests Express server listener...");
    server = app.listen(4000);
  } catch (err: any) {
    console.error("❌ Failed to start Express listener:", err.message);
    process.exit(1);
  }

  // Phase 4 - Wait for health endpoint readiness checks
  const healthy = await waitForHealthCheck();
  if (!healthy) {
    console.error("❌ Express test server failed healthcheck polling inside limit.");
    if (server) server.close();
    process.exit(1);
  }

  console.log("\n\x1b[36m==================================================\x1b[0m");
  console.log("\x1b[36m   ASSETFLOW ERP AUTOMATED INTEGRATION TEST SUITE  \x1b[0m");
  console.log("\x1b[36m==================================================\x1b[0m\n");

  let adminToken = "";
  let techToken = "";
  let testAssetId = "";
  let testCategoryId = "";
  let testAllocationId = "";
  let testTransferId = "";
  let testBookingId = "";
  let testMaintTicketId = "";
  let testAuditId = "";
  let testAuditItemId = "";

  const adminEmail = "admin@assetflow.erp";
  const pass = "Password123";

  try {
    // 1. AUTHENTICATION & LOGIN TESTS
    try {
      const res = await fetchSafe(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: adminEmail, password: pass }),
      });
      const payload = await res.json();
      assert.strictEqual(res.status, 200, `Expected 200, got ${res.status}`);
      assert.ok(payload.data.accessToken, "Auth token not returned");
      adminToken = payload.data.accessToken;
      logTest("Auth: Admin Logged In", "PASS");
    } catch (err: any) {
      logTest("Auth: Admin Logged In", "FAIL", err.message);
      throw err;
    }

    // Fetch dynamic Department ID and User IDs
    let testDeptId = "";
    let devEmployeeId = "";
    let managerUserId = "";

    try {
      const resDepts = await fetchSafe(`${API_BASE}/departments`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const payloadDepts = await resDepts.json();
      assert.strictEqual(resDepts.status, 200);
      assert.ok(payloadDepts.data && payloadDepts.data.length > 0, "No departments found");
      testDeptId = payloadDepts.data[0].id;

      const resUsers = await fetchSafe(`${API_BASE}/users`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const payloadUsers = await resUsers.json();
      assert.strictEqual(resUsers.status, 200);
      const usersList = payloadUsers.data;
      assert.ok(usersList && usersList.length > 0, "No users found");

      const devUser = usersList.find((u: any) => u.email === "employee@assetflow.erp");
      const mngrUser = usersList.find((u: any) => u.email === "manager@assetflow.erp");
      
      assert.ok(devUser, "Seeded employee user not found");
      assert.ok(mngrUser, "Seeded manager user not found");

      devEmployeeId = devUser.id;
      managerUserId = mngrUser.id;
    } catch (err: any) {
      console.error("❌ Failed to query database IDs dynamically:", err.message);
      throw err;
    }

    // 2. CATEGORY CREATION & VALIDATION
    try {
      const uniqueCategoryName = `Test Hardware Category ${Date.now()}`;
      const res = await fetchSafe(`${API_BASE}/assets/categories`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: uniqueCategoryName,
          description: "Integration testing classification",
          sharedResource: false,
          defaultMaintenanceInterval: 90,
        }),
      });
      const payload = await res.json();
      assert.strictEqual(res.status, 210, `Expected 210, got ${res.status}`);
      testCategoryId = payload.data.id;
      logTest("Asset: Category Created", "PASS");
    } catch (err: any) {
      logTest("Asset: Category Created", "FAIL", err.message);
      throw err;
    }

    // 3. ASSET REGISTRY & TAG SEQUENCE GENERATION
    try {
      const uniqueSerialNumber = `SN-TEST-REG-${Date.now()}`;
      const res = await fetchSafe(`${API_BASE}/assets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          name: "Test Laptop Asset v2",
          serialNumber: uniqueSerialNumber,
          categoryId: testCategoryId,
          departmentId: testDeptId,
          acquisitionDate: new Date().toISOString(),
          acquisitionCost: 1850.0,
          currentLocation: "Lab 201",
          condition: "NEW",
          sharedResource: false,
          description: "Assigned for integration test validation",
        }),
      });
      const payload = await res.json();
      assert.strictEqual(res.status, 210, `Expected 210, got ${res.status}`);
      assert.ok(payload.data.tag.startsWith("AF-"), "Invalid sequence tag layout");
      testAssetId = payload.data.id;
      logTest("Asset: Sequence Tag Mapped", "PASS", `Tag: ${payload.data.tag}`);
    } catch (err: any) {
      logTest("Asset: Sequence Tag Mapped", "FAIL", err.message);
      throw err;
    }

    // 4. ROLE-BASED ACCESS CONTROL (RBAC) ROUTE SHIELDING
    try {
      const res = await fetchSafe(`${API_BASE}/departments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: "BAD", name: "Intruders Dept" }),
      });
      assert.strictEqual(res.status, 401, `Expected 401 Unauthorized, got ${res.status}`);
      logTest("Security: RBAC Unauthenticated Shielding", "PASS");
    } catch (err: any) {
      logTest("Security: RBAC Unauthenticated Shielding", "FAIL", err.message);
      throw err;
    }

    // 5. DOUBLE ALLOCATION LOCK VERIFICATION
    try {
      // Perform first allocation (valid)
      const resAlloc = await fetchSafe(`${API_BASE}/allocations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assetId: testAssetId,
          employeeId: devEmployeeId,
          expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
          notes: "Test assigned allocation",
        }),
      });
      const payloadAlloc = await resAlloc.json();
      assert.strictEqual(resAlloc.status, 210, `Expected 210, got ${resAlloc.status}`);
      testAllocationId = payloadAlloc.data.id;

      // Perform second allocation immediately (should fail double allocation constraint)
      const resDouble = await fetchSafe(`${API_BASE}/allocations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assetId: testAssetId,
          employeeId: devEmployeeId,
        }),
      });
      const payloadDouble = await resDouble.json();
      assert.strictEqual(resDouble.status, 422, `Expected 422, got ${resDouble.status}`);
      assert.strictEqual(payloadDouble.errors[0].code, "ASSET_002");
      logTest("Constraint: Double Allocation Prevented", "PASS");
    } catch (err: any) {
      logTest("Constraint: Double Allocation Prevented", "FAIL", err.message);
      throw err;
    }

    // 6. OWNERSHIP TRANSFER CYCLE
    try {
      const resReq = await fetchSafe(`${API_BASE}/transfers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assetId: testAssetId,
          targetHolderId: managerUserId,
          reason: "Integration test transfer request",
        }),
      });
      const payloadReq = await resReq.json();
      assert.strictEqual(resReq.status, 210, `Expected 210, got ${resReq.status}`);
      testTransferId = payloadReq.data.id;

      const resApprove = await fetchSafe(`${API_BASE}/transfers/${testTransferId}/approve`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ status: "APPROVED" }),
      });
      const payloadApprove = await resApprove.json();
      assert.strictEqual(resApprove.status, 200, `Expected 200, got ${resApprove.status}`);
      assert.strictEqual(payloadApprove.data.status, "APPROVED");
      logTest("Workflow: Transfer Approved & Mapped", "PASS");

      // Phase 9 - Regression Tests: Wait for post-commit hooks and assert records exist
      await new Promise((resolve) => setTimeout(resolve, 100));

      const activity = await prisma.activityLog.findFirst({
        where: {
          action: "TRANSFER",
          targetId: testAssetId,
        },
      });
      assert.ok(activity, "ActivityLog record not found for transfer");
      assert.strictEqual(activity.currentState, "ALLOCATED");

      const audit = await prisma.auditLog.findFirst({
        where: {
          tableName: "AssetTransfer",
          action: "UPDATE",
          recordId: testTransferId,
        },
      });
      assert.ok(audit, "AuditLog record not found for transfer request update");

      const notification = await prisma.notification.findFirst({
        where: {
          userId: managerUserId,
          message: { contains: "transfer ownership has been approved" },
        },
      });
      assert.ok(notification, "Notification record not found for transferee");

      logTest("Regression: Post-Commit Activity, Audit & Notifications Verified", "PASS");
    } catch (err: any) {
      logTest("Workflow: Transfer Approved & Mapped", "FAIL", err.message);
      throw err;
    }

    // 7. RETURN PROCESS & AUTOMATED MAINTENANCE TRIGGER
    try {
      const resReturn = await fetchSafe(`${API_BASE}/returns`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({
          assetId: testAssetId,
          conditionOnReturn: "DAMAGED",
          notes: "Laptop cracked screen during test handover",
        }),
      });
      assert.strictEqual(resReturn.status, 200, `Expected 200, got ${resReturn.status}`);

      // Verify maintenance ticket spawned auto-magically
      const resMaint = await fetchSafe(`${API_BASE}/maintenance`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const payloadMaint = await resMaint.json();
      const spawned = payloadMaint.data.find((t: any) => t.assetId === testAssetId);
      assert.ok(spawned, "Automated maintenance ticket not found");
      assert.strictEqual(spawned.priority, "HIGH");
      logTest("Workflow: Damaged Return Auto-triggered Maintenance", "PASS");
    } catch (err: any) {
      logTest("Workflow: Damaged Return Auto-triggered Maintenance", "FAIL", err.message);
      throw err;
    }

    // 8. DASHBOARD STATISTICS EXTRACTION
    try {
      const resStats = await fetchSafe(`${API_BASE}/dashboard/stats`, {
        method: "GET",
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const payloadStats = await resStats.json();
      assert.strictEqual(resStats.status, 200, `Expected 200, got ${resStats.status}`);
      assert.ok(payloadStats.data.assets, "Metrics assets missing");
      logTest("Reports: Dashboard Statistics Compiled", "PASS");
    } catch (err: any) {
      logTest("Reports: Dashboard Statistics Compiled", "FAIL", err.message);
      throw err;
    }

    console.log("\n\x1b[32m==================================================\x1b[0m");
    console.log("\x1b[32m   INTEGRATION TEST SUITE RUN COMPLETED SUCCESSFULLY \x1b[0m");
    console.log("\x1b[32m==================================================\x1b[0m\n");

  } catch (err) {
    console.error("❌ Test suite run failed.");
    if (server) server.close();
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  } finally {
    // Phase 3 - Gracefully stop server, disconnect DB, drain job queue, and exit
    // so port 4000 is immediately released before the Playwright step starts.
    if (server) {
      console.log("[Teardown] Gracefully shutting down Express test server listener...");
      await new Promise<void>((resolve) => server!.close(() => resolve()));
    }
    await jobQueue.shutdown(3000);
    await prisma.$disconnect().catch(() => {});
  }
}

runTests().then(() => process.exit(0)).catch(() => process.exit(1));
