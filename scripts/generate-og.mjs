import { chromium } from 'playwright';

const html = `<!doctype html>
<html><head><style>
  * { margin: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px;
    background: #17171a;
    display: flex; flex-direction: column; justify-content: center;
    padding: 0 96px;
    font-family: 'Courier New', monospace;
    border-bottom: 14px solid #f5f5dc;
  }
  h1 { color: #f5f5dc; font-size: 92px; letter-spacing: -2px; }
  p  { color: #a9a9b5; font-size: 36px; margin-top: 18px; }
  .url { color: #cbcb92; font-size: 28px; margin-top: 64px; letter-spacing: 2px; }
</style></head>
<body>
  <h1>Ryan Dwyer</h1>
  <p>Platform Engineer &amp; Creative Technologist</p>
  <div class="url">rydwy.com</div>
</body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html);
await page.screenshot({ path: 'public/og.png' });
await browser.close();
console.log('✓ wrote public/og.png');
