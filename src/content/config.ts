import { defineCollection, z } from 'astro:content';

const posts = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string().default(''),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // アイキャッチ画像: public/ 配下のパス、または外部URL
    image: z.string().optional(),
    imageAlt: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // アフィリエイトリンクを含む記事は true にする（景品表示法のPR表記対応）
    affiliate: z.boolean().default(false),
  }),
});

export const collections = { posts };
