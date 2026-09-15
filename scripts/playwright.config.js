import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: ".",
  testMatch: ["browser-login.spec.js", "visual-qa.spec.js"],
  timeout: 60000,
  use: {
    headless: true,
  },
});
