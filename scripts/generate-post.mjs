#!/usr/bin/env node
/**
 * Markdown記事の自動生成スクリプト。
 *
 * CLI引数、または --json でJSONファイルを渡して
 * title / body / image / tags を反映した .md を
 * src/content/posts/ に生成する。他の自動生成パイプライン
 * (RSS取り込み、AI生成など) から呼び出す用途を想定。
 *
 * 使い方:
 *   node scripts/generate-post.mjs \
 *     --title "新譜レビュー：〇〇" \
 *     --body "本文をここに書く（Markdown可）" \
 *     --image "/images/posts/example.jpg" \
 *     --tags "レビュー,新譜,J-POP" \
 *     --description "一言要約"
 *
 *   node scripts/generate-post.mjs --body-file draft.md --title "..."
 *
 *   node scripts/generate-post.mjs --json data.json
 *     # data.json: { "title": "...", "body": "...", "image": "...", "tags": [...] }
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const POSTS_DIR = resolve(__dirname, '../src/content/posts');

function parseArgs(argv) {
  const args = {};
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    const hasValue = next !== undefined && !next.startsWith('--');
    if (key === 'draft' || key === 'force') {
      args[key] = true;
      continue;
    }
    if (!hasValue) {
      args[key] = true;
      continue;
    }
    args[key] = next;
    i++;
  }
  return args;
}

function slugify(input) {
  return input
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function timestampSlug() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(
    d.getHours()
  )}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function main() {
  const cliArgs = parseArgs(process.argv.slice(2));
  let input = { ...cliArgs };

  if (cliArgs.json) {
    const jsonPath = resolve(process.cwd(), cliArgs.json);
    const fileInput = JSON.parse(readFileSync(jsonPath, 'utf-8'));
    // CLI引数がある場合はJSONの値を上書きできる
    input = { ...fileInput, ...cliArgs };
  }

  const title = input.title;
  if (!title || typeof title !== 'string') {
    console.error(
      'エラー: --title は必須です。\n例: node scripts/generate-post.mjs --title "新譜レビュー" --body "本文..." --image "/images/posts/example.jpg" --tags "レビュー,新譜"'
    );
    process.exit(1);
  }

  let body = input.body ?? '';
  if (input['body-file']) {
    body = readFileSync(resolve(process.cwd(), input['body-file']), 'utf-8');
  }

  const description = input.description ?? '';
  const image = input.image ?? '';
  const imageAlt = input['image-alt'] ?? input.imageAlt ?? '';

  const rawTags = input.tags;
  const tags = Array.isArray(rawTags)
    ? rawTags
    : typeof rawTags === 'string'
      ? rawTags.split(',').map((t) => t.trim()).filter(Boolean)
      : [];

  const pubDate = input.date ?? new Date().toISOString().slice(0, 10);
  const draft = Boolean(input.draft);
  const affiliate = Boolean(input.affiliate);

  const slugSource = input.slug ?? title;
  let slug = slugify(String(slugSource));
  if (!slug) slug = timestampSlug();

  if (!existsSync(POSTS_DIR)) mkdirSync(POSTS_DIR, { recursive: true });

  const filePath = resolve(POSTS_DIR, `${slug}.md`);
  if (existsSync(filePath) && !cliArgs.force) {
    console.error(
      `エラー: ${filePath} は既に存在します。--force で上書き、または --slug で別名を指定してください。`
    );
    process.exit(1);
  }

  const frontmatterLines = [
    '---',
    `title: ${yamlString(title)}`,
    `description: ${yamlString(description)}`,
    `pubDate: ${pubDate}`,
    image ? `image: ${yamlString(image)}` : null,
    imageAlt ? `imageAlt: ${yamlString(imageAlt)}` : null,
    `tags: [${tags.map(yamlString).join(', ')}]`,
    draft ? 'draft: true' : null,
    affiliate ? 'affiliate: true' : null,
    '---',
    '',
  ].filter((line) => line !== null);

  const content = `${frontmatterLines.join('\n')}\n${String(body).trim()}\n`;

  writeFileSync(filePath, content, 'utf-8');
  console.log(`記事を作成しました: ${filePath}`);
}

main();
