// Scraper-regression test: asserts site content exists in BUILT html
// (what curl/scrapers/previewers see), plus internal link/anchor checks.
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

const DIST = path.resolve('dist');
const failures = [];

// page → strings that must appear in the raw HTML
const CONTENT_CHECKS = {
  'index.html': [
    'Ryan Dwyer',
    'Platform Engineer',
    'New York City',
    'Lucasfilm',
  ],
  'portfolio/index.html': [
    'Mouse Droid',
    'Software Warehouse API &amp; Dashboard',
    'Unreal Engine Event Bus',
    'Ghost Backup Dancers',
    'Demo Controller',
    'TouchDesigner RenderStream',
    'PGM Screenshotter',
    'Status Monitor',
    'ofxXRS',
    'ScyllaDB',
  ],
  'resume/index.html': [
    'Lucasfilm',
    'Production Engineer',
    'Backend Engineer',
    'XR Studios',
    'Creative Technologist',
    'Miami University',
    'Star Wars: The Mandalorian (Season 3)',
  ],
  '404.html': ['404'],
  'mouse-droid/index.html': [
    'Your work, gently narrated.',
    'Seven ways he helps',
    'What he never sees',
    'The wellness panel', // feature doc content is statically rendered
    'Recall by meaning, not keywords', // guide doc content is statically rendered
  ],
};

// meta tags every page must carry
const META_PATTERNS = [
  /<meta name="description" content="[^"]{20,}"/,
  /<meta property="og:title" content="[^"]+"/,
  /<meta property="og:image" content="https:\/\/rydwy\.com\/og\.png"/,
  /<link rel="canonical" href="https:\/\/rydwy\.com\//,
];

// files that must exist in dist
const REQUIRED_FILES = [
  'sitemap-index.xml',
  'robots.txt',
  'og.png',
  'resume.pdf',
  'favicon.ico',
  'media/touchrender.mp4',
];

async function readPage(rel) {
  const file = path.join(DIST, rel);
  if (!existsSync(file)) {
    failures.push(`MISSING PAGE: ${rel}`);
    return null;
  }
  return readFile(file, 'utf8');
}

const pages = {};
for (const rel of Object.keys(CONTENT_CHECKS)) {
  pages[rel] = await readPage(rel);
}

for (const [rel, needles] of Object.entries(CONTENT_CHECKS)) {
  const html = pages[rel];
  if (!html) continue;
  for (const needle of needles) {
    if (!html.includes(needle)) {
      failures.push(`CONTENT: ${rel} is missing "${needle}"`);
    }
  }
  for (const pattern of META_PATTERNS) {
    if (!pattern.test(html)) {
      failures.push(`META: ${rel} fails ${pattern}`);
    }
  }
}

for (const rel of REQUIRED_FILES) {
  if (!existsSync(path.join(DIST, rel))) {
    failures.push(`MISSING FILE: ${rel}`);
  }
}

// internal link + anchor validation across all checked pages
const ANCHOR_RE = /id="([^"]+)"/g;
const HREF_RE = /href="([^"]+)"/g;
const ids = {};
for (const [rel, html] of Object.entries(pages)) {
  if (!html) continue;
  ids[rel] = new Set([...html.matchAll(ANCHOR_RE)].map((m) => m[1]));
}

function pageFor(route) {
  const clean = route.replace(/\/+$/, '');
  return clean === '' ? 'index.html' : `${clean.replace(/^\//, '')}/index.html`;
}

for (const [rel, html] of Object.entries(pages)) {
  if (!html) continue;
  for (const [, href] of html.matchAll(HREF_RE)) {
    if (/^(https?:|mailto:|tel:)/.test(href)) continue;
    const [route, anchor] = href.split('#');
    if (route && !route.startsWith('/')) continue; // relative asset urls
    const targetRel = route ? pageFor(route) : rel;
    if (route && !pages[targetRel] && !existsSync(path.join(DIST, route.replace(/^\//, '')))) {
      failures.push(`LINK: ${rel} → ${href} (no ${targetRel} or file)`);
      continue;
    }
    if (anchor && ids[targetRel] && !ids[targetRel].has(anchor)) {
      failures.push(`ANCHOR: ${rel} → ${href} (no id="${anchor}")`);
    }
  }
}

if (failures.length > 0) {
  console.error(`✗ verify-content: ${failures.length} failure(s)\n`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log('✓ verify-content: all raw-HTML content, meta, link, and file checks passed');
