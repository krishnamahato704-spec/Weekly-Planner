import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';
import {DEFAULT_SITE_ORIGIN, resolveSiteOrigin} from './site.config.ts';

export default defineConfig(({ mode }) => {
  const siteOrigin = resolveSiteOrigin(loadEnv(mode, process.cwd(), 'VITE_SITE_URL').VITE_SITE_URL);
  return {
    plugins: [react(), tailwindcss(), {
      name: 'planner-public-metadata',
      transformIndexHtml: html => html.replaceAll(DEFAULT_SITE_ORIGIN, siteOrigin),
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'robots.txt', source: `User-agent: *\nAllow: /\nDisallow: /api/\nSitemap: ${siteOrigin}/sitemap.xml\n` });
        this.emitFile({ type: 'asset', fileName: 'sitemap.xml', source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${siteOrigin}/</loc></url></urlset>\n` });
      },
    }],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
