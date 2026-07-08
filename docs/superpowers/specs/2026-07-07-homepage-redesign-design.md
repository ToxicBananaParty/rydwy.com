# Homepage Redesign ("The Resume, Extended") — Design

**Date:** 2026-07-07
**Status:** Approved pending final review
**Predecessor:** `2026-07-07-rydwy-site-rearchitecture-design.md` (the Astro rebuild this refines)

## Problem

The shipped homepage reads as "transparently AI-designed." Ryan reviewed an
annotated diagnosis and identified exactly two offenders (explicitly keeping
the circular headshot and the two CTA buttons):

1. **The uppercase letterspaced tagline** — `PLATFORM ENGINEER & CREATIVE
   TECHNOLOGIST` in all-caps with wide tracking is the default template hero
   subtitle voice.
2. **Perfect axis symmetry with no point of view** — everything centered in
   one polite column; none of the printed resume's actual structure (cream
   sidebar, hard rules, dense mono, square corners) survives on the page.

## Chosen direction

Of three mocked directions (A: resume-sidebar structure, B: ruled editorial,
C: ledger/table-of-contents), Ryan chose **A — "The resume, extended"**,
reviewed at high fidelity (desktop + mobile) and approved.

The printed resume's cream info rail becomes the homepage's structure, so the
site and the PDF read as one designed document system.

## Homepage layout

**Desktop (two-column spread, max ~920px, left-anchored):**

- **Left rail (250px, cream):** background `--cream-3`, text in the charcoal
  ink family, square corners, mono type throughout — a transplant of the
  printed resume's sidebar. Contains, top to bottom:
  - Circular headshot (~120px; circle kept per Ryan's explicit call)
  - **Info** heading (mono bold, 2px dark underline — the resume's section
    heading style), then: `New York, NY`, email link, GitHub link,
    LinkedIn link
  - **Currently** heading (same style), then exactly:
    ```
    Production Engineer,
    Platform Team,
    Core Pipeline,
    ILM / Lucasfilm
    ```
- **Main column:** name in bold mono (~2.4rem); role line
  `Platform Engineer & Creative Technologist` in **normal-case mono, no
  tracking, no uppercase** (the printed resume's header voice — this is the
  fix for offender #1); the existing bio prose unchanged; the two CTA
  buttons kept, left-aligned, **arrow suffixes removed** ("View portfolio",
  "Read resumé").

**Header/footer:**

- **The homepage drops the global header.** It reads as the cover of the
  document system; the sidebar links + CTA buttons carry all navigation.
  This also removes the name-in-header + name-in-hero duplication.
  Implemented as an optional `hideHeader` prop on the shared `Base` layout
  so all head/SEO logic stays in one place. Interior pages are untouched.
- **The footer stays on the homepage** (quiet, carries the copyright, keeps
  the page structurally related to the rest of the site).

**Mobile (below ~760px):** main column first (name, role, bio, buttons),
then the rail as a full-width cream card (headshot beside the info lines,
compact). A phone visitor gets the pitch before the contact block.

## Consistency ripples

1. **Resume page role line** — `/resume/` currently renders "Platform
   Engineer" with the same uppercase+tracking style; it becomes normal-case
   mono. Because the PDF is a print render of that page, **`resume.pdf` is
   regenerated**.
2. **OG preview card** — `scripts/generate-og.mjs` uses the uppercase-tracked
   subtitle; the script gets the same normal-case fix and **`og.png` is
   regenerated** (same charcoal/cream brand card otherwise).
3. **Deliberately left alone:** the small uppercase nav links on interior
   pages and the mobile "MENU" trigger (functional labels, not the page's
   voice); the bio copy; the portfolio and resume page layouts; JSON-LD,
   meta tags, and the legacy hash-redirect script (all live in the home
   page's head and are preserved verbatim through the redesign).

## Verification

- `npm run verify` (scraper-regression) must stay green **unchanged**: the
  home page still contains "Ryan Dwyer", "Platform Engineer" (normal case —
  the check is case-sensitive and matches), "New York City" (in the bio),
  and "Lucasfilm". The link/anchor checks cover the new sidebar links.
- `astro check` 0 errors; build succeeds.
- Visual pass at desktop and mobile widths before commit; keyboard skip-link
  still works (home retains `#main-content`).
- Contrast: cream rail text uses the dark ink family on `--cream-3`
  (WCAG AA comfortably).

## Out of scope

- Any portfolio/resume page layout changes beyond the role-line voice fix
- Bio copy changes
- Light/dark theming, new pages, nav restructuring
