# rydwy.com Rearchitecture — Design

**Date:** 2026-07-07
**Status:** Approved pending final review

## Problem

rydwy.com is a docsify site. Docsify fetches and renders Markdown client-side, so
the raw HTML served to previewers, link unfurlers, and scrapers contains no
content — they see an empty shell. For a professional portfolio/resume site this
is a critical failure. Additionally, the resume page is a PNG image (invisible to
search engines, scrapers, and screen readers), and the site has no deployment
automation (current process: SSH into the Lightsail box, `git pull`, run
`start.sh`).

## Goals

1. **All content present in served HTML.** Every page fully rendered at build
   time; no client-side content loading.
2. **Professional appearance.** Restrained, designed, cohesive with the resume's
   visual identity. Explicitly must not look "vibe-coded."
3. **Real HTML resume** with downloadable PDF, replacing the PNG.
4. **Keep the existing host**: the Bitnami/Lightsail box, Node serving on
   port 3000 behind Bitnami's reverse proxy, launched by `start.sh`.
5. **Automated deployment**: push to `main` → build → deploy. Built from scratch
   (no CI/CD exists today).
6. **Markdown/structured-file authoring**, preserving the current low-friction
   editing workflow.

## Decisions made during brainstorming

| Question | Decision |
|---|---|
| Hosting | Keep Bitnami/Lightsail VPS |
| Resume page | Rebuild as semantic HTML + downloadable PDF |
| Authoring | Markdown per project; structured YAML for resume |
| Deployment | GitHub Actions auto-deploy over SSH (new; none exists today) |
| Contact | Links in header/footer; no dedicated page |
| Visual direction | Extend the resume's brand: charcoal + cream, monospace accents |
| Framework | Astro (static output) with Radix Colors + Radix primitives as React islands |
| Portfolio structure | Single scrolling page with per-project anchors |

## Architecture

**Framework: Astro, static output.** Content-first static site generator. Every
page is complete HTML at build time; ships zero JavaScript except where islands
are explicitly added. Built-in build-time image optimization. TypeScript
throughout.

**Radix usage:**
- **Radix Colors**: custom 12-step charcoal and cream scales generated from the
  resume palette; used for all color decisions (text, borders, hovers, panels).
- **Radix primitives as React islands**: only for genuinely interactive pieces —
  the mobile navigation menu and the portfolio image lightbox (Radix Dialog).
  Everything else is plain HTML/CSS.

### Pages

| Route | Content |
|---|---|
| `/` | Home/About: headshot, refreshed bio, current role, links to portfolio & resume |
| `/portfolio/` | All projects on one page, each with an anchor id (e.g. `/portfolio/#softserve`), title, tools chips, prose, media |
| `/resume/` | Full resume as semantic HTML (work experience, education, R&D projects, skills, credits) + Download PDF button + print stylesheet |
| `/404` | Styled not-found page |
| `/sitemap.xml`, `/robots.txt` | Generated at build |

### Content model

```
src/content/projects/*.md   one file per portfolio project
                            frontmatter (zod-validated): title, anchor (the
                            /portfolio/#id), tools[], images[], video?,
                            poster?, order
src/content/about.md        home page bio prose
src/data/resume.yaml        structured resume: jobs[], education[], skills[],
                            rdProjects[], credits[]
src/data/site.ts            name, tagline, canonical URL, email, GitHub,
                            LinkedIn
public/                     favicon, robots.txt, resume PDF, video file
src/assets/                 headshot + screenshots (run through Astro's
                            image pipeline)
```

Editing workflow: add/edit a Markdown or YAML file, push to `main`, site
rebuilds and deploys automatically.

**Content migration & refresh:**
- The 8 projects in `portfolio.md` migrate to individual project files. The
  Instagram embed in "Ghost Backup Dancers" is replaced with a plain styled
  link to the Instagram post (the embed loads Instagram's SDK — third-party JS,
  layout shift, and it breaks the no-client-side-content principle).
- Resume content transcribed from `img/resume.png` into `resume.yaml`.
- Home bio copy refreshed: Ryan now lives on the Upper West Side of New York
  City (the old "moving to NYC around March 2026" line is stale). Role stays as
  on the resume — Production Engineer, ILM Platform team, Lucasfilm. Exact copy
  drafted during implementation for Ryan's sign-off.
- Contact links: email `ryan@rydwy.com`, GitHub `github.com/ToxicBananaParty`,
  LinkedIn `linkedin.com/in/ryandanieldwyer`.
- Phone number appears on the resume page only (matching the PDF), not in the
  global footer.

**Resume PDF:** generated from the new HTML resume page via headless-Chrome
print-to-PDF during implementation and committed to `public/`. The print
stylesheet doubles as the PDF layout, so the downloaded document matches the
site brand. (If Ryan later supplies a separately maintained PDF, it just
replaces the file.)

**Legacy URL continuity:** docsify URLs are hash-based (`/#/portfolio`), which
never reach the server. A tiny inline script on the home page maps known hash
routes (`#/portfolio`, `#/resume`, `#/contact`) to the new paths so previously
shared links still work.

## Visual design system

**Identity:** the site extends the resume's brand — a recruiter who downloads
the PDF after browsing should see one designed system.

- **Palette:** near-black charcoal background with warm cream text/panels,
  matching the resume. Implemented as custom Radix Colors 12-step scales, not
  hand-picked hexes. At most one additional accent (brighter cream for
  links/hover).
- **Typography:** monospace display type for headings, nav, and metadata
  (echoing the resume); a clean sans-serif for body prose (all-mono paragraphs
  read poorly on screens). Fonts self-hosted — no third-party font CDN. Final
  face selection (JetBrains Mono / IBM Plex Mono; Inter / system sans) happens
  in implementation via side-by-side comparison.
- **Layout:** fixed top nav (name in mono, three links, contact icons); single
  centered content column (~720–800px); consistent spacing scale; generous
  whitespace.
- **Portfolio cards:** uniform treatment per project — mono title, tools as
  small tag chips, prose, media. Images open in a Radix Dialog lightbox
  (replacing today's "open PNG in new tab").
- **Media discipline:** headshot and screenshots go through Astro's image
  pipeline (modern formats, responsive srcset; the 1MB headshot PNG becomes
  tens of KB). The 13MB demo video uses `preload="metadata"`, so visitors load
  only headers and a first frame until they press play.
- **Explicitly avoided:** gradients, glassmorphism, animated hero text, emoji
  in headings, multiple accent colors.
- **Accessibility:** semantic HTML landmarks, alt text on all images, WCAG AA
  contrast (charcoal/cream passes comfortably), keyboard-operable nav and
  lightbox (Radix provides this).

## Build & deployment

No CI/CD exists today; this is all net-new.

**Pipeline (GitHub Actions, on push to `main`):**
1. `npm ci`
2. `astro check` — TypeScript + content schema validation
3. `astro build` → `dist/`
4. **Content verification tests** (see Verification)
5. rsync `dist/` + `app.js` over SSH to the Lightsail box into a versioned
   release directory, then atomically flip a `current` symlink
6. Failure at any step leaves the live site untouched

**One-time setup (documented in the repo as `docs/deployment.md`):**
- Generate a dedicated deploy SSH keypair; public key on the server, private
  key + host + user as GitHub repo secrets
- Create release directory layout under `/opt/bitnami/projects/rydwy/`
  (`releases/`, `current` symlink)
- Update `app.js` and `start.sh` to serve `current/dist`; ensure Express is
  installed on the box (it already is for the current site)
- Manual fallback documented: SSH in, `git pull`, `npm ci && npm run build`,
  flip symlink — the old workflow still works if Actions is ever unavailable

**Serving:** `app.js` becomes a minimal static Express server (~20 lines):
`express.static` over the deployed `dist/` (Express handles Range requests for
the video), immutable long-lived cache headers for hashed assets, `no-cache`
for HTML, and the styled 404 page for unknown routes. Same contract as today —
`node app.js`, port 3000, behind Bitnami's reverse proxy — so server config is
otherwise untouched.

**Cleanup:** docsify `index.html`, `_sidebar.md`, per-page `.md` files at repo
root, `.nojekyll`, and the old route-per-file Express code are removed once the
new site ships.

## SEO / scraper layer

- Unique `<title>` + meta description per page; canonical URLs
- Open Graph + Twitter card tags on every page with a branded `og:image`, so
  pasting rydwy.com into Slack/LinkedIn/iMessage renders a real preview card
- JSON-LD `Person` structured data on the home page
- `sitemap.xml` (Astro integration) + `robots.txt`

## Verification

- **Scraper regression test (the core guarantee):** a CI step that reads the
  *built* HTML files and asserts known content strings appear in raw HTML with
  no JavaScript executed — e.g. "Lucasfilm", "Platform Engineer", every project
  title on `/portfolio/`, and job titles on `/resume/`. This is an automated
  replica of the exact failure that motivated the project; it must pass before
  any deploy.
- **Schema validation:** content collections use zod schemas, so a missing or
  typo'd frontmatter field fails the build, never the live site.
- **Link/anchor check:** CI script validates internal links and portfolio
  anchor targets in the built output.
- **Pre-launch manual pass:** Lighthouse (performance + accessibility), mobile
  layout, and link-preview validation (OpenGraph debuggers) before DNS-visible
  cutover.

## Error handling

- Unknown routes → styled 404 from Express
- Build/content errors → CI fails, live site untouched
- Deploy failure mid-transfer → release-dir + symlink flip means the live site
  never serves a half-deployed state

## Out of scope

- Blog, analytics, contact forms, CMS
- Light/dark theme toggle (single dark brand theme)
- Per-project subpages (anchors on one page instead; revisit later if needed)
- Changes to Bitnami/Apache reverse-proxy configuration
