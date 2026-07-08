# rydwy.com

Personal portfolio and resume site for Ryan Dwyer. Fully static Astro build —
all content is present in served HTML (no client-side content loading).

## Editing content

| What | Where |
|---|---|
| Portfolio project | `src/content/projects/*.md` (one file each; `order` controls position) |
| Home page bio | `src/content/about.md` |
| Resume | `src/data/resume.yaml` (then regenerate the PDF — see below) |
| Contact links / tagline | `src/data/site.ts` |

## Commands

- `npm run dev` — local dev server
- `npm run build` — static build to `dist/`
- `npm run check` — typecheck + content schema validation
- `npm run verify` — assert built HTML contains real content (scraper test)
- `node scripts/generate-pdf.mjs` — regenerate `public/resume.pdf` after a
  resume edit (requires `npx playwright install chromium` once)

## Deploying

Push to `main`. GitHub Actions builds, verifies, and deploys to the Lightsail
box. Details and one-time setup: `docs/deployment.md`.
