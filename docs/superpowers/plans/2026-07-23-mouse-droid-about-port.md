# Mouse Droid About Page Port — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduce Mouse Droid's in-app About page as a faithful, static, zero-dependency exhibit at `https://rydwy.com/mouse-droid`, linked from the Mouse Droid portfolio entry.

**Architecture:** Six Astro components (one per "sheet") render the page statically inside the existing Base layout. All copy lives in one data module transcribed verbatim from the app; the ten feature/guide markdown docs are rendered to HTML at build time and pre-placed inside native `<dialog>` readers. ~60 lines of vanilla JS add scroll reveals and dialog behavior; content is fully visible without JS.

**Tech Stack:** Astro 7 (static output), plain CSS ported from the app, native `<dialog>`, IntersectionObserver, Playwright (already a devDependency) for browser verification.

**Spec:** `docs/superpowers/specs/2026-07-23-mouse-droid-about-port-design.md`

## Global Constraints

- **No new npm dependencies.** Do not add packages. Do not use the existing React/Radix deps for this feature.
- **Copy is verbatim.** All user-visible strings come from the app's `content.tsx` and markdown docs unchanged. No rewording, no trimming.
- **The app repo is read-only.** Source root: `/Users/rdwyer/projects/mouse-droid` (also symlinked at `new-portfolio-items/mouse-droid`, which is gitignored). Never modify anything there.
- **Dark presentation pinned.** App variables defined locally: `--md-surface: #0d0d0f`, `--md-surface-raised: #161619`, `--md-border: #232327`, `--score-good: #5fd38a`, `--score-bad: #e06c6c`.
- **`git add` explicit paths only — never `git add -A` or `git add .`.** The working tree contains unrelated uncommitted changes (new/renumbered portfolio entries, `.gitignore`) that the user will commit separately. Exception: Task 7 deliberately commits `src/content/projects/mouse-droid.md` (currently untracked) because the plan modifies it and the verify script starts asserting its title.
- **Do not push.** Pushing `main` triggers the deploy workflow. Commit locally only.
- **Commit message trailer** on every commit: `Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>`.
- **Verification gates:** `npm run check` (typecheck), `npm run build`, `npm run verify` (scraper-regression; requires a fresh build). CI runs all three on push.
- Known pre-existing state: `npm run check` and `npm run build` pass on the current working tree (verified 2026-07-23). If a gate fails, the failure is from your change.

---

### Task 1: Vendor the markdown docs and avatar

**Files:**
- Create: `src/data/mouse-droid/features/{timeline,chat,summary,reports,wellness,brain,memory}.md` (7 files)
- Create: `src/data/mouse-droid/guides/{getting-started,migrating,memory-palace}.md` (3 files)
- Create: `src/assets/mouse-droid-avatar.png`

**Interfaces:**
- Consumes: the app repo's `src/views/about/markdown/` and `src/assets/mouse-droid-avatar.png`.
- Produces: markdown files whose **basenames equal the feature/guide `id`s** used in Task 2's data module (`timeline`, `chat`, `summary`, `reports`, `wellness`, `brain`, `memory`, `getting-started`, `migrating`, `memory-palace`). Later tasks glob them via `import.meta.glob('../../data/mouse-droid/features/*.md')`. The docs have no frontmatter and use plain GFM (verified: no callouts, no wiki-links).

- [ ] **Step 1: Copy the files**

```bash
cd /Users/rdwyer/projects/rydwy.com
mkdir -p src/data/mouse-droid/features src/data/mouse-droid/guides
cp /Users/rdwyer/projects/mouse-droid/src/views/about/markdown/features/*.md src/data/mouse-droid/features/
cp /Users/rdwyer/projects/mouse-droid/src/views/about/markdown/guides/*.md src/data/mouse-droid/guides/
cp /Users/rdwyer/projects/mouse-droid/src/assets/mouse-droid-avatar.png src/assets/mouse-droid-avatar.png
```

- [ ] **Step 2: Verify byte-identical copies**

```bash
diff -r /Users/rdwyer/projects/mouse-droid/src/views/about/markdown/features src/data/mouse-droid/features \
  && diff -r /Users/rdwyer/projects/mouse-droid/src/views/about/markdown/guides src/data/mouse-droid/guides \
  && cmp /Users/rdwyer/projects/mouse-droid/src/assets/mouse-droid-avatar.png src/assets/mouse-droid-avatar.png \
  && ls src/data/mouse-droid/features | wc -l && ls src/data/mouse-droid/guides | wc -l
```

Expected: no diff/cmp output, then `7` and `3`.

- [ ] **Step 3: Verify the build is unaffected** (files are outside `src/content/`, so content collections must not pick them up)

Run: `npm run build`
Expected: `[build] Complete!` with no new warnings about collections.

- [ ] **Step 4: Commit**

```bash
git add src/data/mouse-droid src/assets/mouse-droid-avatar.png
git commit -m "feat: vendor Mouse Droid About docs and avatar

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 2: Data module and icon set

**Files:**
- Create: `src/data/mouse-droid-about.ts`
- Create: `src/components/mouse-droid/AboutIcons.astro`

**Interfaces:**
- Consumes: nothing from other tasks.
- Produces:
  - `src/data/mouse-droid-about.ts` exports: `type AboutIconName` (15-name union), `type Feature { id: string; icon: AboutIconName; name: string; blurb: string }`, `type PipelineStep { id: string; icon: AboutIconName; title: string; sub: string }`, `type Guide { id: string; icon: AboutIconName; title: string; blurb: string; category: string; readMinutes: number }`, and consts `aboutHero`, `aboutPitch`, `featureTour`, `features: Feature[]` (7), `howItWorks`, `pipeline: PipelineStep[]` (5), `privacy`, `guidesSection`, `guides: Guide[]` (3).
  - `AboutIcons.astro` default-export component with props `{ name: AboutIconName; size?: number }` (size defaults 24), rendering a stroked 24×24 `currentColor` SVG.

- [ ] **Step 1: Write `src/data/mouse-droid-about.ts`** (transcribed verbatim from the app's `src/views/about/content.tsx`; markdown imports replaced by the id↔filename convention; the app's unused `connections` block omitted — the app's PrivacySheet never renders it)

```ts
// All copy for the /mouse-droid page, transcribed verbatim from the Mouse
// Droid app's src/views/about/content.tsx. Do not reword here — this file
// mirrors the app. Feature/guide `id`s double as markdown doc basenames in
// src/data/mouse-droid/{features,guides}/.
// (content.tsx also defines a `connections` block that the app's About page
// never renders; it is omitted here.)

export type AboutIconName =
  | 'timeline'
  | 'chat'
  | 'summary'
  | 'reports'
  | 'wellness'
  | 'brain'
  | 'eye'
  | 'ingest'
  | 'database'
  | 'cpu'
  | 'monitor'
  | 'rocket'
  | 'migrate'
  | 'palace'
  | 'shield';

export type Feature = {
  id: string;
  icon: AboutIconName;
  name: string;
  blurb: string;
};
export type PipelineStep = {
  id: string;
  icon: AboutIconName;
  title: string;
  sub: string;
};
export type Guide = {
  id: string;
  icon: AboutIconName;
  title: string;
  blurb: string;
  category: string;
  readMinutes: number;
};

// ── Hero (droid-narrated, first person) ──────────────────────────────────────
export const aboutHero = {
  name: 'Mouse Droid',
  narratedIntro:
    'Oh — hello. I watch your window titles, never your keystrokes, and quietly turn ' +
    'your workday into a timeline, a second brain, and the occasional reminder to stand up.',
  tagline: 'Your work, gently narrated.',
};

// ── The pitch ────────────────────────────────────────────────────────────────
export const aboutPitch = {
  kicker: 'What you get',
  heading: 'A few quiet signals become a second brain.',
  lead:
    "Mouse Droid samples just three things every few seconds — the app you're in, its " +
    'window title, and the time — then hands them to a capable LLM that narrates your day. ' +
    'No screen reading. No keylogging.',
  transform: {
    signals: ['app: Terminal', 'title: mouse-droid · main', 'time: 2:14pm'],
    outcome: '"Worked on Mouse Droid for 40m"',
  },
};

// ── Feature tour ─────────────────────────────────────────────────────────────
export const featureTour = {
  kicker: 'Seven ways he helps',
  heading: 'Everything Mouse Droid does',
};

export const features: Feature[] = [
  {
    id: 'timeline',
    icon: 'timeline',
    name: 'Timeline',
    blurb: 'Day & month views of your app usage, grouped into sessions and projects.',
  },
  {
    id: 'chat',
    icon: 'chat',
    name: 'Chat',
    blurb: 'An assistant grounded in your recent activity and your vault.',
  },
  {
    id: 'summary',
    icon: 'summary',
    name: 'Active summary',
    blurb: 'A rolling "here\'s what you\'re doing right now."',
  },
  {
    id: 'reports',
    icon: 'reports',
    name: 'Reports',
    blurb:
      'A daily prose recap and an exec "Top 5 Things" status — grounded in your Memory vault (project hub, session logs, related notes), with recent activity as supporting evidence.',
  },
  {
    id: 'wellness',
    icon: 'wellness',
    name: 'Wellness',
    blurb: 'Desk-time & break detection, gentle nudges, a wellness score.',
  },
  {
    id: 'brain',
    icon: 'brain',
    name: 'Second brain',
    blurb: 'Your day, narrated into Obsidian with provenance.',
  },
  {
    id: 'memory',
    icon: 'palace',
    name: 'Memory',
    blurb: 'Read your whole vault in the app — links, backlinks, graph, and search.',
  },
];

// ── How it works ─────────────────────────────────────────────────────────────
export const howItWorks = {
  kicker: 'Under the quiet',
  heading: 'From a window title to a memory',
  insightText:
    'Window titles are surprisingly rich. Your terminal puts the project dir & git branch ' +
    'there; your mail client puts the meeting subject there; your browser puts the page title there.',
  exampleLabel: 'Terminal',
  exampleTitle: 'rdwyer@mac: ~/projects/mouse-droid (main ✱)',
};

export const pipeline: PipelineStep[] = [
  { id: 'capture', icon: 'eye', title: 'Capture', sub: 'Swift helper' },
  { id: 'ingest', icon: 'ingest', title: 'Ingest', sub: 'normalize' },
  { id: 'store', icon: 'database', title: 'Store', sub: 'SQLite' },
  { id: 'brain', icon: 'cpu', title: 'Brain', sub: 'LLM + MCP' },
  { id: 'you', icon: 'monitor', title: 'You', sub: 'the app' },
];

// ── Privacy ──────────────────────────────────────────────────────────────────
export const privacy = {
  kicker: 'By design',
  heading: 'What he never sees',
  neverItems: ['No keystroke logging', 'No screenshots, ever'],
  alwaysItems: [
    'All activity stays local (SQLite)',
    'Only your LiteLLM endpoint & your Obsidian vault',
    'Connections opt-in, read-only by default (Jira issues, Google Calendar meetings — off by default; Jira writes need per-action approval)',
  ],
  captureDepth: 'app name · window title · URL · timing · idle (on/off)',
};

// ── Guides ───────────────────────────────────────────────────────────────────
export const guidesSection = {
  kicker: 'Go deeper',
  heading: 'Guides & walkthroughs',
  lead: 'Longer, targeted how-tos. Open one and it reads in a focused pane over the page.',
};

export const guides: Guide[] = [
  {
    id: 'getting-started',
    icon: 'rocket',
    title: 'Getting Started',
    blurb: 'From first launch to your first narrated day.',
    category: 'Setup',
    readMinutes: 8,
  },
  {
    id: 'migrating',
    icon: 'migrate',
    title: 'Migrating existing notes',
    blurb: 'Bring an existing project & notes into Mouse Droid cleanly.',
    category: 'Workflow',
    readMinutes: 12,
  },
  {
    id: 'memory-palace',
    icon: 'palace',
    title: 'Mastering the Memory Palace',
    blurb: 'Get the most out of recall, hubs, and provenance.',
    category: 'Power user',
    readMinutes: 15,
  },
];
```

- [ ] **Step 2: Write `src/components/mouse-droid/AboutIcons.astro`** (glyph bodies verbatim from the app's `AboutIcons.tsx`)

```astro
---
// Bespoke About icon set, ported from the Mouse Droid app's AboutIcons.tsx.
// Glyphs are drawn on a 24×24 grid, stroked only, themed via currentColor.
import type { AboutIconName } from '../../data/mouse-droid-about';

interface Props {
  name: AboutIconName;
  size?: number;
}
const { name, size = 24 } = Astro.props;

const glyphs: Record<AboutIconName, string> = {
  timeline:
    '<circle cx="4.5" cy="7" r="1.4"/><line x1="8" y1="7" x2="20" y2="7"/><circle cx="4.5" cy="12" r="1.4"/><line x1="8" y1="12" x2="16" y2="12"/><circle cx="4.5" cy="17" r="1.4"/><line x1="8" y1="17" x2="18.5" y2="17"/>',
  chat: '<path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-8l-4.2 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z"/><circle cx="9" cy="10.5" r="1"/><circle cx="12.5" cy="10.5" r="1"/><circle cx="16" cy="10.5" r="1"/>',
  summary:
    '<path d="M12 3c.4 4.2 1.6 5.6 5.8 6.2-4.2.6-5.4 2-5.8 6.2-.4-4.2-1.6-5.6-5.8-6.2C10.4 8.6 11.6 7.2 12 3z"/><path d="M18.5 14.5c.2 1.8.7 2.4 2.5 2.7-1.8.3-2.3.9-2.5 2.7-.2-1.8-.7-2.4-2.5-2.7 1.8-.3 2.3-.9 2.5-2.7z"/>',
  reports:
    '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/><line x1="9.5" y1="12" x2="15.5" y2="12"/><line x1="9.5" y1="15.5" x2="15.5" y2="15.5"/>',
  wellness:
    '<path d="M12 21v-9"/><path d="M12 12c0-4 2.8-6.2 6.5-6.2C18.5 9.6 15.8 12 12 12z"/><path d="M12 15c0-3-2.2-4.8-5-4.8C7 13 9.4 15 12 15z"/>',
  brain:
    '<circle cx="6.5" cy="7.5" r="2.2"/><circle cx="17.5" cy="9" r="2.2"/><circle cx="11" cy="17" r="2.2"/><line x1="8.4" y1="8.6" x2="15.6" y2="8.4"/><line x1="7.6" y1="9.4" x2="10.2" y2="15"/><line x1="16.3" y1="10.9" x2="12.2" y2="15.4"/>',
  eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.6"/>',
  ingest: '<path d="M4 5h16l-6 7v5l-4 2v-7z"/>',
  database:
    '<ellipse cx="12" cy="6" rx="7" ry="2.8"/><path d="M5 6v12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8V6"/><path d="M5 12c0 1.5 3.1 2.8 7 2.8s7-1.3 7-2.8"/>',
  cpu: '<rect x="6" y="6" width="12" height="12" rx="2"/><rect x="9.5" y="9.5" width="5" height="5" rx="1"/><line x1="9" y1="3.5" x2="9" y2="6"/><line x1="15" y1="3.5" x2="15" y2="6"/><line x1="9" y1="18" x2="9" y2="20.5"/><line x1="15" y1="18" x2="15" y2="20.5"/><line x1="3.5" y1="9" x2="6" y2="9"/><line x1="3.5" y1="15" x2="6" y2="15"/><line x1="18" y1="9" x2="20.5" y2="9"/><line x1="18" y1="15" x2="20.5" y2="15"/>',
  monitor:
    '<rect x="3" y="4" width="18" height="12" rx="2"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="16" x2="12" y2="20"/>',
  rocket:
    '<path d="M12 3c3 1.5 5 4.5 5 8 0 2-0.6 3.7-1.6 5H8.6C7.6 14.7 7 13 7 11c0-3.5 2-6.5 5-8z"/><circle cx="12" cy="10" r="1.6"/><path d="M8.6 16c-1.4.6-2.4 2-2.6 4 2-.2 3.4-1.2 4-2.6M15.4 16c1.4.6 2.4 2 2.6 4-2-.2-3.4-1.2-4-2.6"/>',
  migrate:
    '<path d="M3 7l5-3 5 3v6l-5 3-5-3z"/><line x1="13" y1="10" x2="21" y2="10"/><path d="M18 7l3 3-3 3"/>',
  palace:
    '<path d="M4 9l8-4 8 4"/><line x1="4" y1="9" x2="20" y2="9"/><line x1="7" y1="9" x2="7" y2="18"/><line x1="12" y1="9" x2="12" y2="18"/><line x1="17" y1="9" x2="17" y2="18"/><line x1="3.5" y1="18" x2="20.5" y2="18"/>',
  shield:
    '<path d="M12 3l7 2.5V11c0 4.6-3 8-7 9.4C8 19 5 15.6 5 11V5.5z"/><path d="M9 11.5l2 2 4-4"/>',
};
---

<svg
  width={size}
  height={size}
  viewBox="0 0 24 24"
  fill="none"
  stroke="currentColor"
  stroke-width="1.5"
  stroke-linecap="round"
  stroke-linejoin="round"
  aria-hidden="true"
  focusable="false"
  data-icon={name}
  set:html={glyphs[name]}
/>
```

- [ ] **Step 3: Typecheck**

Run: `npm run check`
Expected: `0 errors` (warnings/hints about unused exports are acceptable; the consts are consumed from Task 4 on).

- [ ] **Step 4: Commit**

```bash
git add src/data/mouse-droid-about.ts src/components/mouse-droid/AboutIcons.astro
git commit -m "feat: Mouse Droid About copy data module and icon set

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 3: Port the stylesheet

**Files:**
- Create: `src/styles/mouse-droid-about.css` (copied from the app, then 5 exact edits)

**Interfaces:**
- Consumes: nothing.
- Produces: all `.about-*` classes used by Tasks 4–6, including: `.about-root`, `.about-sheet` + `--hero/--pitch/--features/--how/--privacy/--guides` variants, `.about-kicker/.about-h2/.about-lead`, `.js .about-reveal` gating, `.about-hero__*`, `.about-transform/.about-signal/.about-arrow/.about-outcome`, `.about-feat/.about-ft*/.about-ic`, `.about-pipe*/.about-insight*`, `.about-priv*/.about-shield`, `.about-guides/.about-gd*`, `dialog.about-reader-shell` + `__progress/__head/__icon/__text/__top/__eyebrow/__meta/__title/__deck/__body/__measure/__foot/__close`, `.about-md` markdown typography, `html.md-dialog-open` scroll lock, and the `--reader-width` custom property consumed via `style` attr.

- [ ] **Step 1: Copy the app stylesheet**

```bash
cp /Users/rdwyer/projects/mouse-droid/src/views/about/About.css src/styles/mouse-droid-about.css
```

- [ ] **Step 2: Edit — define the app theme variables locally.** In `src/styles/mouse-droid-about.css`, replace:

```css
.about-root {
  --about-gold: #e3c878;
  --about-gold-deep: #b8893a;
  --about-ink: #ece9e2;
  --about-muted: #8a8780;
```

with:

```css
.about-root {
  --about-gold: #e3c878;
  --about-gold-deep: #b8893a;
  --about-ink: #ece9e2;
  --about-muted: #8a8780;
  /* App theme values (Mouse Droid src/design-system/theme.css), pinned dark. */
  --md-surface: #0d0d0f;
  --md-surface-raised: #161619;
  --md-border: #232327;
  --score-good: #5fd38a;
  --score-bad: #e06c6c;
```

- [ ] **Step 3: Edit — gate reveals behind the `js` class** (content must be visible without JavaScript). Replace:

```css
.about-reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.about-reveal[data-inview="true"] {
  opacity: 1;
  transform: none;
}
```

with:

```css
.js .about-reveal {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.6s ease, transform 0.6s ease;
}
.js .about-reveal[data-inview="true"] {
  opacity: 1;
  transform: none;
}
```

(The `prefers-reduced-motion` block later in the file keeps its `.about-reveal { opacity: 1 !important; ... }` rule unchanged — `!important` beats the `.js` gating, which is the intent.)

- [ ] **Step 4: Edit — rename the reader markdown scope.** The app renders markdown under `.md-markdown`; ours renders under `.about-md`:

```bash
sed -i '' 's/\.md-markdown/.about-md/g' src/styles/mouse-droid-about.css
grep -c 'md-markdown' src/styles/mouse-droid-about.css; grep -q 'about-md' src/styles/mouse-droid-about.css && echo "renamed"
```

Expected: `0` then `renamed` (every occurrence renamed, none left behind).

- [ ] **Step 5: Edit — re-target the reader shell from Radix to native `<dialog>`.** Replace:

```css
.about-reader-shell.rt-DialogContent {
  padding: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  max-height: 78vh;
  border-radius: 16px;
}
.about-reader-shell--tall.rt-DialogContent {
  max-height: 84vh;
}
```

with:

```css
dialog.about-reader-shell {
  padding: 0;
  overflow: hidden;
  max-height: 78vh;
  border-radius: 16px;
  border: 1px solid var(--md-border);
  background: var(--md-surface-raised);
  color: var(--about-ink);
  width: min(var(--reader-width, 560px), calc(100vw - 32px));
  margin: auto;
  box-shadow: 0 24px 60px -24px rgba(0, 0, 0, 0.9);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}
dialog.about-reader-shell[open] {
  display: flex;
  flex-direction: column;
}
dialog.about-reader-shell--tall {
  max-height: 84vh;
}
dialog.about-reader-shell::backdrop {
  background: rgba(0, 0, 0, 0.65);
}
html.md-dialog-open {
  overflow: hidden;
}
.about-reader-shell__close {
  font: inherit;
  font-size: 13px;
  font-weight: 600;
  color: var(--about-ink);
  background: rgba(236, 233, 226, 0.08);
  border: 1px solid var(--md-border);
  border-radius: 8px;
  padding: 7px 14px;
  cursor: pointer;
}
.about-reader-shell__close:hover {
  background: rgba(236, 233, 226, 0.14);
}
.about-reader-shell__close:focus-visible {
  outline: 2px solid var(--about-gold);
  outline-offset: 2px;
}
```

(The explicit `font-family` repeats `.about-root`'s stack because `<dialog>` renders in the top layer but inherits from its DOM parent — it does inherit, but being explicit keeps the reader correct even if a dialog is ever moved outside `.about-root`.)

Then replace the Radix heading selector:

```css
.about-reader-shell__title.rt-Heading {
```

with:

```css
.about-reader-shell__title {
```

- [ ] **Step 6: Verify no Radix residue and the build is clean**

```bash
grep -c 'rt-' src/styles/mouse-droid-about.css
npm run build
```

Expected: `0`, then `[build] Complete!` (the stylesheet is not imported yet; this catches CSS syntax errors once Task 4 imports it — rerun there too).

- [ ] **Step 7: Commit**

```bash
git add src/styles/mouse-droid-about.css
git commit -m "feat: port Mouse Droid About stylesheet to native dialog

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 4: Page shell, four static sheets, and behavior scripts

**Files:**
- Create: `src/components/mouse-droid/AboutHero.astro`
- Create: `src/components/mouse-droid/AboutPitch.astro`
- Create: `src/components/mouse-droid/AboutHowItWorks.astro`
- Create: `src/components/mouse-droid/AboutPrivacy.astro`
- Create: `src/pages/mouse-droid.astro`

**Interfaces:**
- Consumes: Task 2's data module exports and `AboutIcons.astro` (`<AboutIcon name size?>`); Task 3's classes.
- Produces: the `/mouse-droid` route; the page-level JS contracts used by Tasks 5–6: any `<button data-dialog-target="ID">` opens `<dialog id="ID">`; any element with `data-dialog-close` inside a dialog closes it; a `.about-reader-shell__progress` bar inside a dialog is driven by scrolling that dialog's `.about-reader-shell__body`. Sheet order after Tasks 5–6 must be Hero, Pitch, Features, HowItWorks, Privacy, Guides.

- [ ] **Step 1: Write `src/components/mouse-droid/AboutHero.astro`**

```astro
---
import { aboutHero } from '../../data/mouse-droid-about';
import avatar from '../../assets/mouse-droid-avatar.png';
---

<section class="about-sheet about-sheet--hero">
  <div class="about-hero">
    <div class="about-hero__avatar">
      <img src={avatar.src} alt="" aria-hidden="true" width="66" height="66" />
    </div>
    <h1>{aboutHero.name}</h1>
    <p class="about-hero__said">
      <span class="about-hero__q">"</span>{aboutHero.narratedIntro}<span
        class="about-hero__q">"</span>
    </p>
  </div>
</section>
```

- [ ] **Step 2: Write `src/components/mouse-droid/AboutPitch.astro`**

```astro
---
import { aboutPitch } from '../../data/mouse-droid-about';
---

<section class="about-sheet about-sheet--pitch about-reveal">
  <div class="about-kicker">{aboutPitch.kicker}</div>
  <h2 class="about-h2">{aboutPitch.heading}</h2>
  <p class="about-lead">{aboutPitch.lead}</p>
  <div class="about-transform">
    {aboutPitch.transform.signals.map((s) => <span class="about-signal">{s}</span>)}
    <span class="about-arrow" aria-hidden="true">→</span>
    <span class="about-outcome">{aboutPitch.transform.outcome}</span>
  </div>
</section>
```

- [ ] **Step 3: Write `src/components/mouse-droid/AboutHowItWorks.astro`**

```astro
---
import { howItWorks, pipeline } from '../../data/mouse-droid-about';
import AboutIcon from './AboutIcons.astro';
---

<section class="about-sheet about-sheet--how about-reveal">
  <div class="about-kicker">{howItWorks.kicker}</div>
  <h2 class="about-h2">{howItWorks.heading}</h2>
  <div class="about-pipe">
    {
      pipeline.map((step, i) => (
        <>
          <div class="about-pipe__node">
            <span class="about-pipe__ic">
              <AboutIcon name={step.icon} size={20} />
            </span>
            <span class="about-pipe__t">{step.title}</span>
            <span class="about-pipe__s">{step.sub}</span>
          </div>
          {i < pipeline.length - 1 && <span class="about-pipe__link" aria-hidden="true" />}
        </>
      ))
    }
  </div>
  <div class="about-insight">
    <p class="about-insight__t">{howItWorks.insightText}</p>
    <p class="about-insight__ex">
      {howItWorks.exampleLabel} — <b>{howItWorks.exampleTitle}</b>
    </p>
  </div>
</section>
```

- [ ] **Step 4: Write `src/components/mouse-droid/AboutPrivacy.astro`** (shield SVG verbatim from the app's PrivacySheet; note the app's PrivacySheet does not render the `connections` copy — mirror that)

```astro
---
import { privacy } from '../../data/mouse-droid-about';
---

<section class="about-sheet about-sheet--privacy about-reveal">
  <div class="about-kicker">{privacy.kicker}</div>
  <h2 class="about-h2">{privacy.heading}</h2>
  <div class="about-priv">
    <svg
      class="about-shield"
      width="100"
      height="118"
      viewBox="0 0 92 108"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M46 4 L84 18 V52 C84 78 67 96 46 104 C25 96 8 78 8 52 V18 Z"
        fill="rgba(95,211,138,.06)"
        stroke="#5fd38a"
        stroke-width="1.5"></path>
      <path
        d="M32 54 l10 10 l20 -22"
        stroke="#5fd38a"
        stroke-width="3"
        fill="none"
        stroke-linecap="round"
        stroke-linejoin="round"></path>
    </svg>
    <ul class="about-priv__list">
      {
        privacy.neverItems.map((t) => (
          <li>
            <span class="about-priv__x" aria-hidden="true">
              ✕
            </span>{' '}
            {t}
          </li>
        ))
      }
      {
        privacy.alwaysItems.map((t) => (
          <li>
            <span class="about-priv__ok" aria-hidden="true">
              ✓
            </span>{' '}
            {t}
          </li>
        ))
      }
      <li class="about-priv__cap">
        Captures only: <b>{privacy.captureDepth}</b>
      </li>
    </ul>
  </div>
</section>
```

- [ ] **Step 5: Write `src/pages/mouse-droid.astro`** (Features/Guides imports and elements are added by Tasks 5–6)

```astro
---
import Base from '../layouts/Base.astro';
import { site } from '../data/site';
import AboutHero from '../components/mouse-droid/AboutHero.astro';
import AboutPitch from '../components/mouse-droid/AboutPitch.astro';
import AboutHowItWorks from '../components/mouse-droid/AboutHowItWorks.astro';
import AboutPrivacy from '../components/mouse-droid/AboutPrivacy.astro';
import '../styles/mouse-droid-about.css';
---

<Base
  title={`Mouse Droid — ${site.name}`}
  description="Mouse Droid's in-app About page: 'Your work, gently narrated.' A macOS menu-bar companion that turns window titles into a timeline, a second brain, and gentle wellness nudges."
  wide
>
  <script is:inline slot="head">
    document.documentElement.classList.add('js');
  </script>
  <p class="preface">
    What follows is the in-app About page from
    <a href="/portfolio#mouse-droid">Mouse Droid</a>, my macOS menu-bar
    companion — reproduced from the app, fretful droid voice and all.
  </p>
  <div class="about-root">
    <AboutHero />
    <AboutPitch />
    <AboutHowItWorks />
    <AboutPrivacy />
  </div>
</Base>

<script>
  // Scroll reveals — mirrors the app's useReveal (threshold 0.15, one-shot).
  const reveals = document.querySelectorAll('.about-reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.setAttribute('data-inview', 'true');
            io.unobserve(entry.target);
          }
        }
      },
      { threshold: 0.15 }
    );
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.setAttribute('data-inview', 'true'));
  }

  // Reader dialogs — open, close button, backdrop click, scroll lock.
  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    const opener = target.closest('[data-dialog-target]');
    if (opener) {
      const id = opener.getAttribute('data-dialog-target');
      const dialog = id ? document.getElementById(id) : null;
      if (dialog instanceof HTMLDialogElement) {
        const body = dialog.querySelector('.about-reader-shell__body');
        if (body) body.scrollTop = 0;
        const bar = dialog.querySelector('.about-reader-shell__progress');
        if (bar instanceof HTMLElement) bar.style.transform = 'scaleX(0)';
        dialog.showModal();
        document.documentElement.classList.add('md-dialog-open');
      }
      return;
    }
    if (target.closest('[data-dialog-close]')) {
      target.closest('dialog')?.close();
      return;
    }
    // A click that lands on the <dialog> itself (not its children) is a
    // backdrop click — the reader has padding: 0, so content covers the rest.
    if (target instanceof HTMLDialogElement && target.open) target.close();
  });

  // `close` fires for every close path (button, backdrop, Escape) but does
  // not bubble — listen in the capture phase.
  document.addEventListener(
    'close',
    (event) => {
      if (event.target instanceof HTMLDialogElement) {
        document.documentElement.classList.remove('md-dialog-open');
      }
    },
    true
  );

  // Guide reader progress bar — scroll doesn't bubble either.
  document.addEventListener(
    'scroll',
    (event) => {
      const body = event.target instanceof Element ? event.target : null;
      if (!body || !body.classList.contains('about-reader-shell__body')) return;
      const bar = body
        .closest('dialog')
        ?.querySelector('.about-reader-shell__progress');
      if (!(bar instanceof HTMLElement)) return;
      const max = body.scrollHeight - body.clientHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(1, body.scrollTop / max) : 0})`;
    },
    true
  );
</script>

<style>
  .preface {
    font-size: 0.9rem;
    color: var(--text-dim);
    max-width: 920px;
    margin: 0 auto var(--space-5);
  }
  .about-root {
    margin-bottom: var(--space-8);
  }
</style>
```

- [ ] **Step 6: Build and verify the four sheets render statically**

```bash
npm run build
for needle in 'about-sheet--hero' 'A few quiet signals become a second brain.' 'From a window title to a memory' 'What he never sees' 'href="/portfolio#mouse-droid"' 'classList.add'; do
  grep -q "$needle" dist/mouse-droid/index.html && echo "OK  $needle" || echo "FAIL $needle"
done
```

Expected: `[build] Complete!` and six `OK` lines.

- [ ] **Step 7: Typecheck**

Run: `npm run check`
Expected: `0 errors`.

- [ ] **Step 8: Commit**

```bash
git add src/pages/mouse-droid.astro src/components/mouse-droid/AboutHero.astro src/components/mouse-droid/AboutPitch.astro src/components/mouse-droid/AboutHowItWorks.astro src/components/mouse-droid/AboutPrivacy.astro
git commit -m "feat: /mouse-droid page with hero, pitch, how-it-works, privacy sheets

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 5: Reader dialog and the Features sheet

**Files:**
- Create: `src/components/mouse-droid/ReaderDialog.astro`
- Create: `src/components/mouse-droid/AboutFeatures.astro`
- Modify: `src/pages/mouse-droid.astro` (add import + element)

**Interfaces:**
- Consumes: Task 2's `features`/`featureTour` + `AboutIcon`; Task 4's `data-dialog-target` contract; Task 1's `src/data/mouse-droid/features/*.md`.
- Produces: `ReaderDialog.astro` with props `{ id: string; icon: AboutIconName; title: string; deck?: string; eyebrow?: string; meta?: string; width: string; tall?: boolean; showProgress?: boolean; closeLabel?: string }` (default closeLabel `"Close"`), rendering `<dialog id={id}>` with the doc slotted into `.about-reader-shell__measure.about-md`. Feature dialogs use ids `feature-<id>`. Task 6 reuses ReaderDialog for guides.

- [ ] **Step 1: Write `src/components/mouse-droid/ReaderDialog.astro`** (anatomy from the app's ReaderShell.tsx: pinned masthead / fading scroll body / pinned footer / optional progress bar)

```astro
---
import type { AboutIconName } from '../../data/mouse-droid-about';
import AboutIcon from './AboutIcons.astro';

interface Props {
  id: string;
  icon: AboutIconName;
  title: string;
  deck?: string;
  eyebrow?: string;
  meta?: string;
  width: string;
  tall?: boolean;
  showProgress?: boolean;
  closeLabel?: string;
}
const {
  id,
  icon,
  title,
  deck,
  eyebrow,
  meta,
  width,
  tall = false,
  showProgress = false,
  closeLabel = 'Close',
} = Astro.props;
---

<dialog
  id={id}
  class:list={['about-reader-shell', { 'about-reader-shell--tall': tall }]}
  style={`--reader-width: ${width}`}
>
  {showProgress && <div class="about-reader-shell__progress" aria-hidden="true" />}
  <div class="about-reader-shell__head">
    <span class="about-reader-shell__icon"><AboutIcon name={icon} size={22} /></span>
    <div class="about-reader-shell__text">
      {
        (eyebrow || meta) && (
          <div class="about-reader-shell__top">
            {eyebrow && <span class="about-reader-shell__eyebrow">{eyebrow}</span>}
            {meta && <span class="about-reader-shell__meta">{meta}</span>}
          </div>
        )
      }
      <h3 class="about-reader-shell__title">{title}</h3>
      {deck && <p class="about-reader-shell__deck">{deck}</p>}
    </div>
  </div>
  <div class="about-reader-shell__body">
    <div class="about-reader-shell__measure about-md"><slot /></div>
  </div>
  <div class="about-reader-shell__foot">
    <button type="button" class="about-reader-shell__close" data-dialog-close>
      {closeLabel}
    </button>
  </div>
</dialog>
```

- [ ] **Step 2: Write `src/components/mouse-droid/AboutFeatures.astro`** (feature dialogs mirror the app's FeatureDetailDialog: deck = blurb, width 560px, close label "Close")

```astro
---
import { features, featureTour } from '../../data/mouse-droid-about';
import AboutIcon from './AboutIcons.astro';
import ReaderDialog from './ReaderDialog.astro';

const docs = import.meta.glob('../../data/mouse-droid/features/*.md', {
  eager: true,
}) as Record<string, { Content: any }>;
const docFor = (id: string) => {
  const mod = docs[`../../data/mouse-droid/features/${id}.md`];
  if (!mod) throw new Error(`Missing feature doc: ${id}`);
  return mod.Content;
};
---

<section class="about-sheet about-sheet--features about-reveal">
  <div class="about-kicker">{featureTour.kicker}</div>
  <h2 class="about-h2">{featureTour.heading}</h2>
  <div class="about-feat">
    {
      features.map((f) => (
        <button type="button" class="about-ft" data-dialog-target={`feature-${f.id}`}>
          <span class="about-ic">
            <AboutIcon name={f.icon} />
          </span>
          <span class="about-ft__name">{f.name}</span>
          <span class="about-ft__blurb">{f.blurb}</span>
          <span class="about-ft__more">Details →</span>
        </button>
      ))
    }
  </div>
  {
    features.map((f) => {
      const Content = docFor(f.id);
      return (
        <ReaderDialog id={`feature-${f.id}`} icon={f.icon} title={f.name} deck={f.blurb} width="560px">
          <Content />
        </ReaderDialog>
      );
    })
  }
</section>
```

- [ ] **Step 3: Add the sheet to the page.** In `src/pages/mouse-droid.astro`, replace:

```astro
import AboutPitch from '../components/mouse-droid/AboutPitch.astro';
import AboutHowItWorks from '../components/mouse-droid/AboutHowItWorks.astro';
```

with:

```astro
import AboutPitch from '../components/mouse-droid/AboutPitch.astro';
import AboutFeatures from '../components/mouse-droid/AboutFeatures.astro';
import AboutHowItWorks from '../components/mouse-droid/AboutHowItWorks.astro';
```

and replace:

```astro
    <AboutPitch />
    <AboutHowItWorks />
```

with:

```astro
    <AboutPitch />
    <AboutFeatures />
    <AboutHowItWorks />
```

- [ ] **Step 4: Build and verify all seven feature readers render statically**

```bash
npm run build
grep -o 'id="feature-[a-z-]*"' dist/mouse-droid/index.html | sort
grep -q 'The wellness panel' dist/mouse-droid/index.html && echo "OK timeline doc rendered"
```

Expected: exactly these seven, then `OK timeline doc rendered`:

```
id="feature-brain"
id="feature-chat"
id="feature-memory"
id="feature-reports"
id="feature-summary"
id="feature-timeline"
id="feature-wellness"
```

- [ ] **Step 5: Typecheck**

Run: `npm run check`
Expected: `0 errors`.

- [ ] **Step 6: Commit**

```bash
git add src/components/mouse-droid/ReaderDialog.astro src/components/mouse-droid/AboutFeatures.astro src/pages/mouse-droid.astro
git commit -m "feat: feature tour sheet with native-dialog readers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 6: Guides sheet

**Files:**
- Create: `src/components/mouse-droid/AboutGuides.astro`
- Modify: `src/pages/mouse-droid.astro` (add import + element)

**Interfaces:**
- Consumes: Task 2's `guides`/`guidesSection`, Task 5's `ReaderDialog.astro`, Task 1's `src/data/mouse-droid/guides/*.md`.
- Produces: guide dialogs with ids `guide-<id>`, mirroring the app's GuideReaderDialog: eyebrow = category, meta = `"N min read"`, width 680px, `tall`, `showProgress`, close label `"← Back"`.

- [ ] **Step 1: Write `src/components/mouse-droid/AboutGuides.astro`**

```astro
---
import { guides, guidesSection } from '../../data/mouse-droid-about';
import AboutIcon from './AboutIcons.astro';
import ReaderDialog from './ReaderDialog.astro';

const docs = import.meta.glob('../../data/mouse-droid/guides/*.md', {
  eager: true,
}) as Record<string, { Content: any }>;
const docFor = (id: string) => {
  const mod = docs[`../../data/mouse-droid/guides/${id}.md`];
  if (!mod) throw new Error(`Missing guide doc: ${id}`);
  return mod.Content;
};
---

<section class="about-sheet about-sheet--guides about-reveal">
  <div class="about-kicker">{guidesSection.kicker}</div>
  <h2 class="about-h2">{guidesSection.heading}</h2>
  <p class="about-lead">{guidesSection.lead}</p>
  <div class="about-guides">
    {
      guides.map((g) => (
        <button type="button" class="about-gd" data-dialog-target={`guide-${g.id}`}>
          <span class="about-ic">
            <AboutIcon name={g.icon} />
          </span>
          <span class="about-gd__title">{g.title}</span>
          <span class="about-gd__blurb">{g.blurb}</span>
          <span class="about-gd__meta">
            <span>{g.category}</span>
            <span class="about-gd__read">{g.readMinutes} min read →</span>
          </span>
        </button>
      ))
    }
  </div>
  {
    guides.map((g) => {
      const Content = docFor(g.id);
      return (
        <ReaderDialog
          id={`guide-${g.id}`}
          icon={g.icon}
          title={g.title}
          eyebrow={g.category}
          meta={`${g.readMinutes} min read`}
          width="680px"
          tall
          showProgress
          closeLabel="← Back"
        >
          <Content />
        </ReaderDialog>
      );
    })
  }
</section>
```

- [ ] **Step 2: Add the sheet to the page.** In `src/pages/mouse-droid.astro`, replace:

```astro
import AboutPrivacy from '../components/mouse-droid/AboutPrivacy.astro';
```

with:

```astro
import AboutPrivacy from '../components/mouse-droid/AboutPrivacy.astro';
import AboutGuides from '../components/mouse-droid/AboutGuides.astro';
```

and replace:

```astro
    <AboutPrivacy />
  </div>
```

with:

```astro
    <AboutPrivacy />
    <AboutGuides />
  </div>
```

- [ ] **Step 3: Build and verify the three guide readers and total dialog count**

```bash
npm run build
grep -o 'id="guide-[a-z-]*"' dist/mouse-droid/index.html | sort
grep -c '<dialog' dist/mouse-droid/index.html
grep -q 'Recall by meaning, not keywords' dist/mouse-droid/index.html && echo "OK guide doc rendered"
```

Expected:

```
id="guide-getting-started"
id="guide-memory-palace"
id="guide-migrating"
10
OK guide doc rendered
```

- [ ] **Step 4: Typecheck**

Run: `npm run check`
Expected: `0 errors`.

- [ ] **Step 5: Commit**

```bash
git add src/components/mouse-droid/AboutGuides.astro src/pages/mouse-droid.astro
git commit -m "feat: guides sheet with progress-bar readers

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 7: Portfolio entry link and scraper-regression coverage

**Files:**
- Modify: `src/content/projects/mouse-droid.md` (frontmatter only — currently untracked; this task commits the whole file)
- Modify: `scripts/verify-content.mjs:11-38` (CONTENT_CHECKS)

**Interfaces:**
- Consumes: the `/mouse-droid` page (Tasks 4–6) and the existing `link` schema in `src/content.config.ts` (`{ label, href }`, href must be an absolute URL).
- Produces: the portfolio entry's outbound link; `npm run verify` coverage for the new page (this is CI's deploy gate).

- [ ] **Step 1: Add the link to the portfolio entry.** In `src/content/projects/mouse-droid.md`, replace:

```yaml
tools: [Rust, Tauri, Swift, TypeScript, React, SQLite, MCP]
```

with:

```yaml
tools: [Rust, Tauri, Swift, TypeScript, React, SQLite, MCP]
link:
  label: Explore the app's About page
  href: https://rydwy.com/mouse-droid
```

- [ ] **Step 2: Register the page in the scraper-regression script.** In `scripts/verify-content.mjs`, replace:

```js
  '404.html': ['404'],
};
```

with:

```js
  '404.html': ['404'],
  'mouse-droid/index.html': [
    'Your work, gently narrated.',
    'Seven ways he helps',
    'What he never sees',
    'The wellness panel', // feature doc content is statically rendered
    'Recall by meaning, not keywords', // guide doc content is statically rendered
  ],
};
```

Also add the Mouse Droid title to the portfolio page's needles — replace:

```js
  'portfolio/index.html': [
    'Software Warehouse API &amp; Dashboard',
```

with:

```js
  'portfolio/index.html': [
    'Mouse Droid',
    'Software Warehouse API &amp; Dashboard',
```

(Only 'Mouse Droid' is added — the other two new entries, `llm-gateway.md` and `llm-dashboard.md`, are still uncommitted user-review work; asserting them here would break CI if this plan's commits were pushed without them.)

- [ ] **Step 3: Build and run the full verification gates**

```bash
npm run build && npm run verify && npm run check
```

Expected: `✓ verify-content: all raw-HTML content, meta, link, and file checks passed` and `0 errors`. The verify script also validates the preface's `/portfolio#mouse-droid` anchor and the meta tags on the new page — failures there mean Task 4's page head or the portfolio anchor changed.

- [ ] **Step 4: Confirm sitemap coverage and the rendered portfolio link**

```bash
grep -o 'https://rydwy.com/mouse-droid/' dist/sitemap-0.xml
grep -o 'Explore the app[^<]*About page' dist/portfolio/index.html
```

Expected: `https://rydwy.com/mouse-droid/` then `Explore the app&#39;s About page` or `Explore the app's About page` (either escaping is fine — the grep pattern matches both).

- [ ] **Step 5: Commit**

```bash
git add src/content/projects/mouse-droid.md scripts/verify-content.mjs
git commit -m "feat: link portfolio entry to /mouse-droid and cover page in verify

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

### Task 8: Browser verification

**Files:**
- Create: `scripts/verify-mouse-droid.mjs`

**Interfaces:**
- Consumes: the built site in `dist/`, served by `npm run preview` at `http://localhost:4321`; Playwright (already in devDependencies).
- Produces: a repeatable browser check for the spec's interaction requirements. Exit code 0 = pass.

- [ ] **Step 1: Write `scripts/verify-mouse-droid.mjs`**

```js
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
```

- [ ] **Step 2: Run it against the built site**

```bash
npx playwright install chromium 2>/dev/null || true   # no-op if already installed
npm run build
npm run preview &
PREVIEW_PID=$!
sleep 2
node scripts/verify-mouse-droid.mjs
STATUS=$?
kill $PREVIEW_PID
exit $STATUS
```

Expected: every line prefixed `✓`, ending `✓ verify-mouse-droid: all browser checks passed`. If a check fails, fix the implementation (not the check), re-run, and fold the fix into this task's commit — unless it belongs to an earlier task's file, in which case commit the fix separately with a `fix:` message.

- [ ] **Step 3: Eyeball it.** Run `npm run dev` and load `http://localhost:4321/mouse-droid` in a real browser: gold hero underline animates, sheets reveal on scroll, pipeline light flows, a feature card opens a framed reader, a guide opens with the progress bar, and the page reads as the app's About page sitting inside the site's header/footer. This is the taste check no script covers — screenshot it for the user.

- [ ] **Step 4: Commit**

```bash
git add scripts/verify-mouse-droid.mjs
git commit -m "test: browser verification for /mouse-droid

Co-Authored-By: Claude Fable 5 <noreply@anthropic.com>"
```

---

## Completion checklist (maps to spec §Verification)

- [ ] `npm run build` + `npm run verify` + `npm run check` all pass (Tasks 7–8).
- [ ] All six sheets and all ten reader docs present in `dist/mouse-droid/index.html` (Tasks 4–7).
- [ ] Browser pass: reveals, both dialog types, progress bar, 380px layout, reduced motion, no-JS (Task 8).
- [ ] `/mouse-droid` in sitemap (Task 7).
- [ ] Portfolio entry shows "Explore the app's About page ↗" (Task 7).
- [ ] Nothing pushed; the user's unrelated uncommitted portfolio work (`llm-gateway.md`, `llm-dashboard.md`, renumbered entries, `.gitignore`) left uncommitted.
