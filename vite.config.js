import { defineConfig } from 'vite';
import { resolve } from 'path';
import { injectContent } from './src/shop/render.js';

// Prerender the shop's static regions into index.html, in dev and in the build
// alike, so the served page is complete and readable with JavaScript disabled.
const prerender = {
  name: 'porp-prerender',
  transformIndexHtml: {
    order: 'pre',
    handler: (html, ctx) =>
      ctx.filename.replace(/\\/g, '/').endsWith('index.html') ? injectContent(html) : html,
  },
};

export default defineConfig({
  root: '.',
  publicDir: 'public',
  plugins: [prerender],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        // index.html = the shop; porp.html = the original WebGL piece, preserved.
        main: resolve(__dirname, 'index.html'),
        porp: resolve(__dirname, 'porp.html'),
      },
    },
  },
});
