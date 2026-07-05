import { chromium } from "playwright-core";
import { existsSync } from "node:fs";

/**
 * Resolves a Chromium executable. Priority:
 *  1. CHROMIUM_EXECUTABLE env (set this on Railway/Fly, or point it at
 *     @sparticuz/chromium's extracted binary on Vercel — see README).
 *  2. Common Playwright cache locations.
 *  3. Playwright's own resolution (works after `npx playwright install chromium`).
 */
function resolveExecutable(): string | undefined {
  const candidates = [
    process.env.CHROMIUM_EXECUTABLE,
    "/opt/pw-browsers/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ].filter((p): p is string => !!p);
  return candidates.find((p) => existsSync(p));
}

/**
 * Prints the /print/<jobId> route to an A4 PDF. The page controls pagination
 * (each .doc-page is exactly one A4 page) so no headless margins are applied.
 */
export async function renderPdf(printUrl: string): Promise<Buffer> {
  const executablePath = resolveExecutable();
  const browser = await chromium.launch({
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
  });
  try {
    const page = await browser.newPage();
    await page.goto(printUrl, { waitUntil: "networkidle", timeout: 120_000 });
    await page.evaluate(() => document.fonts.ready);
    // One extra frame so object-fit images settle after fonts swap.
    await page.waitForTimeout(150);
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
