import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://ticraft.cl',
  output: 'static',
  integrations: [sitemap()],
  build: { inlineStylesheets: 'never' },
});
