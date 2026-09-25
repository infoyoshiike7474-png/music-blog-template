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
    // SpotifyアーティストIDを指定すると、公式埋め込みプレイヤーを記事内に表示する
    spotifyArtistId: z.string().optional(),
    // アフィリエイトリンクを含む記事は true にする（景品表示法のPR表記対応）
    affiliate: z.boolean().default(false),
    // 運営関係者が携わるアーティストを含む記事は true にする（利益相反の開示対応）
    operatorAffiliated: z.boolean().default(false),
  }),
});

export const collections = { posts };
