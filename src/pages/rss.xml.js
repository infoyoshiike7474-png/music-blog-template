import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = (await getCollection('posts', ({ data }) => !data.draft)).sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf()
  );

  return rss({
    title: 'AKARUMI SONGS',
    description: 'AIが選ぶ、音楽ニュース＆コラム（運営: AKARUMI MUSIC）',
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.pubDate,
      link: `/posts/${post.slug}/`,
      categories: post.data.tags,
    })),
    customData: `<language>ja</language>`,
  });
}
