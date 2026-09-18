import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 独自ドメインやCloudflare PagesのURLに合わせて変更してください
  site: 'https://example.pages.dev',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
