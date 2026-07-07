# rydwy.com Astro Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the docsify shell with a fully static Astro site whose complete content is present in served HTML, styled to the resume's charcoal/cream mono brand, deployed to the existing Bitnami/Lightsail box via new GitHub Actions CI/CD.

**Architecture:** Astro 5 static output; Markdown content collections (one file per project) + YAML resume data, all zod-validated at build. Radix primitives as React islands only for the image lightbox and mobile nav. A CI "scraper regression" script asserts real content exists in built HTML before an rsync + atomic-symlink deploy to the server, which runs a minimal static Express server.

**Tech Stack:** Astro 5, TypeScript, React 19 (islands only), @radix-ui/react-dialog, @radix-ui/react-dropdown-menu, @rollup/plugin-yaml, @fontsource (JetBrains Mono + Inter), Express (server), Playwright (one-time PDF/OG artifact generation), GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-07-07-rydwy-site-rearchitecture-design.md`

---

## File structure

```
astro.config.mjs                  Astro config: site URL, react, sitemap, yaml plugin
package.json / tsconfig.json      project config
src/
  content.config.ts               content collections + zod schemas
  content/about.md                home page bio prose
  content/projects/*.md           8 project files (frontmatter + prose)
  data/site.ts                    name, tagline, URLs, contact links
  data/resume.yaml                structured resume content
  data/resume-schema.ts           zod schema + parse for resume.yaml
  layouts/Base.astro              <head> meta/OG/canonical, header, footer
  components/Header.astro         top nav (name, links, contact)
  components/Footer.astro         contact links + copyright
  components/ProjectCard.astro    uniform project rendering
  components/Lightbox.tsx         Radix Dialog image lightbox (island)
  components/MobileNav.tsx        Radix DropdownMenu nav (island, <640px)
  pages/index.astro               home/about + JSON-LD + hash-redirect
  pages/portfolio.astro           all projects, anchored
  pages/resume.astro              HTML resume + print styles
  pages/404.astro                 not-found page
  styles/tokens.css               charcoal/cream 12-step scales + semantic vars
  styles/global.css               reset, typography, layout, lightbox styles
  assets/*.png                    images (moved from img/, build-optimized)
  types/yaml.d.ts                 *.yaml module declaration
public/
  favicon.ico  robots.txt  og.png  resume.pdf  media/touchrender.mp4
scripts/
  verify-content.mjs              scraper-regression + link/anchor CI test
  generate-og.mjs                 one-time og.png generation (Playwright)
  generate-pdf.mjs                one-time resume.pdf generation (Playwright)
server/app.mjs                    static Express server deployed to the box
.github/workflows/deploy.yml      build → verify → rsync → symlink flip
docs/deployment.md                one-time server setup + manual fallback
```

Deleted at the end (Task 15): docsify `index.html`, `_sidebar.md`, root `portfolio.md`/`resume.md`/`contact.md`, `.nojekyll`, old `app.js`, `img/` (contents moved), old `README.md` content (replaced with repo docs).

**Server layout after deploy** (`/opt/bitnami/projects/rydwy/`):

```
app.mjs                 ← rsynced from server/app.mjs (stable location)
start.sh                ← runs: node /opt/bitnami/projects/rydwy/app.mjs
node_modules/express    ← installed once on the box
releases/<sha>/dist/    ← one dir per deploy (last 5 kept)
current → releases/<sha>   (atomic symlink flip)
```

`app.mjs` serves `current/dist` through the symlink, resolved per-request, so a flip takes effect instantly without restarting node. Node restart only needed when `app.mjs` itself changes.

**Testing model:** the site-level test harness is `scripts/verify-content.mjs`, written in Task 5 *before* any real pages exist (red), and driven green task-by-task as pages land. Its assertions are an automated replica of the scraper failure that motivated this project. `astro check` covers types + content schemas.

---

### Task 1: Scaffold the Astro project

**Files:**
- Create: `package.json`, `astro.config.mjs`, `tsconfig.json`, `src/types/yaml.d.ts`, `src/pages/index.astro` (placeholder, replaced in Task 7)

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "rydwy.com",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "astro dev",
    "build": "astro build",
    "preview": "astro preview",
    "check": "astro check",
    "verify": "node scripts/verify-content.mjs"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
npm install astro @astrojs/react @astrojs/sitemap react react-dom \
  @radix-ui/react-dialog @radix-ui/react-dropdown-menu \
  @rollup/plugin-yaml @fontsource-variable/inter @fontsource/jetbrains-mono
npm install -D @astrojs/check typescript @types/react @types/react-dom express playwright
```

Expected: installs succeed; `package.json` gains dependencies (Astro 5.x).

- [ ] **Step 3: Create `astro.config.mjs`**

```js
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  site: 'https://rydwy.com',
  integrations: [react(), sitemap()],
  vite: { plugins: [yaml()] },
});
```

- [ ] **Step 4: Create `tsconfig.json`**

```json
{
  "extends": "astro/tsconfigs/strict",
  "include": [".astro/types.d.ts", "src/**/*"],
  "exclude": ["dist"],
  "compilerOptions": {
    "jsx": "react-jsx",
    "jsxImportSource": "react"
  }
}
```

- [ ] **Step 5: Create `src/types/yaml.d.ts`**

```ts
declare module '*.yaml' {
  const data: unknown;
  export default data;
}
```

- [ ] **Step 6: Create placeholder `src/pages/index.astro`**

```astro
---
---
<html lang="en"><head><meta charset="utf-8" /><title>Ryan Dwyer</title></head>
<body><h1>Ryan Dwyer</h1></body></html>
```

- [ ] **Step 7: Verify the build works**

```bash
npm run build
```

Expected: `Complete!` with `dist/index.html` created. Run `ls dist/` to confirm.

- [ ] **Step 8: Commit**

```bash
git add package.json package-lock.json astro.config.mjs tsconfig.json src/
git commit -m "feat: scaffold Astro 5 project with react, sitemap, yaml plugins"
```

---

### Task 2: Design tokens and global styles

**Files:**
- Create: `src/styles/tokens.css`, `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/tokens.css`** — two 12-step Radix-style scales derived from the resume palette, plus semantic aliases. All color decisions elsewhere use the semantic vars only.

```css
:root {
  /* charcoal scale — dark cool-tinted neutrals (resume header #26262b family) */
  --charcoal-1: #17171a;
  --charcoal-2: #1c1c20;
  --charcoal-3: #232329;
  --charcoal-4: #28282f;
  --charcoal-5: #2e2e36;
  --charcoal-6: #36363f;
  --charcoal-7: #42424d;
  --charcoal-8: #565663;
  --charcoal-9: #696977;
  --charcoal-10: #777786;
  --charcoal-11: #a9a9b5;
  --charcoal-12: #e8e8ec;

  /* cream scale — warm paper (resume sidebar #f5f5dc family) */
  --cream-1: #fdfdf4;
  --cream-2: #fafae9;
  --cream-3: #f5f5dc;
  --cream-4: #efefcf;
  --cream-5: #e7e7c0;
  --cream-6: #dcdcac;
  --cream-7: #cbcb92;
  --cream-8: #b5b573;
  --cream-9: #a3a35f;
  --cream-10: #96964f;
  --cream-11: #8f8f5e;
  --cream-12: #3a3a20;

  /* semantic aliases */
  --bg: var(--charcoal-1);
  --bg-panel: var(--charcoal-3);
  --bg-chip: var(--charcoal-4);
  --border: var(--charcoal-6);
  --border-hover: var(--charcoal-8);
  --text: var(--cream-2);
  --text-dim: var(--charcoal-11);
  --heading: var(--cream-3);
  --link: var(--cream-6);
  --link-hover: var(--cream-1);

  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Menlo, monospace;
  --font-sans: 'Inter Variable', system-ui, -apple-system, 'Segoe UI', sans-serif;

  --content-width: 48rem;
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-5: 1.5rem;
  --space-6: 2rem;
  --space-7: 3rem;
  --space-8: 4rem;
}
```

- [ ] **Step 2: Create `src/styles/global.css`**

```css
@import './tokens.css';

*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  color-scheme: dark;
  scroll-behavior: smooth;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-sans);
  font-size: 1.0625rem;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}

h1,
h2,
h3,
h4 {
  font-family: var(--font-mono);
  color: var(--heading);
  line-height: 1.25;
  letter-spacing: -0.01em;
}

h1 { font-size: 2rem; margin: 0 0 var(--space-3); }
h2 { font-size: 1.4rem; margin: var(--space-7) 0 var(--space-3); }
h3 { font-size: 1.1rem; margin: var(--space-5) 0 var(--space-2); }

p { margin: 0 0 var(--space-4); }

a {
  color: var(--link);
  text-decoration-color: var(--border-hover);
  text-underline-offset: 3px;
}
a:hover { color: var(--link-hover); }

:focus-visible {
  outline: 2px solid var(--cream-6);
  outline-offset: 2px;
}

::selection {
  background: var(--cream-6);
  color: var(--charcoal-2);
}

img, video { max-width: 100%; height: auto; display: block; }

code {
  font-family: var(--font-mono);
  font-size: 0.9em;
  background: var(--bg-chip);
  padding: 0.1em 0.35em;
  border-radius: 4px;
}

.container {
  max-width: var(--content-width);
  margin: 0 auto;
  padding: 0 var(--space-5);
}

.mono {
  font-family: var(--font-mono);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  white-space: nowrap;
  border: 0;
}

/* tool chips */
.chips {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
  list-style: none;
  padding: 0;
  margin: 0 0 var(--space-4);
}
.chips li {
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--text-dim);
  background: var(--bg-chip);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 0.15rem 0.5rem;
  white-space: nowrap;
}

/* lightbox (Radix Dialog island) */
.lightbox-trigger {
  display: block;
  width: 100%;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--bg-panel);
  cursor: zoom-in;
}
.lightbox-trigger:hover { border-color: var(--border-hover); }
.lightbox-trigger img { width: 100%; }
.lightbox-overlay {
  position: fixed;
  inset: 0;
  background: rgba(10, 10, 12, 0.85);
}
.lightbox-content {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: var(--space-6);
}
.lightbox-content img {
  max-width: min(92vw, 1400px);
  max-height: 86vh;
  width: auto;
  border-radius: 6px;
}
.lightbox-close {
  position: fixed;
  top: var(--space-4);
  right: var(--space-5);
  font-family: var(--font-mono);
  font-size: 1.5rem;
  line-height: 1;
  color: var(--cream-2);
  background: none;
  border: none;
  cursor: pointer;
  padding: var(--space-2);
}
```

- [ ] **Step 3: Verify the build still passes**

```bash
npm run build
```

Expected: `Complete!` (styles aren't imported yet; this just guards against syntax typos when they're imported in Task 6).

- [ ] **Step 4: Commit**

```bash
git add src/styles/
git commit -m "feat: add charcoal/cream design tokens and global styles"
```

---

### Task 3: Content collections and project content

**Files:**
- Create: `src/content.config.ts`, `src/content/about.md`, `src/content/projects/*.md` (8 files)
- Move: `img/*.png` → `src/assets/`, `img/favicon.ico` → `public/favicon.ico`, `img/touchrender.mp4` → `public/media/touchrender.mp4`

- [ ] **Step 1: Move media assets to their new homes**

```bash
mkdir -p src/assets public/media
git mv img/headshot.png img/softserve-releases.png img/softserve-release.png \
  img/democontroller.png img/pgmscreenshotter.png img/statusmonitor.png \
  img/colonelroy.png src/assets/
git mv img/favicon.ico public/favicon.ico
git mv img/touchrender.mp4 public/media/touchrender.mp4
```

(`img/resume.png` stays for now — it's the transcription source; deleted in Task 15.)

- [ ] **Step 2: Create `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const projects = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/projects' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      anchor: z.string().regex(/^[a-z0-9-]+$/),
      order: z.number(),
      tools: z.array(z.string()).nonempty(),
      images: z
        .array(z.object({ src: image(), alt: z.string() }))
        .default([]),
      video: z
        .object({
          src: z.string(),
          caption: z.string().optional(),
        })
        .optional(),
      link: z
        .object({ label: z.string(), href: z.string().url() })
        .optional(),
    }),
});

const about = defineCollection({
  loader: glob({ pattern: 'about.md', base: './src/content' }),
  schema: z.object({}),
});

export const collections = { projects, about };
```

- [ ] **Step 3: Create `src/content/about.md`** (bio copy refreshed per spec — flag for Ryan's sign-off at the next checkpoint)

```md
---
{}
---
Hi there! I'm a computer scientist trained in video game development, with
professional on-set experience in XR and virtual production. My work centers
on DevOps, site reliability, and platform engineering.

I live on the Upper West Side of New York City and work for
[Lucasfilm](https://www.lucasfilm.com/) as a Production Engineer on
[ILM](https://www.ilm.com/)'s Platform team.
```

- [ ] **Step 4: Create the 8 project files** (content migrated from `portfolio.md`; Instagram embed replaced with a plain link per spec)

`src/content/projects/software-warehouse.md`:

```md
---
title: Software Warehouse API & Dashboard
anchor: software-warehouse
order: 1
tools: [Docker, Kubernetes, ScyllaDB, GraphQL, Rust, TypeScript, React, Python]
images:
  - src: ../../assets/softserve-releases.png
    alt: SoftServe dashboard listing software releases
  - src: ../../assets/softserve-release.png
    alt: SoftServe release detail view
---
ILM retains a massive internal library of software. The releasing and
distribution of this software library is tracked via a global database built
on ScyllaDB and Bevy. I helped lead development on SoftServe, the user-facing
portion of the software warehouse — an API built on GraphQL and a web
dashboard powered by React.

As part of this project, I also helped maintain and improve the CI/CD for the
software warehouse, and oversaw the migration of large parts of the warehouse
codebase from Python to Rust.
```

`src/content/projects/unreal-event-bus.md`:

```md
---
title: Unreal Engine Event Bus
anchor: unreal-event-bus
order: 2
tools: [Unreal Engine, AWS, InfluxDB, Grafana, C++, TypeScript]
---
Unreal Engine, via a plugin developed in C++, provides an API of methods to be
called from either code or visual scripting. This API allows any data desired
by the game developers (hardware info, performance metrics, progression data,
etc.) to be tracked; a serverless microservice backend (API Gateway, Lambda,
S3, Kinesis) submits the metrics and events to
[InfluxDB](https://www.influxdata.com/), which is then visualized in
[Grafana](https://grafana.com/).

I can't say much more or show the plugin in action in the interest of
respecting confidentiality — it is very powerful and extremely useful in all
phases of development: troubleshooting during development cycles, QA during
hardening cycles, and marketing and analytics post-release.
```

`src/content/projects/ghost-backup-dancers.md`:

```md
---
title: Ghost Backup Dancers
anchor: ghost-backup-dancers
order: 3
tools: [Notch, TouchDesigner]
link:
  label: Featured in XR Studios promotional material
  href: https://www.instagram.com/p/CVBWw-vhGOF/
---
Notch takes a video feed into its body tracking system, where two
[Mixamo](https://www.mixamo.com/) skeletons are mapped to mirror the movements
of the subject. A generative form is then procedurally created around the
skeletons to create a ghostly, holographic look. The PGM feed and light colors
from the studio's GrandMA2 are piped into Notch via a TouchDesigner applet.
```

`src/content/projects/demo-controller.md`:

```md
---
title: Demo Controller
anchor: demo-controller
order: 4
tools: [Xcode, Swift 5]
images:
  - src: ../../assets/democontroller.png
    alt: Demo Controller iPad app interface
---
A from-scratch iPad app to control the stage and studio during client
demonstrations. Allows the demonstrator to cue and control different scenes,
control the lights, fade down XR elements, and cut cameras with ease.
```

`src/content/projects/touchdesigner-renderstream.md`:

```md
---
title: TouchDesigner RenderStream
anchor: touchdesigner-renderstream
order: 5
tools: [TouchDesigner, Disguise, C++, Python]
video:
  src: /media/touchrender.mp4
  caption: >-
    A keyframed camera in Disguise (left) sends its stateful data to
    TouchDesigner (right). A 3D scene designed in TouchDesigner uses this as
    the data source for its own internal camera, and the resulting frames are
    sent back to Disguise and displayed on a theoretical LED volume stage.
---
A series of TouchDesigner
[custom operators](https://docs.derivative.ca/Custom_Operators) that implement
the Disguise [RenderStream API](https://github.com/disguise-one/RenderStream).
Allows any TouchDesigner texture to be sent to Disguise à la Unreal or Notch
RenderStream.
```

`src/content/projects/pgm-screenshotter.md`:

```md
---
title: PGM Screenshotter
anchor: pgm-screenshotter
order: 6
tools: [TypeScript, TouchDesigner, OBS Studio]
images:
  - src: ../../assets/pgmscreenshotter.png
    alt: PGM Screenshotter Slack bot in action
---
A Slack bot that allows users to easily take screenshots and short clips of
the program feed to show to clients, supervisors, or remote coworkers for
feedback.
```

`src/content/projects/status-monitor.md`:

```md
---
title: Status Monitor
anchor: status-monitor
order: 7
tools: [TypeScript, Prometheus, Grafana]
images:
  - src: ../../assets/statusmonitor.png
    alt: Status Monitor Grafana uptime dashboard
  - src: ../../assets/colonelroy.png
    alt: Status Monitor Slack alerting bot
---
Status Monitor is a Node.js app written in TypeScript that allows an extremely
wide range of connectability: any applet, software, hardware, or device that
can communicate externally via LAN (regardless of method) can have its uptime
monitored on a custom [Grafana](https://grafana.com/) page via
[Prometheus](https://prometheus.io/). It also runs a Slack bot and SMS/SMTP
alerting service that, when in show mode, sends out alerts when any connected
clients go down.
```

`src/content/projects/ofxxrs.md`:

```md
---
title: ofxXRS
anchor: ofxxrs
order: 8
tools: [C++, openFrameworks]
---
A graphical library for [openFrameworks](https://openframeworks.cc/) that
allows developers to create remote-control applications for non-technical end
users with a consistent, sleek aesthetic.

Essentially merges [ofxDatGui](https://github.com/braitsch/ofxDatGui),
[ofxSimpleButton](https://github.com/azuremous/ofxSimpleButton),
[ofxGuiExtended](https://github.com/frauzufall/ofxGuiExtended), and
[ofxClickMenu](https://github.com/MindBuffer/ofxClickMenu) into a single,
easier-to-reference API.
```

- [ ] **Step 5: Verify schemas validate**

```bash
npm run build
```

Expected: `Complete!` — content collections sync without schema errors. (To see validation work, temporarily misspell `tools:` in one file and re-run: build fails with a zod error. Restore it.)

- [ ] **Step 6: Commit**

```bash
git add src/content.config.ts src/content/ src/assets/ public/
git commit -m "feat: migrate portfolio content to validated content collections"
```

---

### Task 4: Site data and resume data

**Files:**
- Create: `src/data/site.ts`, `src/data/resume.yaml`, `src/data/resume-schema.ts`

- [ ] **Step 1: Create `src/data/site.ts`**

```ts
export const site = {
  name: 'Ryan Dwyer',
  tagline: 'Platform Engineer & Creative Technologist',
  url: 'https://rydwy.com',
  email: 'ryan@rydwy.com',
  github: 'https://github.com/ToxicBananaParty',
  linkedin: 'https://www.linkedin.com/in/ryandanieldwyer',
  description:
    'Ryan Dwyer is a Platform Engineer and Creative Technologist in New York City — DevOps, site reliability, XR, and virtual production.',
} as const;
```

- [ ] **Step 2: Create `src/data/resume.yaml`** (transcribed from `img/resume.png`)

```yaml
contact:
  website: rydwy.com
  phone: (513) 909-6416
  email: ryan@rydwy.com

education:
  - school: Miami University
    degrees:
      - B.A. in Interactive Media Studies
      - B.S. in Computer Science
    notes: >-
      Lead Developer of several immersive projection mapping experiences and
      game prototypes; oversaw virtual production CAVE construction and
      operation.

experience:
  - company: Lucasfilm
    roles:
      - title: Production Engineer
        dates: May 2023 – Present
        summary: "As part of ILM's Platform Team, I:"
        bullets:
          - developed prototype gameplay features alongside game designers
          - maintained and upgraded core technologies (TeamCity, Jenkins, etc.)
          - helped migrate every single machine from CentOS to Alma Linux
          - >-
            developed and maintained CI/CD build and release processes using
            Kubernetes and GitLab CI/CD
          - >-
            migrated large portions of our software distribution system's
            codebase from Python to Rust, improving performance, reliability,
            and memory safety
          - >-
            led development on a centralized notification system for internal
            downtime and maintenance, which massively increased the quality
            and consistency of alerting across the entire company
          - >-
            developed a frontend dashboard for tracking and managing releases
            made by our software distribution system
      - title: Backend Engineer
        dates: Sept 2022 – May 2023
        summary: >-
          As part of the Automation Team for the Advanced Development
          department, developed plugins for Unreal Engine to provide analytics
          & telemetry. Provided DevOps, CI/CD, and Perforce support for
          hundreds of designers and developers.
        bullets: []
  - company: XR Studios
    roles:
      - title: Creative Technologist
        dates: May 2021 – Sept 2022
        summary: >-
          Led development on proprietary systems and applications, mainly
          concerning studio control and pipeline automation. Oversaw version
          control & client-facing documentation.
        bullets: []

rdProjects:
  - name: Unreal Event Bus
    blurb: >-
      Realtime analytics from Unreal Engine to a Grafana dashboard through an
      AWS-based backend via a plugin developed in C++
  - name: Software Warehouse
    blurb: >-
      A ScyllaDB server written in Rust that allows tracking and management of
      software releases. Includes a Python client library, GraphQL API, and
      React/TypeScript web dashboard
  - name: P4 User Manager
    blurb: >-
      Collection of scripts and chatbots that enables producers to easily add,
      remove, and modify permissions for P4 users across dozens of servers
      located throughout the world
  - name: GhostDancers
    blurb: AR backup dancers ft. NVIDIA AI body tracking

skills:
  - C++
  - Rust
  - TypeScript / NodeJS
  - Python
  - VCS (Perforce, Git)
  - CI/CD (GitLab, Jenkins)
  - Ansible
  - Docker
  - Kubernetes
  - C#
  - TDD Writing
  - Bash & PowerShell
  - Incredibuild
  - AWS Microservices
  - HTML & CSS
  - Swift5
  - Unreal Engine
  - Unity Engine
  - Adobe Suite

credits:
  - '"The Proud Family" Virtual Concert'
  - 'TikTok LIVE: "Familia" Virtual Concert'
  - Pentatonix 2022 Holiday Virtual Concert
  - Porter Robinson "Star Guardian 2022"
  - Candy Cane Lane
  - 'Star Wars: Ahsoka (Season 1)'
  - 'Star Wars: The Mandalorian (Season 3)'
  - 'Star Wars: The Acolyte (Season 1)'
  - 'Star Wars: Andor (Season 2)'
  - 'Star Wars: Beyond Victory'
```

- [ ] **Step 3: Create `src/data/resume-schema.ts`** — validates the YAML at build time so a typo fails the build, not the live site.

```ts
// NOTE: import z from 'astro/zod' (NOT 'astro:content'). Under Astro 7 / Zod v4,
// astro:content re-exports z as a value-only binding, so `z.infer` in type
// position below fails `astro check`. 'astro/zod' is Astro's prescribed source.
import { z } from 'astro/zod';
import rawResume from './resume.yaml';

const roleSchema = z.object({
  title: z.string(),
  dates: z.string(),
  summary: z.string(),
  bullets: z.array(z.string()),
});

export const resumeSchema = z.object({
  contact: z.object({
    website: z.string(),
    phone: z.string(),
    email: z.string().email(),
  }),
  education: z.array(
    z.object({
      school: z.string(),
      degrees: z.array(z.string()).nonempty(),
      notes: z.string(),
    })
  ),
  experience: z.array(
    z.object({
      company: z.string(),
      roles: z.array(roleSchema).nonempty(),
    })
  ),
  rdProjects: z.array(z.object({ name: z.string(), blurb: z.string() })),
  skills: z.array(z.string()).nonempty(),
  credits: z.array(z.string()).nonempty(),
});

export type Resume = z.infer<typeof resumeSchema>;

export const resume: Resume = resumeSchema.parse(rawResume);
```

- [ ] **Step 4: Verify types and build**

```bash
npm run check && npm run build
```

Expected: 0 errors, `Complete!`.

- [ ] **Step 5: Commit**

```bash
git add src/data/
git commit -m "feat: add site config and schema-validated resume data"
```

---

### Task 5: Scraper-regression verification script (write it RED)

This is the project's test harness — an automated replica of the docsify failure: it reads **built HTML files** and asserts the content is literally present, no JavaScript executed. It also validates internal links and anchors. Written now, before the real pages exist, so it starts failing and each page task drives it toward green.

**Files:**
- Create: `scripts/verify-content.mjs`

- [ ] **Step 1: Create `scripts/verify-content.mjs`**

```js
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
```

- [ ] **Step 2: Run it — expect RED**

```bash
npm run build && npm run verify
```

Expected: FAILS with `MISSING PAGE: portfolio/index.html`, `MISSING PAGE: resume/index.html`, `MISSING PAGE: 404.html`, `MISSING FILE: og.png`, `MISSING FILE: resume.pdf`, plus CONTENT/META failures for `index.html`. This is the baseline the remaining tasks burn down.

- [ ] **Step 3: Commit**

```bash
git add scripts/verify-content.mjs
git commit -m "test: add scraper-regression verification script (currently red)"
```

---

### Task 6: Base layout, header, and footer

**Files:**
- Create: `src/layouts/Base.astro`, `src/components/Header.astro`, `src/components/Footer.astro`

- [ ] **Step 1: Create `src/layouts/Base.astro`**

```astro
---
import '@fontsource-variable/inter';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/700.css';
import '../styles/global.css';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { site } from '../data/site';

interface Props {
  title: string;
  description: string;
  ogType?: 'website' | 'profile';
}

const { title, description, ogType = 'website' } = Astro.props;
const canonical = new URL(Astro.url.pathname, site.url).href;
const ogImage = new URL('/og.png', site.url).href;
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{title}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonical} />
    <link rel="icon" href="/favicon.ico" sizes="32x32" />
    <link rel="sitemap" href="/sitemap-index.xml" />
    <meta property="og:site_name" content={site.name} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonical} />
    <meta property="og:type" content={ogType} />
    <meta property="og:image" content={ogImage} />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    <meta name="twitter:image" content={ogImage} />
    <slot name="head" />
  </head>
  <body>
    <Header />
    <main class="container">
      <slot />
    </main>
    <Footer />
  </body>
</html>
```

- [ ] **Step 2: Create `src/components/Header.astro`** — desktop links always in HTML (scrapable); `MobileNav` island is added in Task 9.

```astro
---
import { site } from '../data/site';

const links = [
  { href: '/portfolio/', label: 'Portfolio' },
  { href: '/resume/', label: 'Resumé' },
];
const current = Astro.url.pathname;
---

<header class="site-header">
  <div class="container header-row">
    <a href="/" class="mono wordmark">{site.name}</a>
    <nav aria-label="Main">
      <ul class="nav-links">
        {
          links.map(({ href, label }) => (
            <li>
              <a
                href={href}
                class="mono"
                aria-current={current.startsWith(href) ? 'page' : undefined}
              >
                {label}
              </a>
            </li>
          ))
        }
      </ul>
    </nav>
    <ul class="header-contact mono" aria-label="Contact">
      <li><a href={`mailto:${site.email}`}>Email</a></li>
      <li><a href={site.github} rel="me noopener">GitHub</a></li>
      <li><a href={site.linkedin} rel="me noopener">LinkedIn</a></li>
    </ul>
  </div>
</header>

<style>
  .site-header {
    border-bottom: 1px solid var(--border);
    background: var(--charcoal-2);
  }
  .header-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    padding-top: var(--space-4);
    padding-bottom: var(--space-4);
  }
  .wordmark {
    font-weight: 700;
    font-size: 1.05rem;
    color: var(--heading);
    text-decoration: none;
    letter-spacing: 0.02em;
  }
  .nav-links {
    display: flex;
    gap: var(--space-5);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .nav-links a {
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    text-decoration: none;
    color: var(--text-dim);
  }
  .nav-links a:hover,
  .nav-links a[aria-current='page'] {
    color: var(--link-hover);
  }
  .header-contact {
    display: flex;
    gap: var(--space-4);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .header-contact a {
    font-size: 0.75rem;
    color: var(--text-dim);
    text-decoration: none;
  }
  .header-contact a:hover {
    color: var(--link-hover);
  }
  @media (max-width: 900px) {
    .header-contact {
      display: none;
    }
  }
</style>
```

- [ ] **Step 3: Create `src/components/Footer.astro`** — contact links live here (and phone stays off it, per spec).

```astro
---
import { site } from '../data/site';
const year = new Date().getFullYear();
---

<footer class="site-footer">
  <div class="container footer-row">
    <ul class="contact-links mono">
      <li><a href={`mailto:${site.email}`}>Email</a></li>
      <li><a href={site.github} rel="me noopener">GitHub</a></li>
      <li><a href={site.linkedin} rel="me noopener">LinkedIn</a></li>
    </ul>
    <p class="mono copyright">© {year} {site.name}</p>
  </div>
</footer>

<style>
  .site-footer {
    margin-top: var(--space-8);
    border-top: 1px solid var(--border);
    background: var(--charcoal-2);
  }
  .footer-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    padding-top: var(--space-5);
    padding-bottom: var(--space-5);
  }
  .contact-links {
    display: flex;
    gap: var(--space-5);
    list-style: none;
    margin: 0;
    padding: 0;
  }
  .contact-links a,
  .copyright {
    font-size: 0.8rem;
    color: var(--text-dim);
  }
  .contact-links a:hover {
    color: var(--link-hover);
  }
  .copyright {
    margin: 0;
  }
</style>
```

- [ ] **Step 4: Verify build**

```bash
npm run check && npm run build
```

Expected: 0 errors, `Complete!` (layout not used by a page yet — that's next).

- [ ] **Step 5: Commit**

```bash
git add src/layouts/ src/components/
git commit -m "feat: add base layout with full meta/OG head, header, footer"
```

---

### Task 7: Home page

**Files:**
- Create/Replace: `src/pages/index.astro` (replaces Task 1 placeholder)

- [ ] **Step 1: Write `src/pages/index.astro`**

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

  <section class="hero">
    <Image
      src={headshot}
      alt="Headshot of Ryan Dwyer"
      width={480}
      densities={[1, 2]}
      class="headshot"
      loading="eager"
    />
    <h1>{site.name}</h1>
    <p class="mono tagline">{site.tagline}</p>
  </section>

  <section class="bio">
    <Content />
  </section>

  <nav class="cta-row" aria-label="Highlights">
    <a href="/portfolio/" class="mono cta">View portfolio →</a>
    <a href="/resume/" class="mono cta">Read resumé →</a>
  </nav>
</Base>

<style>
  .hero {
    text-align: center;
    padding-top: var(--space-8);
  }
  .headshot {
    width: 200px;
    height: 200px;
    object-fit: cover;
    border-radius: 50%;
    border: 1px solid var(--border-hover);
    margin: 0 auto var(--space-5);
  }
  .tagline {
    color: var(--text-dim);
    font-size: 0.9rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    margin-bottom: var(--space-7);
  }
  .bio {
    font-size: 1.125rem;
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
</style>
```

- [ ] **Step 2: Build and verify — home page checks go green**

```bash
npm run build && npm run verify
```

Expected: still FAILS overall, but no `CONTENT:`/`META:` failures for `index.html` remain. Remaining failures: missing `portfolio/`, `resume/`, `404.html`, `og.png`, `resume.pdf`.

- [ ] **Step 3: Eyeball it**

```bash
npm run dev
```

Open http://localhost:4321/ — headshot, name, mono tagline, bio, two CTA buttons, header/footer. Check http://localhost:4321/#/portfolio redirects to `/portfolio/` (404 for now — the redirect firing is what's being tested).

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro
git commit -m "feat: home page with bio, JSON-LD, and legacy hash redirects"
```

---

### Task 8: Portfolio page with project cards and Radix lightbox

**Files:**
- Create: `src/components/Lightbox.tsx`, `src/components/ProjectCard.astro`, `src/pages/portfolio.astro`

- [ ] **Step 1: Create `src/components/Lightbox.tsx`** — React island; receives pre-optimized URLs from Astro (the island itself does no image processing). Styles come from `global.css` (`.lightbox-*`, added in Task 2).

```tsx
import * as Dialog from '@radix-ui/react-dialog';

type Props = {
  thumbSrc: string;
  thumbWidth: number;
  thumbHeight: number;
  fullSrc: string;
  alt: string;
};

export default function Lightbox({
  thumbSrc,
  thumbWidth,
  thumbHeight,
  fullSrc,
  alt,
}: Props) {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button type="button" className="lightbox-trigger">
          <img
            src={thumbSrc}
            width={thumbWidth}
            height={thumbHeight}
            alt={alt}
            loading="lazy"
            decoding="async"
          />
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="lightbox-overlay" />
        <Dialog.Content className="lightbox-content" aria-describedby={undefined}>
          <Dialog.Title className="sr-only">{alt}</Dialog.Title>
          <img src={fullSrc} alt={alt} />
          <Dialog.Close asChild>
            <button type="button" className="lightbox-close" aria-label="Close">
              ×
            </button>
          </Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
```

- [ ] **Step 2: Create `src/components/ProjectCard.astro`**

```astro
---
import type { CollectionEntry } from 'astro:content';
import { render } from 'astro:content';
import { getImage } from 'astro:assets';
import Lightbox from './Lightbox.tsx';

interface Props {
  project: CollectionEntry<'projects'>;
}

const { project } = Astro.props;
const { title, anchor, tools, images, video, link } = project.data;
const { Content } = await render(project);

const gallery = await Promise.all(
  images.map(async ({ src, alt }) => {
    const thumb = await getImage({ src, width: 720, format: 'webp' });
    const full = await getImage({ src, format: 'webp' });
    return {
      alt,
      thumbSrc: thumb.src,
      thumbWidth: thumb.attributes.width,
      thumbHeight: thumb.attributes.height,
      fullSrc: full.src,
    };
  })
);
---

<article id={anchor} class="project">
  <h2><a class="anchor-link" href={`#${anchor}`}>{title}</a></h2>
  <ul class="chips" aria-label="Tools used">
    {tools.map((tool) => <li>{tool}</li>)}
  </ul>
  <div class="prose">
    <Content />
    {
      link && (
        <p class="mono project-link">
          <a href={link.href} rel="noopener">{link.label} ↗</a>
        </p>
      )
    }
  </div>
  {
    gallery.length > 0 && (
      <div class="gallery" data-count={gallery.length}>
        {gallery.map((img) => (
          <Lightbox client:visible {...img} />
        ))}
      </div>
    )
  }
  {
    video && (
      <figure class="video-figure">
        <video src={video.src} controls preload="metadata"></video>
        {video.caption && <figcaption>{video.caption}</figcaption>}
      </figure>
    )
  }
</article>

<style>
  .project {
    padding: var(--space-6) 0;
    border-bottom: 1px solid var(--border);
  }
  .project:last-child {
    border-bottom: none;
  }
  .project h2 {
    margin-top: 0;
  }
  .anchor-link {
    color: inherit;
    text-decoration: none;
  }
  .anchor-link:hover::after {
    content: ' #';
    color: var(--text-dim);
  }
  .project-link {
    font-size: 0.85rem;
  }
  .gallery {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
    margin-top: var(--space-4);
  }
  .gallery[data-count='1'] {
    grid-template-columns: 1fr;
  }
  @media (max-width: 640px) {
    .gallery {
      grid-template-columns: 1fr;
    }
  }
  .video-figure {
    margin: var(--space-4) 0 0;
  }
  .video-figure video {
    width: 100%;
    border: 1px solid var(--border);
    border-radius: 6px;
  }
  .video-figure figcaption {
    font-size: 0.85rem;
    color: var(--text-dim);
    margin-top: var(--space-2);
  }
</style>
```

- [ ] **Step 3: Create `src/pages/portfolio.astro`**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../layouts/Base.astro';
import ProjectCard from '../components/ProjectCard.astro';
import { site } from '../data/site';

const projects = (await getCollection('projects')).sort(
  (a, b) => a.data.order - b.data.order
);
---

<Base
  title={`Portfolio — ${site.name}`}
  description="Selected projects by Ryan Dwyer: platform engineering, XR and virtual production tooling, real-time graphics, and studio automation."
>
  <h1>Portfolio</h1>
  <p>
    A small sampling of the projects I have developed. Note that I am not at
    liberty to talk about a lot of the really cool — but proprietary — things
    I've made and worked on.
  </p>
  {projects.map((project) => <ProjectCard project={project} />)}
</Base>
```

- [ ] **Step 4: Build and verify — portfolio checks go green**

```bash
npm run build && npm run verify
```

Expected: no failures mention `portfolio/index.html`. Remaining failures: `resume/`, `404.html`, `og.png`, `resume.pdf`.

- [ ] **Step 5: Eyeball the lightbox**

```bash
npm run dev
```

On http://localhost:4321/portfolio/ confirm: 8 projects in order, tool chips, images in a grid; clicking an image opens the Radix dialog; Esc and the × close it; the video shows controls and does not autoload fully (`preload="metadata"`).

- [ ] **Step 6: Commit**

```bash
git add src/components/Lightbox.tsx src/components/ProjectCard.astro src/pages/portfolio.astro
git commit -m "feat: portfolio page with project cards and Radix Dialog lightbox"
```

---

### Task 9: Mobile navigation island

**Files:**
- Create: `src/components/MobileNav.tsx`
- Modify: `src/components/Header.astro`

- [ ] **Step 1: Create `src/components/MobileNav.tsx`**

```tsx
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

const LINKS = [
  { href: '/', label: 'About' },
  { href: '/portfolio/', label: 'Portfolio' },
  { href: '/resume/', label: 'Resumé' },
];

export default function MobileNav() {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger asChild>
        <button type="button" className="mobile-nav-trigger" aria-label="Menu">
          Menu
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="mobile-nav-content"
          align="end"
          sideOffset={8}
        >
          {LINKS.map(({ href, label }) => (
            <DropdownMenu.Item key={href} asChild>
              <a className="mobile-nav-item" href={href}>
                {label}
              </a>
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
```

- [ ] **Step 2: Add the island and mobile styles to `src/components/Header.astro`**

Add the import to the frontmatter:

```astro
import MobileNav from './MobileNav.tsx';
```

Add the island after the `<nav>` element (inside `.header-row`):

```astro
<div class="mobile-nav-slot">
  <MobileNav client:media="(max-width: 640px)" />
</div>
```

Append to the `<style>` block (the mobile nav styles are global because Radix portals the menu content to `<body>`):

```astro
<style>
  /* ...existing styles from Task 6 stay unchanged... */
  .mobile-nav-slot {
    display: none;
  }
  @media (max-width: 640px) {
    nav[aria-label='Main'] {
      display: none;
    }
    .mobile-nav-slot {
      display: block;
    }
  }
</style>

<style is:global>
  .mobile-nav-trigger {
    font-family: var(--font-mono);
    font-size: 0.85rem;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    color: var(--text-dim);
    background: none;
    border: 1px solid var(--border);
    border-radius: 6px;
    padding: var(--space-2) var(--space-3);
    cursor: pointer;
  }
  .mobile-nav-content {
    background: var(--charcoal-3);
    border: 1px solid var(--border-hover);
    border-radius: 6px;
    padding: var(--space-2);
    min-width: 180px;
  }
  .mobile-nav-item {
    display: block;
    font-family: var(--font-mono);
    font-size: 0.9rem;
    color: var(--text);
    text-decoration: none;
    padding: var(--space-2) var(--space-3);
    border-radius: 4px;
    outline: none;
  }
  .mobile-nav-item[data-highlighted] {
    background: var(--charcoal-5);
    color: var(--link-hover);
  }
</style>
```

- [ ] **Step 3: Verify responsively**

```bash
npm run dev
```

At http://localhost:4321/ shrink the viewport below 640px: inline links disappear, "Menu" button appears, opens a dropdown with About/Portfolio/Resumé; keyboard (Tab, Enter, arrows, Esc) works. Above 640px the island never hydrates (check the network tab: no MobileNav JS loaded on desktop).

- [ ] **Step 4: Build clean, then commit**

```bash
npm run check && npm run build && npm run verify
git add src/components/MobileNav.tsx src/components/Header.astro
git commit -m "feat: Radix dropdown mobile navigation island"
```

Expected verify failures unchanged: `resume/`, `404.html`, `og.png`, `resume.pdf`.

---

### Task 10: Resume page with print stylesheet

**Files:**
- Create: `src/pages/resume.astro`

- [ ] **Step 1: Create `src/pages/resume.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import { site } from '../data/site';
import { resume } from '../data/resume-schema';
---

<Base
  title={`Resumé — ${site.name}`}
  description="Resumé of Ryan Dwyer — Platform Engineer: Lucasfilm/ILM production engineering, XR Studios creative technology, DevOps, CI/CD, Rust, and virtual production."
>
  <div class="resume-head">
    <div>
      <h1>{site.name}</h1>
      <p class="mono resume-title">Platform Engineer</p>
    </div>
    <a href="/resume.pdf" class="mono download" download>Download PDF ↓</a>
  </div>

  <p class="mono contact-line">
    {resume.contact.website} · {resume.contact.email} · {resume.contact.phone}
  </p>

  <section aria-labelledby="education">
    <h2 id="education">Education</h2>
    {
      resume.education.map((edu) => (
        <div class="entry">
          <h3>{edu.school}</h3>
          <ul class="degrees mono">
            {edu.degrees.map((d) => (
              <li>{d}</li>
            ))}
          </ul>
          <p>{edu.notes}</p>
        </div>
      ))
    }
  </section>

  <section aria-labelledby="experience">
    <h2 id="experience">Work Experience</h2>
    {
      resume.experience.map((job) => (
        <div class="entry">
          <h3>{job.company}</h3>
          {job.roles.map((role) => (
            <div class="role">
              <p class="mono role-line">
                <strong>{role.title}</strong>
                <span class="dates">{role.dates}</span>
              </p>
              <p>{role.summary}</p>
              {role.bullets.length > 0 && (
                <ul>
                  {role.bullets.map((b) => (
                    <li>{b}</li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      ))
    }
  </section>

  <section aria-labelledby="rd-projects">
    <h2 id="rd-projects">R&amp;D Projects</h2>
    {
      resume.rdProjects.map((p) => (
        <p class="rd-project">
          <strong class="mono">{p.name}</strong> — {p.blurb}
        </p>
      ))
    }
  </section>

  <section aria-labelledby="skills">
    <h2 id="skills">Skills &amp; Training</h2>
    <ul class="chips" aria-label="Skills">
      {resume.skills.map((s) => <li>{s}</li>)}
    </ul>
  </section>

  <section aria-labelledby="credits">
    <h2 id="credits">Credits (Selected)</h2>
    <ul class="credits">
      {resume.credits.map((c) => <li>{c}</li>)}
    </ul>
  </section>
</Base>

<style>
  .resume-head {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: var(--space-4);
    flex-wrap: wrap;
    padding-top: var(--space-6);
  }
  .resume-head h1 {
    margin-bottom: var(--space-1);
  }
  .resume-title {
    color: var(--text-dim);
    text-transform: uppercase;
    letter-spacing: 0.12em;
    font-size: 0.85rem;
    margin: 0;
  }
  .download {
    display: inline-block;
    padding: var(--space-2) var(--space-4);
    border: 1px solid var(--border-hover);
    border-radius: 6px;
    background: var(--bg-panel);
    color: var(--heading);
    text-decoration: none;
    font-size: 0.85rem;
    white-space: nowrap;
  }
  .download:hover {
    border-color: var(--cream-8);
  }
  .contact-line {
    color: var(--text-dim);
    font-size: 0.85rem;
    margin-top: var(--space-3);
  }
  .entry {
    margin-bottom: var(--space-5);
  }
  .degrees {
    list-style: none;
    padding: 0;
    margin: 0 0 var(--space-2);
    font-size: 0.9rem;
  }
  .role {
    margin: var(--space-3) 0 var(--space-4);
  }
  .role-line {
    display: flex;
    justify-content: space-between;
    gap: var(--space-3);
    flex-wrap: wrap;
    margin-bottom: var(--space-2);
    font-size: 0.95rem;
  }
  .dates {
    color: var(--text-dim);
    font-size: 0.85rem;
  }
  .role ul {
    margin: var(--space-2) 0 0;
    padding-left: 1.2rem;
  }
  .role li {
    margin-bottom: var(--space-1);
  }
  .rd-project {
    margin-bottom: var(--space-3);
  }
  .credits {
    columns: 2;
    column-gap: var(--space-6);
    padding-left: 1.2rem;
    margin: 0;
  }
  .credits li {
    margin-bottom: var(--space-2);
    break-inside: avoid;
  }
  @media (max-width: 640px) {
    .credits {
      columns: 1;
    }
  }

  /* Print = the PDF layout: cream paper, dark ink, chrome hidden */
  @media print {
    :global(body) {
      background: #fdfdf4;
      color: #1c1c20;
      font-size: 10.5pt;
    }
    :global(.site-header),
    :global(.site-footer),
    .download {
      display: none;
    }
    :global(h1),
    :global(h2),
    :global(h3) {
      color: #17171a;
    }
    .resume-title,
    .contact-line,
    .dates {
      color: #55554a;
    }
    :global(.chips li) {
      background: #f0f0d8;
      border-color: #cbcb92;
      color: #3a3a20;
    }
    section {
      break-inside: avoid-page;
    }
  }
</style>
```

- [ ] **Step 2: Build and verify — resume checks go green**

```bash
npm run build && npm run verify
```

Expected: no failures mention `resume/index.html`. Remaining: `404.html`, `og.png`, `resume.pdf`.

- [ ] **Step 3: Eyeball screen + print**

```bash
npm run dev
```

On http://localhost:4321/resume/ check all five sections render with real content. Then open the browser print preview: cream background, dark text, no header/footer/download button, sensible page breaks.

- [ ] **Step 4: Commit**

```bash
git add src/pages/resume.astro
git commit -m "feat: HTML resume page with print stylesheet"
```

---

### Task 11: 404 page and robots.txt

**Files:**
- Create: `src/pages/404.astro`, `public/robots.txt`

- [ ] **Step 1: Create `src/pages/404.astro`**

```astro
---
import Base from '../layouts/Base.astro';
import { site } from '../data/site';
---

<Base title={`404 — ${site.name}`} description="Page not found on rydwy.com.">
  <section class="notfound">
    <h1 class="mono">404</h1>
    <p>That page doesn't exist.</p>
    <p class="mono">
      <a href="/">← Back to rydwy.com</a>
    </p>
  </section>
</Base>

<style>
  .notfound {
    text-align: center;
    padding: var(--space-8) 0;
  }
  .notfound h1 {
    font-size: 4rem;
    margin-bottom: var(--space-2);
  }
</style>
```

- [ ] **Step 2: Create `public/robots.txt`**

```
User-agent: *
Allow: /

Sitemap: https://rydwy.com/sitemap-index.xml
```

- [ ] **Step 3: Build and verify**

```bash
npm run build && npm run verify
```

Expected: only two failures left — `MISSING FILE: og.png` and `MISSING FILE: resume.pdf` (generated next task).

- [ ] **Step 4: Commit**

```bash
git add src/pages/404.astro public/robots.txt
git commit -m "feat: 404 page and robots.txt"
```

---

### Task 12: Generate og.png and resume.pdf artifacts

One-time generation with Playwright; the outputs are **committed** to `public/` so CI never needs a browser. Regenerate by re-running the scripts whenever the resume or brand changes.

**Files:**
- Create: `scripts/generate-og.mjs`, `scripts/generate-pdf.mjs`
- Create (generated): `public/og.png`, `public/resume.pdf`

- [ ] **Step 1: Install the Playwright browser (one-time, local only)**

```bash
npx playwright install chromium
```

- [ ] **Step 2: Create `scripts/generate-og.mjs`** — renders a 1200×630 brand card and screenshots it.

```js
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
  p  { color: #a9a9b5; font-size: 34px; margin-top: 18px;
       text-transform: uppercase; letter-spacing: 6px; }
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
```

- [ ] **Step 3: Create `scripts/generate-pdf.mjs`** — serves the built site, prints `/resume/` (the print stylesheet from Task 10 is the PDF layout).

```js
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
```

- [ ] **Step 4: Generate both artifacts**

```bash
node scripts/generate-og.mjs
npm run build && node scripts/generate-pdf.mjs
```

Expected: `✓ wrote public/og.png` (open it — charcoal card, cream name, no rendering glitches) and `✓ wrote public/resume.pdf` (open it — cream paper, all five sections, no clipped content).

- [ ] **Step 5: Full verify goes GREEN**

```bash
npm run build && npm run verify
```

Expected: `✓ verify-content: all raw-HTML content, meta, link, and file checks passed` — the scraper-regression harness is fully green for the first time.

- [ ] **Step 6: Commit**

```bash
git add scripts/generate-og.mjs scripts/generate-pdf.mjs public/og.png public/resume.pdf
git commit -m "feat: branded og image and print-generated resume PDF"
```

---

### Task 13: Static server for the Bitnami box

**Files:**
- Create: `server/app.mjs`

- [ ] **Step 1: Create `server/app.mjs`** (`.mjs` so it runs standalone on the server regardless of any package.json; Express is resolved from `/opt/bitnami/projects/rydwy/node_modules` at runtime there).

```js
// Static server for rydwy.com — deployed to /opt/bitnami/projects/rydwy/app.mjs
// Serves the `current/dist` symlink target; a deploy flips the symlink and
// takes effect without restarting this process.
import express from 'express';
import path from 'node:path';

const DIST = process.env.DIST_DIR ?? '/opt/bitnami/projects/rydwy/current/dist';
const PORT = Number(process.env.PORT ?? 3000);

const app = express();
app.disable('x-powered-by');

app.use(
  express.static(DIST, {
    extensions: ['html'],
    setHeaders(res, filePath) {
      if (filePath.includes(`${path.sep}_astro${path.sep}`)) {
        // hashed asset filenames — safe to cache forever
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=3600');
      }
    },
  })
);

app.use((_req, res) => {
  // Express 5's res.sendFile throws NotFoundError on an absolute path; use the
  // { root } form with a relative filename instead.
  res.status(404).sendFile('404.html', { root: DIST });
});

app.listen(PORT, () => {
  console.log(`rydwy.com serving ${DIST} on :${PORT}`);
});
```

- [ ] **Step 2: Test it locally against the real build**

```bash
npm run build
DIST_DIR="$PWD/dist" node server/app.mjs &
sleep 1
curl -s -o /dev/null -w '/:            %{http_code}\n' http://localhost:3000/
curl -s -o /dev/null -w '/portfolio/:  %{http_code}\n' http://localhost:3000/portfolio/
curl -s -o /dev/null -w '/nope:        %{http_code}\n' http://localhost:3000/nope
curl -s -o /dev/null -w 'video range:  %{http_code}\n' -H 'Range: bytes=0-99' http://localhost:3000/media/touchrender.mp4
curl -sI http://localhost:3000/ | grep -i cache-control
kill %1
```

Expected: `200`, `200`, `404`, `206` (range support for the video), and `Cache-Control: no-cache` on the HTML response.

- [ ] **Step 3: Prove the scraper problem is fixed at the HTTP layer**

```bash
DIST_DIR="$PWD/dist" node server/app.mjs &
sleep 1
curl -s http://localhost:3000/portfolio/ | grep -c 'Ghost Backup Dancers'
kill %1
```

Expected: `1` or more — a plain `curl` (no JavaScript) now receives the portfolio content. This exact command returned nothing useful against the docsify site.

- [ ] **Step 4: Commit**

```bash
git add server/app.mjs
git commit -m "feat: minimal static Express server for Bitnami deployment"
```

---

### Task 14: GitHub Actions deploy workflow and deployment docs

No CI/CD exists today — this task creates the workflow file and the one-time setup runbook. The human steps (key generation, GitHub secrets, server prep) are Ryan's to run from the runbook; the code steps below are committable immediately.

**Files:**
- Create: `.github/workflows/deploy.yml`, `docs/deployment.md`

- [ ] **Step 1: Create `.github/workflows/deploy.yml`**

```yaml
name: Build & Deploy

on:
  push:
    branches: [main]
  workflow_dispatch:

concurrency:
  group: deploy
  cancel-in-progress: false

jobs:
  build-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm

      - name: Install
        run: npm ci

      - name: Typecheck & schema validation
        run: npm run check

      - name: Build
        run: npm run build

      - name: Scraper-regression verification
        run: npm run verify

      - name: Set up SSH
        env:
          SSH_KEY: ${{ secrets.DEPLOY_SSH_KEY }}
          SSH_HOST: ${{ secrets.DEPLOY_HOST }}
        run: |
          mkdir -p ~/.ssh
          printf '%s\n' "$SSH_KEY" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key
          ssh-keyscan -H "$SSH_HOST" >> ~/.ssh/known_hosts

      - name: Deploy (rsync release + atomic symlink flip)
        env:
          HOST: ${{ secrets.DEPLOY_HOST }}
          USER: ${{ secrets.DEPLOY_USER }}
        run: |
          set -euo pipefail
          BASE="/opt/bitnami/projects/rydwy"
          RELEASE="$BASE/releases/${GITHUB_SHA::12}"
          SSH="ssh -i ~/.ssh/deploy_key"

          $SSH "$USER@$HOST" "mkdir -p '$RELEASE'"
          rsync -az --delete -e "$SSH" dist "$USER@$HOST:$RELEASE/"
          rsync -az -e "$SSH" server/app.mjs "$USER@$HOST:$BASE/app.mjs"
          $SSH "$USER@$HOST" "
            set -e
            ln -sfn '$RELEASE' '$BASE/current.tmp'
            mv -Tf '$BASE/current.tmp' '$BASE/current'
            cd '$BASE/releases' && ls -1t | tail -n +6 | xargs -r rm -rf
          "

      - name: Smoke-check live site
        run: |
          sleep 3
          curl -sf https://rydwy.com/portfolio/ | grep -q 'Ghost Backup Dancers'
          echo '✓ live site serves portfolio content in raw HTML'
```

- [ ] **Step 2: Create `docs/deployment.md`**

````md
# Deployment

## How it works

Push to `main` → GitHub Actions: `npm ci` → `astro check` → `astro build` →
`verify-content` (content must exist in built HTML) → rsync to the Lightsail
box as `releases/<sha>/` → atomic `current` symlink flip → live smoke check.
A failure at any step leaves the live site untouched. The last 5 releases are
kept on the server.

Server layout (`/opt/bitnami/projects/rydwy/`):

```
app.mjs                  static Express server (serves current/dist, port 3000)
start.sh                 runs app.mjs with Bitnami's node
node_modules/            just express (installed once on the box)
releases/<sha>/dist/     one directory per deploy
current -> releases/<sha>
```

Symlink flips take effect without restarting node. Restart node only when
`app.mjs` itself changes (the workflow rsyncs it to `$BASE/app.mjs`, but the
running process keeps the old code until restarted).

## One-time setup (already done? skip)

1. **Deploy key** (on your machine):
   ```bash
   ssh-keygen -t ed25519 -f /tmp/rydwy_deploy -N '' -C 'rydwy-deploy'
   ```
2. **Server** (`ssh bitnami@<lightsail-ip>`):
   ```bash
   cat >> ~/.ssh/authorized_keys   # paste /tmp/rydwy_deploy.pub contents
   mkdir -p /opt/bitnami/projects/rydwy/releases
   cd /opt/bitnami/projects/rydwy && npm install express@^4
   ```
3. **GitHub repo secrets** (Settings → Secrets and variables → Actions):
   - `DEPLOY_SSH_KEY` — contents of `/tmp/rydwy_deploy` (the private key)
   - `DEPLOY_HOST` — the Lightsail instance IP/hostname
   - `DEPLOY_USER` — `bitnami`

   Then delete `/tmp/rydwy_deploy*` locally.
4. **start.sh on the server** — replace its contents with:
   ```bash
   #!/bin/bash
   /opt/bitnami/node/bin/node /opt/bitnami/projects/rydwy/app.mjs
   ```
5. **Cutover:** run the workflow once (push to `main`, or Actions →
   Build & Deploy → Run workflow). Confirm `current/dist` exists on the
   server. Stop the old docsify node process however it's currently run,
   then start via `start.sh` (same port 3000, so the Bitnami reverse proxy
   needs no changes).

   Note: the workflow's final "Smoke-check live site" step will FAIL until
   this cutover is done (the old docsify process is still answering on
   port 3000). The deploy itself has still succeeded — re-run the workflow
   after cutover to see it fully green.

## Manual fallback (no GitHub Actions)

```bash
ssh bitnami@<lightsail-ip>
cd /opt/bitnami/projects/rydwy/repo   # a git clone of this repository
git pull
npm ci && npm run build && npm run verify
RELEASE="/opt/bitnami/projects/rydwy/releases/manual-$(date +%Y%m%d%H%M%S)"
mkdir -p "$RELEASE" && cp -R dist "$RELEASE/dist"
cp server/app.mjs /opt/bitnami/projects/rydwy/app.mjs
ln -sfn "$RELEASE" /opt/bitnami/projects/rydwy/current.tmp
mv -Tf /opt/bitnami/projects/rydwy/current.tmp /opt/bitnami/projects/rydwy/current
```

## Regenerating committed artifacts

- Resume changed → `npm run build && node scripts/generate-pdf.mjs`, commit
  `public/resume.pdf`.
- Brand/name changed → `node scripts/generate-og.mjs`, commit `public/og.png`.
````

- [ ] **Step 3: Validate the workflow YAML parses**

```bash
node -e "const y=require('yaml'); y.parse(require('fs').readFileSync('.github/workflows/deploy.yml','utf8')); console.log('yaml ok')" 2>/dev/null \
  || npx --yes yaml-lint .github/workflows/deploy.yml
```

Expected: `yaml ok` (or yaml-lint reporting valid).

- [ ] **Step 4: Commit**

```bash
git add .github/workflows/deploy.yml docs/deployment.md
git commit -m "ci: GitHub Actions build/verify/deploy pipeline with runbook"
```

**Human checklist for Ryan (from the runbook, cannot be automated here):** generate the deploy key, add the three GitHub secrets, prep the server directories + express install, update `start.sh` on the box, and do the one-time cutover from the docsify process.

---

### Task 15: Legacy cleanup and final verification

**Files:**
- Delete: `index.html`, `_sidebar.md`, `portfolio.md`, `resume.md`, `contact.md`, `.nojekyll`, `app.js`, `start.sh`, `img/resume.png` (transcribed in Task 4; the `img/` dir is now empty)
- Replace: `README.md` (docsify About content → repo documentation)

- [ ] **Step 1: Remove the docsify site and old server**

```bash
git rm index.html _sidebar.md portfolio.md resume.md contact.md .nojekyll app.js start.sh img/resume.png
```

(`start.sh` is deleted from the repo because the canonical copy now lives on the server per `docs/deployment.md`; keeping a stale copy here would drift.)

- [ ] **Step 2: Replace `README.md`**

```md
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
```

- [ ] **Step 3: Full verification suite**

```bash
npm run check && npm run build && npm run verify
```

Expected: 0 check errors, `Complete!`, and `✓ verify-content: all raw-HTML content, meta, link, and file checks passed`.

- [ ] **Step 4: Final manual pass**

```bash
npm run preview
```

- All four pages at http://localhost:4321 render correctly at desktop and mobile widths
- Lighthouse (Chrome DevTools) on `/` and `/portfolio/`: Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95
- `curl -s http://localhost:4321/resume/ | grep Lucasfilm` returns content
- Paste a page's HTML `<head>` into an OG preview checker (e.g. opengraph.xyz) after launch to confirm unfurls

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "chore: remove docsify site, replace README with repo docs"
```

---

## Post-plan launch checklist (after merge to main)

1. Ryan completes the one-time setup in `docs/deployment.md` (key, secrets, server prep, start.sh).
2. First Actions run deploys; smoke-check step confirms live content.
3. Cut over the node process on the box (stop docsify Express, start `app.mjs` via `start.sh`).
4. Validate link unfurls: paste `https://rydwy.com` and `/portfolio/` into Slack/iMessage/LinkedIn post composer.
5. Optional: request re-crawl in Google Search Console.







