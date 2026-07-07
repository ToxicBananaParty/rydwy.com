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
  // Express 5's res.sendFile throws NotFoundError on an absolute path, so pass
  // the filename relative to a { root } — this serves the styled 404 page.
  res.status(404).sendFile('404.html', { root: DIST });
});

app.listen(PORT, () => {
  console.log(`rydwy.com serving ${DIST} on :${PORT}`);
});
