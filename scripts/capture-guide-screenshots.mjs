#!/usr/bin/env node
import { chromium } from "playwright";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = "https://taptrao.com";
const OUT = join(import.meta.dirname, "..", "client", "public", "guide");
mkdirSync(OUT, { recursive: true });

(async () => {
  const browser = await chromium.launch({ headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  // Step 1: Create a session by visiting the landing page
  console.log("Creating session...");
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  // Step 2: Create a compliance check to populate data
  console.log("Running compliance check to populate data...");
  // First get reference data
  const commsRes = await page.evaluate(() => fetch("/api/commodities", { credentials: "include" }).then(r => r.json()));
  const originsRes = await page.evaluate(() => fetch("/api/origins", { credentials: "include" }).then(r => r.json()));
  const destsRes = await page.evaluate(() => fetch("/api/destinations", { credentials: "include" }).then(r => r.json()));

  const cocoa = commsRes.find(c => c.name.toLowerCase().includes("cocoa bean"));
  const ghana = originsRes.find(o => o.iso2 === "GH");
  const eu = destsRes.find(d => d.iso2 === "EU");

  if (cocoa && ghana && eu) {
    const lookupRes = await page.evaluate(
      ({ commodityId, originId, destinationId }) =>
        fetch("/api/compliance-check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ commodityId, originId, destinationId }),
        }).then(r => r.json()),
      { commodityId: cocoa.id, originId: ghana.id, destinationId: eu.id }
    );
    console.log(`  ✓ Created lookup: ${lookupRes.lookupId}`);
    var lookupId = lookupRes.lookupId;
  } else {
    console.log("  ⚠ Could not find reference data, using generic screenshots");
  }

  // Step 3: Capture screenshots
  const shots = [
    { name: "01-landing", url: "/", delay: 2000 },
    { name: "02-dashboard", url: "/dashboard", delay: 2000 },
    { name: "03-lookup-empty", url: "/lookup", delay: 1500 },
    ...(lookupId ? [
      { name: "04-results-score", url: `/lookup?lookupId=${lookupId}`, delay: 2500, scrollY: 380 },
      { name: "05-results-actions", url: `/lookup?lookupId=${lookupId}`, delay: 2500, scrollY: 900 },
      { name: "06-results-docs", url: `/lookup?lookupId=${lookupId}`, delay: 2500, scrollY: 1500 },
      { name: "07-results-bottom", url: `/lookup?lookupId=${lookupId}`, delay: 2500, scrollY: 2100 },
    ] : []),
    { name: "08-trades", url: "/trades", delay: 1500 },
    { name: "09-lc-checker", url: "/lc-check", delay: 1500 },
    { name: "10-pricing", url: "/pricing", delay: 1500 },
    { name: "11-settings", url: "/settings/profile", delay: 1500 },
    { name: "12-alerts", url: "/alerts", delay: 1500 },
    { name: "13-demurrage", url: "/demurrage", delay: 1500 },
    { name: "14-templates", url: "/templates", delay: 1500 },
  ];

  for (const shot of shots) {
    console.log(`Capturing ${shot.name}...`);
    await page.goto(`${BASE}${shot.url}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(shot.delay || 1500);
    if (shot.scrollY) {
      await page.evaluate((y) => window.scrollTo(0, y), shot.scrollY);
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: join(OUT, `${shot.name}.png`), type: "png" });
    console.log(`  ✓ Saved ${shot.name}.png`);
  }

  await browser.close();
  console.log(`\nDone! ${shots.length} screenshots saved to ${OUT}`);
})();
