/**
 * Captures real screenshots of the TapTrao platform pages
 * for use in the landing page demo section.
 *
 * Usage: node scripts/capture-demo-screenshots.mjs
 * Requires: dev server running on localhost:3000
 */
import puppeteer from 'puppeteer';
import { resolve } from 'path';

const BASE = 'http://localhost:3000';
const OUT = resolve('client/public/demo');
const TEST_EMAIL = 'demo-screenshots@taptrao.test';
const TEST_PASS = 'DemoScreenshots2026!';

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 1200, deviceScaleFactor: 2 },
  });
  const page = await browser.newPage();
  const wait = (ms) => new Promise(r => setTimeout(r, ms));

  // Dismiss cookie banner
  async function dismissCookies() {
    try {
      await page.evaluate(() => {
        const btns = document.querySelectorAll('button');
        for (const b of btns) {
          if (b.textContent.includes('Essential Only')) { b.click(); return; }
        }
      });
      await wait(300);
    } catch (_) {}
  }

  // ─── Register + Login ────────────────────────────────────
  console.log('🔐 Creating test account and logging in...');

  // Register via fetch
  try {
    const regRes = await fetch(`${BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: TEST_EMAIL, password: TEST_PASS, displayName: 'Demo User' }),
    });
    console.log('  Register:', regRes.status, regRes.statusText);
  } catch (e) {
    console.log('  Register error:', e.message);
  }

  // Login via the actual login page using Puppeteer type()
  await page.goto(`${BASE}/login`, { waitUntil: 'networkidle2' });
  await wait(1500);
  await dismissCookies();

  // Type in email field
  const emailInput = await page.$('input[type="email"], input[name="email"], input[placeholder*="email" i], input[placeholder*="company" i]');
  if (emailInput) {
    await emailInput.click({ clickCount: 3 }); // select all
    await emailInput.type(TEST_EMAIL, { delay: 20 });
    console.log('  Typed email');
  } else {
    // Try first input
    const firstInput = await page.$('input');
    if (firstInput) {
      await firstInput.click({ clickCount: 3 });
      await firstInput.type(TEST_EMAIL, { delay: 20 });
      console.log('  Typed email into first input');
    }
  }
  await wait(300);

  // Type in password field
  const passInput = await page.$('input[type="password"]');
  if (passInput) {
    await passInput.click({ clickCount: 3 });
    await passInput.type(TEST_PASS, { delay: 20 });
    console.log('  Typed password');
  }
  await wait(300);

  // Submit the login form
  await page.evaluate(() => {
    // Try submit button
    const btns = document.querySelectorAll('button');
    for (const b of btns) {
      const txt = b.textContent.trim().toLowerCase();
      if (txt === 'log in' || txt === 'login' || txt === 'sign in') {
        b.click();
        return 'clicked: ' + b.textContent;
      }
    }
    // Try form submit
    const form = document.querySelector('form');
    if (form) { form.submit(); return 'form submitted'; }
    return 'no button found';
  });
  console.log('  Submitted login form');
  await wait(4000);

  const afterLoginUrl = page.url();
  console.log('  After login, URL:', afterLoginUrl);

  // Check if we're logged in
  if (afterLoginUrl.includes('/login')) {
    console.log('  ⚠️ Login may have failed, taking screenshot of login page...');
    await page.screenshot({ path: `${OUT}/login-debug.png`, type: 'png' });
  }

  // ─── 1. Compliance Check ─────────────────────────────────
  console.log('\n📸 Capturing compliance check...');
  await page.goto(`${BASE}/lookup`, { waitUntil: 'networkidle2' });
  await wait(1500);
  await dismissCookies();

  // Fill form
  const combos = await page.$$('button[role="combobox"]');
  if (combos.length >= 3) {
    // Commodity
    await combos[0].click();
    await wait(500);
    await page.evaluate(() => {
      for (const o of document.querySelectorAll('[role="option"]')) {
        if (o.textContent.includes('Raw Cashew Nuts')) { o.click(); return; }
      }
    });
    await wait(500);

    // Origin
    const combos2 = await page.$$('button[role="combobox"]');
    await combos2[1].click();
    await wait(500);
    await page.evaluate(() => {
      for (const o of document.querySelectorAll('[role="option"]')) {
        if (o.textContent.includes("Côte d'Ivoire")) { o.click(); return; }
      }
    });
    await wait(500);

    // Destination
    const combos3 = await page.$$('button[role="combobox"]');
    await combos3[2].click();
    await wait(500);
    await page.evaluate(() => {
      for (const o of document.querySelectorAll('[role="option"]')) {
        if (o.textContent.includes("United Kingdom")) { o.click(); return; }
      }
    });
    await wait(500);

    // Click check
    await page.evaluate(() => {
      for (const b of document.querySelectorAll('button')) {
        if (b.textContent.includes('Check compliance risk')) { b.click(); return; }
      }
    });
    await wait(4000);
  }

  // Scroll to results
  await page.evaluate(() => window.scrollTo(0, 500));
  await wait(500);
  await page.screenshot({ path: `${OUT}/compliance.png`, type: 'png' });
  console.log('  ✓ compliance.png');

  // ─── 2. Trades ───────────────────────────────────────────
  console.log('📸 Capturing trades...');
  await page.goto(`${BASE}/trades`, { waitUntil: 'networkidle2' });
  await wait(2000);
  await dismissCookies();
  const tradesUrl = page.url();
  console.log('  URL:', tradesUrl);
  await page.screenshot({ path: `${OUT}/trades.png`, type: 'png' });
  console.log('  ✓ trades.png');

  // ─── 3. LC Check ─────────────────────────────────────────
  console.log('📸 Capturing LC check...');
  await page.goto(`${BASE}/lc-check`, { waitUntil: 'networkidle2' });
  await wait(2000);
  await dismissCookies();
  const lcUrl = page.url();
  console.log('  URL:', lcUrl);
  await page.screenshot({ path: `${OUT}/lc-check.png`, type: 'png' });
  console.log('  ✓ lc-check.png');

  // ─── 4. Supplier Inbox ───────────────────────────────────
  console.log('📸 Capturing supplier inbox...');
  await page.goto(`${BASE}/inbox`, { waitUntil: 'networkidle2' });
  await wait(2000);
  await dismissCookies();
  const inboxUrl = page.url();
  console.log('  URL:', inboxUrl);
  await page.screenshot({ path: `${OUT}/inbox.png`, type: 'png' });
  console.log('  ✓ inbox.png');

  await browser.close();
  console.log('\n✅ All demo screenshots captured in client/public/demo/');
}

main().catch(e => { console.error(e); process.exit(1); });
