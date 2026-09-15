/**
 * Browser login reproduction — run after servers are up:
 *   cd scripts && npx playwright test --config=playwright.config.js
 */
const { test, expect } = require("@playwright/test");
const { readFileSync } = require("fs");
const { resolve } = require("path");

const repoRoot = resolve(__dirname, "..");

function readDevSeedPassword() {
  const envPath = resolve(repoRoot, "backend", ".env");
  for (const line of readFileSync(envPath, "utf-8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (trimmed.startsWith("DEV_SEED_PASSWORD=")) {
      return trimmed.slice("DEV_SEED_PASSWORD=".length);
    }
  }
  throw new Error("DEV_SEED_PASSWORD not found in backend/.env");
}

test("M1 login shows OTP step after password", async ({ page }) => {
  const password = readDevSeedPassword();
  let loginRequest = null;
  let loginResponse = null;

  page.on("request", (req) => {
    if (req.url().includes("/api/v1/auth/login") && req.method() === "POST") {
      loginRequest = {
        url: req.url(),
        method: req.method(),
        origin: req.headers()["origin"],
      };
    }
  });

  page.on("response", async (res) => {
    if (res.url().includes("/api/v1/auth/login") && res.request().method() === "POST") {
      loginResponse = {
        status: res.status(),
        body: await res.text(),
      };
    }
  });

  await page.goto("http://localhost:5173/login");
  await page.getByLabel(/^email$/i).fill("renewed.member@up.edu.ph");
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole("button", { name: /log in/i }).click();

  await expect.poll(() => loginResponse, { timeout: 10000 }).not.toBeNull();

  console.log("LOGIN REQUEST:", JSON.stringify(loginRequest));
  console.log("LOGIN RESPONSE:", JSON.stringify(loginResponse));

  expect(loginRequest.url).toBe("http://localhost:8000/api/v1/auth/login");
  expect(loginResponse.status).toBe(200);
  expect(JSON.parse(loginResponse.body)).toEqual({ verification_required: true });

  await expect(page.getByLabel(/verification code/i)).toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/backend console/i)).toBeVisible();
});
