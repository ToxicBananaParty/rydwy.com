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
start.sh                 the rydwy systemd service's ExecStart; runs app.mjs
node_modules/            just express (installed once on the box)
releases/<sha>/dist/     one directory per deploy
current -> releases/<sha>
```

The server runs as a systemd service (`rydwy.service`, enabled at boot) whose
`ExecStart` is `start.sh`. Symlink flips take effect on the next request without
restarting anything — `app.mjs` serves through the `current/dist` path, so each
request follows the freshly-flipped symlink live. Restart the service only when
`app.mjs` itself changes (the workflow rsyncs it to `$BASE/app.mjs`, but the
running process keeps the old code until restarted):

```bash
sudo systemctl restart rydwy
```

The deploy workflow does not restart the service, so content-only deploys (the
common case) apply instantly via the symlink with zero downtime.

## One-time setup (already done? skip)

1. **Deploy key** (on your machine):
   ```bash
   ssh-keygen -t ed25519 -f /tmp/rydwy_deploy -N '' -C 'rydwy-deploy'
   ```
2. **Authorize the deploy key + prep the box.** Install the key from your
   machine (`ssh-copy-id` appends it and sets correct perms), then prep the
   server:
   ```bash
   # from your Mac:
   ssh-copy-id -i /tmp/rydwy_deploy.pub bitnami@<lightsail-ip>
   # then on the box:
   ssh bitnami@<lightsail-ip>
   sudo apt-get update && sudo apt-get install -y rsync   # deploy transport (both ends need it)
   mkdir -p /opt/bitnami/projects/rydwy/releases
   cd /opt/bitnami/projects/rydwy && npm install express@^5
   ```
3. **GitHub repo secrets** (Settings → Secrets and variables → Actions):
   - `DEPLOY_SSH_KEY` — contents of `/tmp/rydwy_deploy` (the private key)
   - `DEPLOY_HOST` — the Lightsail instance IP/hostname
   - `DEPLOY_USER` — `bitnami`

   Then delete `/tmp/rydwy_deploy*` locally.
4. **Point the service at the new server.** Edit
   `/opt/bitnami/projects/rydwy/start.sh` (the `rydwy` service's `ExecStart`) to
   launch `app.mjs` instead of the old `app.js`:
   ```bash
   #!/bin/bash
   exec /opt/bitnami/node/bin/node /opt/bitnami/projects/rydwy/app.mjs
   ```
   `exec` makes node the service's main process so `systemctl` signals it
   directly; the unit file itself needs no changes.
5. **Cutover:** run the workflow once (push to `main`, or Actions →
   Build & Deploy → Run workflow) and confirm `current/dist` now exists on the
   server — it must exist before the restart, or `app.mjs` has nothing to serve.
   Then restart the service (same port 3000, so the Bitnami reverse proxy needs
   no changes):
   ```bash
   sudo systemctl restart rydwy
   sudo systemctl status rydwy    # expect: active (running), running app.mjs
   curl -s localhost:3000/portfolio/ | grep -c 'Ghost Backup Dancers'   # ≥1
   ```

   Note: the workflow's final "Smoke-check live site" step will FAIL until this
   restart happens (the old docsify process is still answering on port 3000).
   The deploy itself still succeeded — re-run the workflow after cutover to see
   it fully green.

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
