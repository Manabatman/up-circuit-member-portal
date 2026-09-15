/**
 * Visual QA — capture screenshots for M0–M5 pages at desktop and tablet widths.
 *
 * Prerequisites:
 *   1. start-local.bat (backend :8000, frontend :5173)
 *   2. backend/.venv with dependencies
 *
 * Run:
 *   cd scripts && npx playwright test visual-qa.spec.js --config=playwright.config.js
 */
const { test, expect } = require("@playwright/test");
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const repoRoot = path.resolve(__dirname, "..");
const screenshotDir = path.join(repoRoot, "scripts", "test-results", "visual-qa");
const pythonExe = path.join(repoRoot, "backend", ".venv", "Scripts", "python.exe");

function authSession(email) {
  const raw = execFileSync(pythonExe, [path.join(__dirname, "playwright_auth.py"), email], {
    encoding: "utf-8",
    cwd: path.join(repoRoot, "backend"),
  });
  return JSON.parse(raw.trim());
}

async function injectSession(context, email) {
  const session = authSession(email);
  await context.addCookies([
    {
      name: session.cookie_name,
      value: session.cookie_value,
      domain: "localhost",
      path: "/",
      httpOnly: true,
      secure: false,
      sameSite: "Lax",
    },
  ]);
  return session;
}

async function screenshotPage(page, name) {
  const file = path.join(screenshotDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

test.describe("Visual QA — unauthenticated", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("login page desktop", async ({ page }) => {
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.goto("http://localhost:5173/login");
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();
    await screenshotPage(page, "login-desktop");
  });

  test("login page tablet", async ({ page }) => {
    fs.mkdirSync(screenshotDir, { recursive: true });
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("http://localhost:5173/login");
    await screenshotPage(page, "login-tablet");
  });
});

test.describe("Visual QA — not renewed member", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("dashboard and academic drive gate", async ({ browser }) => {
    fs.mkdirSync(screenshotDir, { recursive: true });
    const context = await browser.newContext();
    await injectSession(context, "notrenewed.member@up.edu.ph");
    const page = await context.newPage();

    await page.goto("http://localhost:5173/dashboard");
    await expect(page.getByText(/good (morning|afternoon|evening)/i)).toBeVisible();
    await screenshotPage(page, "notrenewed-dashboard");

    await page.goto("http://localhost:5173/academic-drive");
    await expect(page.getByText(/membership renewal required/i)).toBeVisible();
    await screenshotPage(page, "notrenewed-academic-drive");

    await context.close();
  });
});

test.describe("Visual QA — renewed member", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("member pages and logout modal", async ({ browser }) => {
    fs.mkdirSync(screenshotDir, { recursive: true });
    const context = await browser.newContext();
    await injectSession(context, "renewed.member@up.edu.ph");
    const page = await context.newPage();

    await page.goto("http://localhost:5173/dashboard");
    await screenshotPage(page, "renewed-dashboard");

    await page.goto("http://localhost:5173/academic-drive");
    await expect(page.getByRole("heading", { name: /academic drive/i })).toBeVisible();
    await screenshotPage(page, "renewed-academic-drive");

    await page.goto("http://localhost:5173/resources");
    await screenshotPage(page, "renewed-resources");

    await page.goto("http://localhost:5173/calendar");
    await expect(page.getByRole("heading", { name: /calendar/i })).toBeVisible();
    await screenshotPage(page, "renewed-calendar");

    await page.goto("http://localhost:5173/projects");
    await expect(page.getByRole("heading", { name: /projects/i })).toBeVisible();
    await screenshotPage(page, "renewed-projects");

    await page.goto("http://localhost:5173/projects/squeeeze");
    await expect(page.getByRole("heading", { name: /squEEEze/i })).toBeVisible();
    await screenshotPage(page, "renewed-squeeeze-workspace");

    await page.goto("http://localhost:5173/divisions");
    await expect(page.getByRole("heading", { name: /divisions/i })).toBeVisible();
    await screenshotPage(page, "renewed-divisions");

    await page.goto("http://localhost:5173/directory");
    await screenshotPage(page, "renewed-directory");

    await page.goto("http://localhost:5173/account");
    await page.getByRole("button", { name: /log out of account/i }).click();
    await expect(page.getByRole("dialog")).toBeVisible();
    await screenshotPage(page, "renewed-logout-modal");

    await page.getByRole("button", { name: /^log out$/i }).last().click();
    await page.waitForURL("**/login");
    await expect(page.getByRole("button", { name: /log in/i })).toBeVisible();

    await context.close();
  });
});

test.describe("Visual QA — renewals admin", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("membership admin", async ({ browser }) => {
    fs.mkdirSync(screenshotDir, { recursive: true });
    const context = await browser.newContext();
    await injectSession(context, "renewals.admin@up.edu.ph");
    const page = await context.newPage();

    await page.goto("http://localhost:5173/admin/members");
    await expect(page.getByText(/admin — membership/i)).toBeVisible();
    await screenshotPage(page, "renewals-admin-members");

    await context.close();
  });
});

test.describe("Visual QA — academic admin", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("resource admin without membership nav", async ({ browser }) => {
    fs.mkdirSync(screenshotDir, { recursive: true });
    const context = await browser.newContext();
    await injectSession(context, "academic.admin@up.edu.ph");
    const page = await context.newPage();

    await page.goto("http://localhost:5173/admin/resources");
    await expect(page.getByText(/admin — resources/i)).toBeVisible();
    await screenshotPage(page, "academic-admin-resources");

    await expect(page.getByRole("link", { name: /^membership$/i })).toHaveCount(0);

    await context.close();
  });
});

test.describe("Visual QA — super admin", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("both admin sections", async ({ browser }) => {
    fs.mkdirSync(screenshotDir, { recursive: true });
    const context = await browser.newContext();
    await injectSession(context, "super.admin@up.edu.ph");
    const page = await context.newPage();

    await page.goto("http://localhost:5173/admin/resources");
    await screenshotPage(page, "super-admin-resources");

    await page.goto("http://localhost:5173/admin/members");
    await screenshotPage(page, "super-admin-members");

    await context.close();
  });
});
