import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';
import { chromium } from 'playwright';

const PORT = 4322;
const preview = spawn('npx', ['astro', 'preview', '--port', String(PORT)], {
  stdio: 'ignore',
});

try {
  let up = false;
  for (let i = 0; i < 30 && !up; i++) {
    await sleep(500);
    up = await fetch(`http://localhost:${PORT}/resume/`)
      .then((r) => r.ok)
      .catch(() => false);
  }
  if (!up) throw new Error('astro preview never came up');

  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`http://localhost:${PORT}/resume/`, {
    waitUntil: 'networkidle',
  });
  await page.pdf({
    path: 'public/resume.pdf',
    format: 'Letter',
    printBackground: true,
    margin: { top: '0.6in', bottom: '0.6in', left: '0.7in', right: '0.7in' },
  });
  await browser.close();
  console.log('✓ wrote public/resume.pdf');
} finally {
  preview.kill();
}
