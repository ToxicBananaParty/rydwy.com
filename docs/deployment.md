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
