import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';

// Embed JetBrains Mono (the site's brand mono) so the headless browser doesn't
// fall back to a hairline system font. Bold weights + large sizes are what keep
// the text legible when messengers downscale the card to ~300px wide.
const font = (weight) =>
  readFileSync(
    `node_modules/@fontsource/jetbrains-mono/files/jetbrains-mono-latin-${weight}-normal.woff2`,
  ).toString('base64');

const html = `<!doctype html>
<html><head><style>
  @font-face {
    font-family: 'JetBrains Mono';
    font-weight: 700;
    src: url(data:font/woff2;base64,${font(700)}) format('woff2');
  }
  @font-face {
    font-family: 'JetBrains Mono';
    font-weight: 800;
    src: url(data:font/woff2;base64,${font(800)}) format('woff2');
  }
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: #17171a;
    display: flex; flex-direction: column; justify-content: center;
    padding: 0 96px;
    font-family: 'JetBrains Mono', monospace;
    border-bottom: 14px solid #f5f5dc;
  }
  h1 { color: #f5f5dc; font-size: 104px; font-weight: 800; letter-spacing: -2px; }
  p  { color: #c2c2ce; font-size: 40px; font-weight: 700; margin-top: 24px; }
  .url { color: #cbcb92; font-size: 32px; font-weight: 700; margin-top: 72px; letter-spacing: 2px; }
</style></head>
<body>
  <h1>Ryan Dwyer</h1>
  <p>Platform Engineer &amp; Creative Technologist</p>
  <div class="url">rydwy.com</div>
</body></html>`;

const browser = await chromium.launch();
// deviceScaleFactor 2 → 2400×1260 output; scrapers downscale from more pixels,
// which keeps glyph edges crisp at thumbnail size.
const page = await browser.newPage({
  viewport: { width: 1200, height: 630 },
  deviceScaleFactor: 2,
});
await page.setContent(html);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('✓ wrote public/og.png');
