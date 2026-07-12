/**
 * AssetFlow ERP — Targeted Tab Screenshot Capture
 */
import { chromium } from "@playwright/test";
import path from "path";
import fs from "fs";

const BASE_URL = "http://localhost:3000";
const API_BASE = "http://localhost:4000/api/v1";
const SCREENSHOT_DIR = path.resolve(__dirname, "../../../../docs/screenshots");

if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

async function capture(page: any, name: string, delay = 1500) {
  await page.waitForTimeout(delay);
  const file = path.join(SCREENSHOT_DIR, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log(`[Screenshot] Captured: ${name}.png`);
}

async function run() {
  // Seed some assets/allocations via API first
  const resLogin = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "admin@assetflow.erp", password: "Password123" }),
  });
  const loginData = await resLogin.json();
  const token = loginData.data.accessToken;

  const [catRes, deptRes, usersRes] = await Promise.all([
    fetch(`${API_BASE}/assets/categories`, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API_BASE}/departments`, { headers: { Authorization: `Bearer ${token}` } }),
    fetch(`${API_BASE}/users`, { headers: { Authorization: `Bearer ${token}` } }),
  ]);
  const catData = await catRes.json();
  const deptData = await deptRes.json();
  const usersData = await usersRes.json();
  const categoryId = catData.data?.[0]?.id;
  const deptId = deptData.data?.[0]?.id;
  const employee = usersData.data?.find((u: any) => u.email === "employee@assetflow.erp");

  // Create test assets for screenshots
  const assetNames = [
    "Lenovo ThinkPad T14 Gen 4", "Dell XPS 15 Workstation", "MacBook Pro M3 Max",
    "HP EliteBook 840 G10", "iPad Pro 12.9 (6th Gen)", "Samsung Galaxy Tab S9",
    "Logitech MX Keys Keyboard", "LG UltraWide 34\" Monitor", "Cisco IP Phone 8811",
  ];
  const createdAssets: any[] = [];
  for (let i = 0; i < assetNames.length; i++) {
    const r = await fetch(`${API_BASE}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        name: assetNames[i],
        serialNumber: `SN-DEMO-${2000 + i}`,
        categoryId,
        departmentId: deptId,
        acquisitionDate: new Date().toISOString(),
        acquisitionCost: 1200 + i * 150,
        currentLocation: "Head Office — Floor 3",
        condition: ["NEW", "GOOD", "FAIR"][i % 3],
        sharedResource: i >= 6,
      }),
    });
    const d = await r.json();
    if (d.data?.id) createdAssets.push(d.data);
  }

  // Allocate first 3 assets
  for (let i = 0; i < 3 && i < createdAssets.length; i++) {
    if (employee?.id && createdAssets[i]?.id) {
      await fetch(`${API_BASE}/allocations`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          assetId: createdAssets[i].id,
          employeeId: employee.id,
          departmentId: deptId,
          expectedReturnDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          notes: "Assigned for remote work",
        }),
      });
    }
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: "dark",
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();

  // Login
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await capture(page, "01-login", 800);
  await page.fill('input[type="email"]', "admin@assetflow.erp");
  await page.fill('input[type="password"]', "Password123");
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2500);

  // Overview (Dashboard)
  await capture(page, "02-dashboard", 500);

  // Find and click each tab
  const tabNames = [
    { label: "Assets Inventory", file: "04-assets" },
    { label: "Reserves & Bookings", file: "06-bookings" },
    { label: "Maintenance", file: "07-maintenance" },
    { label: "Alerts Inbox", file: "10-notifications" },
  ];

  for (const { label, file } of tabNames) {
    const allButtons = await page.$$("button");
    for (const btn of allButtons) {
      const txt = await btn.textContent();
      if (txt?.trim() === label) {
        await btn.click();
        await capture(page, file, 1200);
        break;
      }
    }
  }

  // Return to Overview for an Organization modal / full page screenshot
  const overviewBtns = await page.$$("button");
  for (const btn of overviewBtns) {
    const txt = await btn.textContent();
    if (txt?.trim() === "Overview") {
      await btn.click();
      await page.waitForTimeout(800);
      break;
    }
  }

  // Look for Organization, Departments, Users modals or buttons
  const allBtns = await page.$$("button");
  for (const btn of allBtns) {
    const txt = await btn.textContent();
    if (txt?.includes("Department") || txt?.includes("Org") || txt?.includes("Organization")) {
      await btn.click();
      await capture(page, "03-organization", 1200);
      break;
    }
  }

  // Look for Audit buttons
  const auditBtns = await page.$$("button");
  for (const btn of auditBtns) {
    const txt = await btn.textContent();
    if (txt?.includes("Audit") || txt?.includes("Run Audit")) {
      await btn.click();
      await capture(page, "08-audit", 1200);
      break;
    }
  }

  // Employee login view
  const empContext = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    colorScheme: "dark",
  });
  const empPage = await empContext.newPage();
  await empPage.goto(BASE_URL, { waitUntil: "networkidle" });
  await empPage.fill('input[type="email"]', "employee@assetflow.erp");
  await empPage.fill('input[type="password"]', "Password123");
  await empPage.click('button[type="submit"]');
  await empPage.waitForTimeout(2000);
  await capture(empPage, "02-dashboard-employee", 500);
  await empContext.close();

  await browser.close();

  const files = fs.readdirSync(SCREENSHOT_DIR).filter((f) => f.endsWith(".png"));
  console.log(`\n[Screenshots] Total screenshots: ${files.length}`);
  files.forEach((f) => console.log(` - docs/screenshots/${f}`));
}

run().catch((err) => {
  console.error("[Error]", err.message);
  process.exit(1);
});
