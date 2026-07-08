# Homepage Redesign ("The Resume, Extended") Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the centered "AI-template" homepage with the approved resume-sidebar layout (cream info rail + left-anchored content), and purge the uppercase-tracked role-line voice everywhere it appears (home, resume page, OG card).

**Architecture:** The shared `Base` layout gains two opt-in props (`hideHeader`, `wide`); only the homepage uses them. `index.astro`'s body is rewritten (its `<head>` extras — JSON-LD and the legacy hash-redirect script — are preserved byte-for-byte). Two one-line style fixes de-cap the resume page role line and the OG generator; both generated artifacts are re-rendered. The scraper-regression suite (`npm run verify`) must pass unchanged.

**Tech Stack:** Astro 7 (existing project), Playwright (artifact regeneration, already installed with chromium).

**Spec:** `docs/superpowers/specs/2026-07-07-homepage-redesign-design.md`

---

## File structure

```
Modify: src/layouts/Base.astro       add hideHeader/wide props (default off)
Modify: src/styles/global.css        add .container.wide width rule
Rewrite: src/pages/index.astro       sidebar + main-column homepage
Modify: src/pages/resume.astro       .resume-title de-capped (~line 105)
Modify: scripts/generate-og.mjs      subtitle de-capped (~line 15)
Regenerate: public/og.png, public/resume.pdf
```

No new files. `npm run verify` (`scripts/verify-content.mjs`) is untouched and is the acceptance gate.

---

### Task 1: `Base` layout props (`hideHeader`, `wide`)

**Files:**
- Modify: `src/layouts/Base.astro` (frontmatter lines 10–16, body lines 45–52)
- Modify: `src/styles/global.css` (after the `.container` rule, ~line 71)

- [ ] **Step 1: Update the Props interface and destructuring in `src/layouts/Base.astro`**

Replace lines 10–16:

```astro
interface Props {
  title: string;
  description: string;
  ogType?: 'website' | 'profile';
}

const { title, description, ogType = 'website' } = Astro.props;
```

with:

```astro
interface Props {
  title: string;
  description: string;
  ogType?: 'website' | 'profile';
  /** Cover pages (home) omit the global header; sidebar/CTAs carry nav. */
  hideHeader?: boolean;
  /** Widens the main container for multi-column spreads. */
  wide?: boolean;
}

const {
  title,
  description,
  ogType = 'website',
  hideHeader = false,
  wide = false,
} = Astro.props;
```

- [ ] **Step 2: Update the body markup in `src/layouts/Base.astro`**

Replace:

```astro
  <body>
    <a href="#main-content" class="skip-link mono">Skip to content</a>
    <Header />
    <main id="main-content" class="container">
      <slot />
    </main>
    <Footer />
  </body>
```

with:

```astro
  <body>
    <a href="#main-content" class="skip-link mono">Skip to content</a>
    {!hideHeader && <Header />}
    <main id="main-content" class:list={['container', { wide }]}>
      <slot />
    </main>
    <Footer />
  </body>
```

(Note: `class:list` renders `class="container wide"` when `wide` is true, `class="container"` otherwise. Astro's bare-attribute shorthand — `<Base hideHeader wide>` — passes `true`.)

- [ ] **Step 3: Add the wide-container rule to `src/styles/global.css`**

Directly after the existing `.container` block (line 71):

```css
.container.wide {
  max-width: 58rem;
}
```

- [ ] **Step 4: Verify nothing changed for existing pages**

```bash
npm run check && npm run build && npm run verify
grep -c 'site-header' dist/portfolio/index.html
```

Expected: check 0 errors; build `Complete!`; verify green (all pages still pass — no page passes the new props yet); the portfolio grep ≥ 1 (header still present everywhere).

- [ ] **Step 5: Commit**

```bash
git add src/layouts/Base.astro src/styles/global.css
git commit -m "feat: Base layout gains hideHeader and wide opt-in props"
```

---

### Task 2: Rewrite the homepage

**Files:**
- Rewrite: `src/pages/index.astro` (frontmatter and `<head>` fragment preserved verbatim; everything from `<Base …>`'s attribute list and the page body/styles replaced)

- [ ] **Step 1: Replace `src/pages/index.astro` with exactly this**

The frontmatter (imports, `about` loading, `personLd`) and the `<Fragment slot="head">` contents are IDENTICAL to the current file — do not alter them. New: the `hideHeader wide` props, the body markup, and the styles.

```astro
---
import { getCollection, render } from 'astro:content';
import { Image } from 'astro:assets';
import Base from '../layouts/Base.astro';
import { site } from '../data/site';
import headshot from '../assets/headshot.png';

const [about] = await getCollection('about');
const { Content } = await render(about);

const personLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: site.name,
  url: `${site.url}/`,
  email: `mailto:${site.email}`,
  jobTitle: 'Production Engineer',
  worksFor: { '@type': 'Organization', name: 'Lucasfilm' },
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'New York',
    addressRegion: 'NY',
  },
  sameAs: [site.github, site.linkedin],
};
---

<Base
  title={`${site.name} — ${site.tagline}`}
  description={site.description}
  ogType="profile"
  hideHeader
  wide
>
  <Fragment slot="head">
    <script type="application/ld+json" set:html={JSON.stringify(personLd)} />
    <script is:inline>
      // legacy docsify hash-route redirects (#/portfolio → /portfolio/)
      (function () {
        var map = {
          '#/portfolio': '/portfolio/',
          '#/resume': '/resume/',
          '#/contact': '/',
        };
        var target = map[location.hash.split('?')[0]];
        if (target && target !== '/') location.replace(target);
      })();
    </script>
  </Fragment>

  <div class="spread">
    <div class="intro">
      <h1>{site.name}</h1>
      <p class="mono role-line">{site.tagline}</p>
      <div class="bio">
        <Content />
      </div>
      <nav class="cta-row" aria-label="Highlights">
        <a href="/portfolio/" class="mono cta">View portfolio</a>
        <a href="/resume/" class="mono cta">Read resumé</a>
      </nav>
    </div>

    <aside class="rail" aria-label="Info and current role">
      <div class="rail-intro">
        <Image
          src={headshot}
          alt="Headshot of Ryan Dwyer"
          width={240}
          densities={[1, 2]}
          class="headshot"
          loading="eager"
        />
        <div>
          <h2 class="rail-heading">Info</h2>
          <ul class="rail-list">
            <li>New York, NY</li>
            <li><a href={`mailto:${site.email}`}>ryan@rydwy.com</a></li>
            <li><a href={site.github} rel="me noopener">GitHub</a></li>
            <li><a href={site.linkedin} rel="me noopener">LinkedIn</a></li>
          </ul>
        </div>
      </div>
      <h2 class="rail-heading">Currently</h2>
      <p class="rail-lines">
        Production Engineer,<br />
        Platform Team,<br />
        Core Pipeline,<br />
        ILM / Lucasfilm
      </p>
    </aside>
  </div>
</Base>

<style>
  .spread {
    display: flex;
    gap: var(--space-7);
    padding-top: var(--space-7);
    padding-bottom: var(--space-6);
  }
  /* The rail is second in source (h1 reads first for a11y/SEO) but sits on
     the left visually. */
  .rail {
    order: -1;
    width: 250px;
    flex-shrink: 0;
    background: var(--cream-3);
    color: var(--charcoal-2);
    padding: var(--space-6) var(--space-5);
    font-family: var(--font-mono);
  }
  .headshot {
    width: 120px;
    height: 120px;
    object-fit: cover;
    border-radius: 50%;
    margin-bottom: var(--space-2);
  }
  .rail-heading {
    font-size: 0.9rem;
    color: var(--charcoal-2);
    border-bottom: 2px solid var(--charcoal-2);
    padding-bottom: var(--space-1);
    margin: var(--space-5) 0 var(--space-2);
  }
  .rail-list {
    list-style: none;
    padding: 0;
    margin: 0;
    font-size: 0.8rem;
    line-height: 2;
  }
  .rail-lines {
    font-size: 0.8rem;
    line-height: 1.8;
    margin: 0;
  }
  .rail a {
    color: var(--charcoal-2);
    text-decoration-color: var(--cream-8);
  }
  .rail a:hover {
    color: var(--charcoal-1);
    text-decoration-color: var(--charcoal-1);
  }
  .intro {
    flex: 1;
    min-width: 0;
    padding: var(--space-5) 0;
  }
  .intro h1 {
    font-size: 2.4rem;
    margin: 0 0 var(--space-2);
  }
  .role-line {
    color: var(--text-dim);
    font-size: 0.95rem;
    margin: 0 0 var(--space-6);
  }
  .bio {
    font-size: 1.125rem;
    max-width: 54ch;
  }
  .cta-row {
    display: flex;
    gap: var(--space-4);
    flex-wrap: wrap;
    margin-top: var(--space-6);
  }
  .cta {
    display: inline-block;
    padding: var(--space-3) var(--space-5);
    border: 1px solid var(--border-hover);
    border-radius: 6px;
    background: var(--bg-panel);
    color: var(--heading);
    text-decoration: none;
    font-size: 0.9rem;
  }
  .cta:hover {
    border-color: var(--cream-8);
    background: var(--charcoal-4);
  }

  @media (max-width: 760px) {
    .spread {
      flex-direction: column;
      gap: var(--space-6);
      padding-top: var(--space-5);
    }
    /* Column layout: restore source order so the pitch precedes the rail. */
    .rail {
      order: 0;
      width: auto;
    }
    .rail-intro {
      display: flex;
      gap: var(--space-4);
      align-items: center;
    }
    .rail-intro .rail-heading {
      margin-top: 0;
    }
    .headshot {
      width: 80px;
      height: 80px;
      margin-bottom: 0;
    }
    .intro {
      padding: 0;
    }
  }
</style>
```

- [ ] **Step 2: Build and verify — the acceptance gate must stay green**

```bash
npm run check && npm run build && npm run verify
```

Expected: check 0 errors; build `Complete!`; `✓ verify-content: all raw-HTML content, meta, link, and file checks passed` (the script's home-page strings — "Ryan Dwyer", "Platform Engineer", "New York City", "Lucasfilm" — all still present).

- [ ] **Step 3: Confirm the redesign specifics in the built HTML**

```bash
grep -c 'Core Pipeline' dist/index.html          # ≥1 (new Currently block)
grep -c 'site-header' dist/index.html            # 0  (header dropped on home)
grep -c 'site-footer' dist/index.html            # ≥1 (footer kept)
grep -c 'site-header' dist/portfolio/index.html  # ≥1 (interior pages keep it)
grep -c 'location.hash' dist/index.html          # ≥1 (legacy redirect intact)
grep -c 'application/ld+json' dist/index.html    # 1  (JSON-LD intact)
grep -c 'container wide' dist/index.html         # ≥1 (wide container applied)
```

All expectations must hold; investigate any miss before committing.

- [ ] **Step 4: Eyeball desktop + mobile**

```bash
npm run dev
```

At http://localhost:4321/ check: cream rail left with headshot/Info/Currently (four lines ending "ILM / Lucasfilm"); name + normal-case role line right; no top header; footer present; buttons without arrows. Below 760px: intro first, then the cream card with headshot beside the info lines. Tab from load: skip-link appears first and jumps to content.

- [ ] **Step 5: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: homepage redesign — cream resume rail, left-anchored intro"
```

---

### Task 3: De-cap the role line on the resume page and OG card

**Files:**
- Modify: `src/pages/resume.astro:105-111`
- Modify: `scripts/generate-og.mjs:15-16`

- [ ] **Step 1: In `src/pages/resume.astro`, replace the `.resume-title` rule**

Current (lines 105–111):

```css
  .resume-title {
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.85rem;
    margin: 0;
  }
```

New:

```css
  .resume-title {
    color: var(--text-dim);
    font-size: 0.95rem;
    margin: 0;
  }
```

- [ ] **Step 2: In `scripts/generate-og.mjs`, replace the subtitle style**

Current (lines 15–16):

```css
  p  { color: #a9a9b5; font-size: 34px; margin-top: 18px;
       text-transform: uppercase; letter-spacing: 6px; }
```

New:

```css
  p  { color: #a9a9b5; font-size: 36px; margin-top: 18px; }
```

- [ ] **Step 3: Build and spot-check**

`.resume-title`'s base styles are bundled into the external CSS chunk (only the
print styles are inlined in the HTML), so check the built CSS, not the page:

```bash
npm run check && npm run build
grep -h -o '\.resume-title[^}]*}' dist/_astro/*.css
```

Expected: 0 errors, `Complete!`. The grep prints the compiled `.resume-title`
rule(s) — confirm none contain `text-transform` or `letter-spacing`. (Other
`uppercase` rules exist in the CSS for the nav links — those are deliberately
kept; only `.resume-title` matters here.)

- [ ] **Step 4: Commit**

```bash
git add src/pages/resume.astro scripts/generate-og.mjs
git commit -m "fix: normal-case role line on resume page and OG card"
```

---

### Task 4: Regenerate og.png and resume.pdf

**Files:**
- Regenerate: `public/og.png`, `public/resume.pdf`

- [ ] **Step 1: Regenerate both artifacts** (Playwright chromium is already installed from the original build)

```bash
node scripts/generate-og.mjs
npm run build && node scripts/generate-pdf.mjs
```

Expected: `✓ wrote public/og.png` then `✓ wrote public/resume.pdf`. (The build between them matters: the PDF print-renders the freshly built `/resume/`.)

- [ ] **Step 2: Confirm both actually changed and are sane**

```bash
git status --short public/
file public/og.png public/resume.pdf
```

Expected: both files listed as modified; `og.png` still `PNG image data, 1200 x 630`; `resume.pdf` still a multi-page PDF. Open `public/og.png` and confirm the subtitle reads "Platform Engineer & Creative Technologist" in normal case.

- [ ] **Step 3: Full gate**

```bash
npm run build && npm run verify
```

Expected: verify fully green.

- [ ] **Step 4: Commit**

```bash
git add public/og.png public/resume.pdf
git commit -m "chore: regenerate og card and resume PDF with normal-case role line"
```

---

### Task 5: Final verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full suite from clean**

```bash
npm run check && npm run build && npm run verify
```

Expected: 0 errors / `Complete!` / verify green.

- [ ] **Step 2: Visual regression pass**

```bash
npm run preview
```

- `/` at ~1280px: rail left, no header, footer present, role line normal case
- `/` at ~380px: intro → cream card stacking; headshot beside info lines
- `/portfolio/` and `/resume/`: completely unchanged except the resume role line's case
- Print preview on `/resume/`: cream paper layout unchanged, role line normal case

- [ ] **Step 3: Confirm the working tree is clean and history is tidy**

```bash
git status --short
git log --oneline -6
```

Expected: clean tree; the four commits from Tasks 1–4 on top of the spec commit.
