import assert from "assert";

const API_BASE = "http://localhost:4000/api/v1";

const logTest = (name: string, status: "PASS" | "FAIL", details?: string) => {
  const color = status === "PASS" ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}[${status}]\x1b[0m ${name} ${details ? `(${details})` : ""}`);
};

async function runTests() {
  console.log("\n\x1b[36m==================================================\x1b[0m");
  console.log("\x1b[36m   ASSETFLOW ERP AUTOMATED INTEGRATION TEST SUITE  \x1b[0m");
  console.log("\x1b[36m==================================================\x1b[0m\n");

  let adminToken = "";
  let techToken = "";
  let auditorToken = "";
  let testAssetId = "";
  let testCategoryId = "";
  let testAllocationId = "";
  let testTransferId = "";
  let testBookingId = "";
  let testMaintTicketId = "";
  let testAuditId = "";
  let testAuditItemId = "";
  let testNotificationId = "";

  const adminEmail = "admin@assetflow.erp";
  const pass = "Password123";

  // 1. AUTHENTICATION & LOGIN TESTS
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: adminEmail, password: pass }),
    });
    const payload = await res.json();
    assert.strictEqual(res.status, 200);
    assert.ok(payload.data.accessToken);
    adminToken = payload.data.accessToken;
    logTest("Auth: Admin Logged In", "PASS");
  } catch (err: any) {
    logTest("Auth: Admin Logged In", "FAIL", err.message);
    process.exit(1);
  }

  // 2. CATEGORY CREATION & VALIDATION
  try {
    const uniqueCategoryName = `Test Hardware Category ${Date.now()}`;
    const res = await fetch(`${API_BASE}/assets/categories`, {
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
    assert.strictEqual(res.status, 210);
    testCategoryId = payload.data.id;
    logTest("Asset: Category Created", "PASS");
  } catch (err: any) {
    logTest("Asset: Category Created", "FAIL", err.message);
    process.exit(1);
  }

  // 3. ASSET REGISTRY & TAG SEQUENCE GENERATION
  try {
    const uniqueSerialNumber = `SN-TEST-REG-${Date.now()}`;
    const res = await fetch(`${API_BASE}/assets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        name: "Test Laptop Asset v2",
        serialNumber: uniqueSerialNumber,
        categoryId: testCategoryId,
        departmentId: "a7b7daed-a3a2-4b08-addd-50196e1d782e", // RND
        acquisitionDate: new Date().toISOString(),
        acquisitionCost: 1850.0,
        currentLocation: "Lab 201",
        condition: "NEW",
        sharedResource: false,
        description: "Assigned for integration test validation",
      }),
    });
    const payload = await res.json();
    assert.strictEqual(res.status, 210);
    assert.ok(payload.data.tag.startsWith("AF-"));
    testAssetId = payload.data.id;
    logTest("Asset: Sequence Tag Mapped", "PASS", `Tag: ${payload.data.tag}`);
  } catch (err: any) {
    logTest("Asset: Sequence Tag Mapped", "FAIL", err.message);
    process.exit(1);
  }

  // 4. ROLE-BASED ACCESS CONTROL (RBAC) ROUTE SHIELDING
  try {
    const res = await fetch(`${API_BASE}/departments`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // No token provided to test unauthorized rejection
      },
      body: JSON.stringify({ code: "BAD", name: "Intruders Dept" }),
    });
    assert.strictEqual(res.status, 401);
    logTest("Security: RBAC Unauthenticated Shielding", "PASS");
  } catch (err: any) {
    logTest("Security: RBAC Unauthenticated Shielding", "FAIL", err.message);
    process.exit(1);
  }

  // 5. DOUBLE ALLOCATION LOCK VERIFICATION
  try {
    // Perform first allocation (valid)
    const resAlloc = await fetch(`${API_BASE}/allocations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        assetId: testAssetId,
        employeeId: "dae439ec-a7d4-42f4-839e-f403070cab5a", // Developer
        expectedReturnDate: new Date(Date.now() + 86400000).toISOString(),
        notes: "Test assigned allocation",
      }),
    });
    const payloadAlloc = await resAlloc.json();
    assert.strictEqual(resAlloc.status, 210);
    testAllocationId = payloadAlloc.data.id;

    // Perform second allocation immediately (should fail double allocation constraint)
    const resDouble = await fetch(`${API_BASE}/allocations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        assetId: testAssetId,
        employeeId: "dae439ec-a7d4-42f4-839e-f403070cab5a",
      }),
    });
    const payloadDouble = await resDouble.json();
    assert.strictEqual(resDouble.status, 422);
    assert.strictEqual(payloadDouble.errors[0].code, "ASSET_002");
    logTest("Constraint: Double Allocation Prevented", "PASS");
  } catch (err: any) {
    logTest("Constraint: Double Allocation Prevented", "FAIL", err.message);
    process.exit(1);
  }

  // 6. OWNERSHIP TRANSFER CYCLE
  try {
    // 1. Submit transfer request to Jane Smith (Manager)
    const resReq = await fetch(`${API_BASE}/transfers`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        assetId: testAssetId,
        targetHolderId: "71db4991-453f-42b0-9946-ae51fa7224d2", // Jane Smith
        reason: "Integration test transfer request",
      }),
    });
    const payloadReq = await resReq.json();
    assert.strictEqual(resReq.status, 210);
    testTransferId = payloadReq.data.id;

    // 2. Approve transfer request
    const resApprove = await fetch(`${API_BASE}/transfers/${testTransferId}/approve`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: "APPROVED" }),
    });
    const payloadApprove = await resApprove.json();
    assert.strictEqual(resApprove.status, 200);
    assert.strictEqual(payloadApprove.data.status, "APPROVED");
    logTest("Workflow: Transfer Approved & Mapped", "PASS");
  } catch (err: any) {
    logTest("Workflow: Transfer Approved & Mapped", "FAIL", err.message);
    process.exit(1);
  }

  // 7. RETURN PROCESS & AUTOMATED MAINTENANCE TRIGGER
  try {
    const resReturn = await fetch(`${API_BASE}/returns`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        assetId: testAssetId,
        conditionOnReturn: "DAMAGED",
        notes: "Triggering automatic maintenance cycle via damaged return",
      }),
    });
    const payloadReturn = await resReturn.json();
    assert.strictEqual(resReturn.status, 200);
    assert.strictEqual(payloadReturn.data.status, "RETURNED");

    // Verify asset is now locked to UNDER_MAINTENANCE
    const resAsset = await fetch(`${API_BASE}/assets/${testAssetId}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const payloadAsset = await resAsset.json();
    assert.strictEqual(payloadAsset.data.status, "UNDER_MAINTENANCE");
    logTest("Workflow: Damaged Return Auto-triggered Maintenance", "PASS");
  } catch (err: any) {
    logTest("Workflow: Damaged Return Auto-triggered Maintenance", "FAIL", err.message);
    process.exit(1);
  }

  // 8. DASHBOARD STATISTICS & DATA CONGRUENCY
  try {
    const resStats = await fetch(`${API_BASE}/dashboard/stats`, {
      method: "GET",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const payloadStats = await resStats.json();
    assert.strictEqual(resStats.status, 200);
    assert.ok(payloadStats.data.assets.total > 0);
    logTest("Reports: Dashboard Statistics Compiled", "PASS");
  } catch (err: any) {
    logTest("Reports: Dashboard Statistics Compiled", "FAIL", err.message);
    process.exit(1);
  }

  console.log("\n\x1b[32m==================================================\x1b[0m");
  console.log("\x1b[32m   INTEGRATION TEST SUITE RUN COMPLETED SUCCESSFULLY \x1b[0m");
  console.log("\x1b[32m==================================================\x1b[0m\n");
  process.exit(0);
}

runTests();
