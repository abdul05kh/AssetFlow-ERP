import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    // Explicit IPv4 — Node 18+ resolves 'localhost' to ::1 (IPv6) on some systems.
    baseURL: "http://127.0.0.1:3000",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: [
    {
      // Force port 3000 with -p flag so Next.js ignores the PORT env var.
      // PORT=4000 is set globally in CI for the API; without -p 3000 Next.js
      // would bind on 4000 and collide with the API server.
      command: process.env.CI ? "npm run start -- -p 3000" : "npm run dev -- -p 3000",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      // API reads PORT=4000 from env — no explicit flag needed.
      command: process.env.CI
        ? "npm run start --prefix ../api"
        : "npm run dev --prefix ../api",
      // Explicit IPv4 probe — avoids ECONNREFUSED ::1:4000 on Node 18+.
      url: "http://127.0.0.1:4000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
  ],
});


