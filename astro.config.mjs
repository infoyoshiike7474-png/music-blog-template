import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  // 独自ドメインを取得したら、こちらもそのドメインに変更してください
  site: 'https://music-blog-template.akarumi.workers.dev',
  integrations: [sitemap()],
  vite: {
    plugins: [tailwindcss()],
  },
});
