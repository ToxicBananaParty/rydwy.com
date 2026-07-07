import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import yaml from '@rollup/plugin-yaml';

export default defineConfig({
  site: 'https://rydwy.com',
  integrations: [react(), sitemap()],
  vite: { plugins: [yaml()] },
});
