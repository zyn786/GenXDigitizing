import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  reporter: [["html", { open: "never" }]],
  use: {
  baseURL: "http://localhost:3000",
},
webServer: {
  command: "pnpm dev",
  url: "http://localhost:3000",
  reuseExistingServer: !process.env.CI,
},
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] }
    }
  ]
});
