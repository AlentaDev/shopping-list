import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "e2e",
  reporter: "html",
  use: {
    baseURL: "http://127.0.0.1:5173",
    screenshot: "only-on-failure",
  },
  webServer: [
    {
      command: "pnpm tsx watch src/server.ts",
      cwd: "apps/api",
      url: "http://127.0.0.1:3000",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
      env: {
        PORT: "3000",
        NODE_ENV: "test",
        CATALOG_PROVIDER: "test",
      },
    },
    {
      command: "pnpm dev -- --host 0.0.0.0 --port 5173",
      cwd: "apps/web",
      url: "http://127.0.0.1:5173",
      reuseExistingServer: !process.env.CI,
      timeout: 120_000,
    },
  ],
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
