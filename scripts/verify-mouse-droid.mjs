// Browser verification for /mouse-droid (spec §Verification.2).
// Usage: npm run build && npm run preview &  then  node scripts/verify-mouse-droid.mjs
import { chromium } from 'playwright';

const BASE = process.env.PREVIEW_URL ?? 'http://localhost:4321';
const failures = [];
const check = (ok, label) => {
  console.log(`${ok ? '✓' : '✗'} ${label}`);
  if (!ok) failures.push(label);
};

const browser = await chromium.launch();

// ── Desktop, JS on ────────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(`${BASE}/mouse-droid`, { waitUntil: 'networkidle' });
  check((await page.locator('h1').textContent()) === 'Mouse Droid', 'hero h1');

  // Reveals: sections start hidden (js class present), become visible on scroll.
  check(
    await page.evaluate(() => document.documentElement.classList.contains('js')),
    'js class set'
  );
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForFunction(() =>
    [...document.querySelectorAll('.about-reveal')].every(
      (el) => el.getAttribute('data-inview') === 'true'
    )
  );
  check(true, 'all reveals fired after scroll');

  // Feature dialog: open, Escape-close, reopen, backdrop-close.
  const featBtn = page.locator('[data-dialog-target="feature-timeline"]');
  await featBtn.scrollIntoViewIfNeeded();
  await featBtn.click();
  const featDialog = page.locator('#feature-timeline');
  check(await featDialog.evaluate((d) => d.open), 'feature dialog opens');
  check(
    await page.evaluate(() =>
      document.documentElement.classList.contains('md-dialog-open')
    ),
    'scroll locked while open'
  );
  await page.keyboard.press('Escape');
  check(await featDialog.evaluate((d) => !d.open), 'Escape closes dialog');
  check(
    await page.evaluate(
      () => !document.documentElement.classList.contains('md-dialog-open')
    ),
    'scroll unlocked after close'
  );
  await featBtn.click();
  await page.mouse.click(10, 10); // backdrop
  check(await featDialog.evaluate((d) => !d.open), 'backdrop click closes dialog');

  // Guide dialog: progress bar advances on scroll; footer button closes.
  const guideBtn = page.locator('[data-dialog-target="guide-getting-started"]');
  await guideBtn.scrollIntoViewIfNeeded();
  await guideBtn.click();
  const guideDialog = page.locator('#guide-getting-started');
  check(await guideDialog.evaluate((d) => d.open), 'guide dialog opens');
  await guideDialog
    .locator('.about-reader-shell__body')
    .evaluate((el) => el.scrollTo(0, el.scrollHeight));
  await page.waitForFunction(() => {
    const bar = document.querySelector(
      '#guide-getting-started .about-reader-shell__progress'
    );
    return bar && bar.style.transform !== 'scaleX(0)' && bar.style.transform !== '';
  });
  check(true, 'guide progress bar advances');
  await guideDialog.locator('[data-dialog-close]').click();
  check(await guideDialog.evaluate((d) => !d.open), 'footer button closes guide');
  await page.close();
}

// ── Mobile 380px ──────────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 380, height: 800 } });
  await page.goto(`${BASE}/mouse-droid`, { waitUntil: 'networkidle' });
  check(
    await page
      .locator('.about-pipe__link')
      .first()
      .evaluate((el) => getComputedStyle(el).display === 'none'),
    'pipeline connectors hidden at 380px'
  );
  check(
    await page
      .locator('.about-feat')
      .evaluate(
        (el) => getComputedStyle(el).gridTemplateColumns.split(' ').length === 2
      ),
    'feature grid is 2 columns at 380px'
  );
  await page.close();
}

// ── Reduced motion ────────────────────────────────────────────────────────────
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(`${BASE}/mouse-droid`, { waitUntil: 'networkidle' });
  check(
    await page
      .locator('.about-reveal')
      .first()
      .evaluate((el) => getComputedStyle(el).opacity === '1'),
    'reveals visible immediately under reduced motion'
  );
  await page.close();
}

// ── JS disabled ───────────────────────────────────────────────────────────────
{
  const ctx = await browser.newContext({ javaScriptEnabled: false });
  const page = await ctx.newPage();
  await page.goto(`${BASE}/mouse-droid`);
  check(
    await page
      .locator('.about-sheet--privacy')
      .evaluate((el) => getComputedStyle(el).opacity === '1'),
    'content visible without JavaScript'
  );
  check((await page.locator('dialog').count()) === 10, 'all 10 readers in static HTML');
  await ctx.close();
}

await browser.close();
if (failures.length > 0) {
  console.error(`\n✗ verify-mouse-droid: ${failures.length} failure(s)`);
  process.exit(1);
}
console.log('\n✓ verify-mouse-droid: all browser checks passed');
