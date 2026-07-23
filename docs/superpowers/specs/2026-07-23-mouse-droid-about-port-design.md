# Mouse Droid About Page Port — Design

**Date:** 2026-07-23
**Status:** Approved (pending spec review)

## Goal

Reproduce Mouse Droid's in-app About page as a faithful static exhibit at
`https://rydwy.com/mouse-droid`, linked from the Mouse Droid portfolio entry.
Mouse Droid is a desktop (Tauri) app, so its About page is not hosted anywhere
and cannot be iframed; this port replaces that idea. The page should look and
behave like the real thing — same copy, same warm-editorial dark design, same
card→reader interactions — while remaining a lean, dependency-free part of the
Astro site.

## Approach (decided)

**Astro-native, zero new dependencies.** The six "sheets" are recreated as
Astro components rendering static HTML; feature/guide markdown is rendered at
build time; overlays use the native `<dialog>` element with ~60 lines of
vanilla JS; scroll reveals use a small IntersectionObserver script.

Rejected alternatives: (a) React-island port of the original components —
would add `@radix-ui/themes` + a markdown renderer to a lean site and hide all
content behind hydration; (b) static flattened layout without dialogs — loses
the signature card→reader interaction.

## Source material (read-only; the app repo is never modified)

From `/Users/rdwyer/projects/mouse-droid` (symlinked at
`new-portfolio-items/mouse-droid`, which is gitignored):

| Source | Role |
| --- | --- |
| `src/views/about/content.tsx` | All copy (hero, pitch, features, pipeline, privacy, guides) |
| `src/views/about/About.css` | Complete visual system (489 lines) |
| `src/views/about/sections/*.tsx` (6 files) | Markup structure per sheet |
| `src/views/about/AboutIcons.tsx` | Custom inline SVG icon set |
| `src/views/about/ReaderShell.tsx` | Reader overlay anatomy (masthead / fading scroll body / footer / progress bar) |
| `src/views/about/useReveal.ts` | Scroll-reveal behavior (IntersectionObserver, threshold 0.15, one-shot) |
| `src/views/about/markdown/features/*.md` (7 files) | Feature detail docs |
| `src/views/about/markdown/guides/*.md` (3 files) | Guide docs |
| `src/assets/mouse-droid-avatar.png` | Hero avatar (256×256 PNG) |
| `src/design-system/theme.css` | Values for the five app-level CSS variables the About styles consume |

Sensitive-content status: all ten markdown docs and all copy were scanned for
internal strings (employer names, internal hostnames, ticket prefixes) — clean.
The `rdwyer@mac` example in How-It-Works is the site owner's own public handle
and stays. If anything questionable surfaces during the port, stop and ask
rather than silently editing.

## Deliverables (all in rydwy.com)

New files:

- `src/pages/mouse-droid.astro` — the page.
- `src/components/mouse-droid/AboutHero.astro`, `AboutPitch.astro`,
  `AboutFeatures.astro`, `AboutHowItWorks.astro`, `AboutPrivacy.astro`,
  `AboutGuides.astro` — one component per sheet.
- `src/components/mouse-droid/AboutIcons.astro` — the SVG icon set, ported
  as-is (name → SVG markup, `size` prop, `currentColor` strokes).
- `src/components/mouse-droid/ReaderDialog.astro` — native-`<dialog>` reader
  shell used by both feature details (7) and guide readers (3).
- `src/styles/mouse-droid-about.css` — `About.css` ported near-verbatim plus
  the adaptations listed below.
- `src/data/mouse-droid-about.ts` — copy transcribed verbatim from
  `content.tsx` (same structure: hero, pitch, featureTour, features[7],
  howItWorks, pipeline[5], privacy, guidesSection, guides[3]), with the React
  `?raw` markdown imports replaced by doc-id references.
- `src/data/mouse-droid/features/*.md` (7) and
  `src/data/mouse-droid/guides/*.md` (3) — copied unchanged. Loaded via
  `import.meta.glob(..., { eager: true })` and rendered to HTML at build time
  with Astro's built-in markdown pipeline (each module's `Content` component).
  They live under `src/data/` (not `src/content/`) to stay out of the content
  collections config.
- `src/assets/mouse-droid-avatar.png` — copied unchanged.

Modified files:

- `src/content/projects/mouse-droid.md` — add
  `link: { label: "Explore the app's About page", href: "https://rydwy.com/mouse-droid" }`
  (schema requires an absolute URL; renders in the existing "label ↗" style).

## Page framing

- Base layout with normal header and footer, `wide` container (58rem = 928px,
  fits the artifact's 920px max width).
- `title`: `Mouse Droid — Ryan Dwyer`; `description`: built around the app's
  tagline "Your work, gently narrated." plus a one-line explanation that this
  is the app's in-app About page.
- Above the artifact, a short editorial preface in the site's voice — one or
  two sentences noting this is the About page from Mouse Droid reproduced from
  the app, with a link back to `/portfolio#mouse-droid` — so the first-person
  droid voice has context.

## Fidelity rules

- **Copy is verbatim.** No rewording, no trimming. All six sheets ship,
  including Guides.
- **Visual system is verbatim** where possible: sheet stack (rounded tops,
  −24px overlap, per-sheet tints), gold palette, kicker/h2/lead typography,
  card grids, pipeline with flowing-light connectors, privacy shield SVG, all
  keyframe animations (`about-underline`, `about-bob`, `about-pulse`,
  `about-flow`), and the `prefers-reduced-motion` override block.
- **Dark presentation pinned.** The five app variables are defined locally on
  `.about-root` with the app's dark-theme values:
  `--md-surface: #0d0d0f`, `--md-surface-raised: #161619`,
  `--md-border: #232327`, `--score-good: #5fd38a`, `--score-bad: #e06c6c`.
  No light variant.
- **Original font stack retained** inside `.about-root`
  (`-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` + the
  `ui-monospace` mono stack) — part of the app's look. The rest of the site
  stays on Inter/JetBrains Mono.

## CSS adaptations (the only intentional deviations)

1. Reader-shell rules re-targeted from Radix classes
   (`.about-reader-shell.rt-DialogContent`, `.rt-Heading`) to the native
   `<dialog>` markup, preserving the same anatomy and metrics: pinned masthead
   with icon tile / eyebrow / title / deck / meta, scrolling body with soft
   fade mask and 62ch measure, pinned footer with a soft "Close" button,
   max-height 78vh (84vh tall variant), 16px radius.
2. `dialog::backdrop` scrim styled to match Radix's overlay look.
3. Reader markdown typography rules re-scoped from `.md-markdown` to a local
   class on the rendered doc container.
4. A no-JS guard: an inline script adds a `js` class to `<html>` before paint;
   the `.about-reveal` hidden-until-revealed styles apply only under `.js`, so
   all content is visible without JavaScript (an improvement over the app,
   where the page requires JS entirely).

## Interactivity (vanilla JS, inline in the page)

- **Reveals:** IntersectionObserver, threshold 0.15, one-shot per section,
  sets `data-inview="true"` — mirrors `useReveal`.
- **Dialogs:** every feature and guide gets a pre-rendered `<dialog>`
  containing its build-time-rendered markdown. Card buttons call
  `showModal()`. Close paths: footer button, Escape (native), backdrop click
  (`event.target === dialog`). Background scroll locked while open (toggle
  `overflow: hidden` on `<html>`).
- **Guide progress bar:** scroll listener on the reader body drives
  `transform: scaleX(0→1)`; resets each open.
- **No-JS behavior (accepted trade-off):** all sheet content renders; the ten
  reader docs are present in the HTML (SEO-visible) but the card buttons
  no-op. This is deliberate — a `<details>` fallback was rejected with
  approach (b).

## Accessibility

Preserved from the original: decorative elements `aria-hidden`,
`:focus-visible` gold outlines on cards, privacy list uses ✕/✓ glyphs so color
is never the only signal, reduced-motion disables all animation and forces
reveals visible. Native `<dialog>` provides focus trapping and `aria-modal`
semantics. Dialog titles are headings inside the dialog; each card button's
accessible name is the feature/guide name.

## Verification

1. `npm run build` passes; `dist/mouse-droid/index.html` exists and contains
   all six section headings and identifiable text from each of the ten
   markdown docs (statically rendered).
2. Browser pass against the built or dev site: reveals fire on scroll; a
   feature dialog opens and closes via button, Escape, and backdrop click; a
   guide reader shows an advancing progress bar; layout holds at ~380px
   (feature grid 3→2 columns, pipeline connectors hidden, guides 3→1 per the
   original media queries); `prefers-reduced-motion` shows everything without
   animation; with JS disabled all sheet content is visible.
3. `/mouse-droid` appears in the generated sitemap (automatic via
   `@astrojs/sitemap`).
4. Portfolio entry renders the new "Explore the app's About page ↗" link.

## Out of scope

- No changes to the mouse-droid app repo.
- No restyling of other rydwy.com pages; no light-theme artifact variant.
- No page-specific OG image (site default `og.png` is used).
- No hosting of the app's actual SPA bundle.
