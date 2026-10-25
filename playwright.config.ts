import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 30_000,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    // E2E_BASE_URL is set by CI (Vercel preview/production URL);
    // locally it defaults to the dev server.
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:3000",
    extraHTTPHeaders: process.env.VERCEL_PROTECTION_BYPASS
      ? { "x-vercel-protection-bypass": process.env.VERCEL_PROTECTION_BYPASS }
      : {},
  },
  outputDir: "test-results/",
});
