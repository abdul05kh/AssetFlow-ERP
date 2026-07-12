import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: 0,
  workers: 1,
  reporter: "list",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    headless: true,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  // Phase 9 - Spawn servers relative toapps/web location
  webServer: [
    {
      // In CI: uses pre-built .next/ from `npm run build` (next start).
      // Locally: reuses an already-running dev server (reuseExistingServer=true).
      command: process.env.CI ? "npm run start" : "npm run dev",
      url: "http://localhost:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    },
    {
      // In CI: uses pre-built dist/main.js from `npm run build` (node dist/main.js).
      // Locally: reuses an already-running dev server (reuseExistingServer=true).
      command: process.env.CI
        ? "npm run start --prefix ../api"
        : "npm run dev --prefix ../api",
      url: "http://localhost:4000/health",
      reuseExistingServer: !process.env.CI,
      timeout: 120000,
    }
  ],
});
