---
title: "サンプル記事：音楽ニュース・コラムブログへようこそ"
description: "このテンプレートで最初から用意されているサンプル記事です。"
pubDate: 2026-09-17
image: "https://placehold.co/1200x630/1a1a1a/ffffff?text=MUSIC+BLOG"
imageAlt: "サンプルのアイキャッチ画像"
tags: ["お知らせ", "サンプル"]
draft: false
---

これはサンプル記事です。`src/content/posts/` 配下に Markdown ファイル（`.md`）を追加すると、自動的にトップページや記事ページに反映されます。

新しい記事は手動で追加するほか、`scripts/generate-post.mjs` を使って自動生成することもできます。

```bash
npm run new-post -- --title "新譜レビュー：〇〇" --body-file draft.md --image "/images/posts/example.jpg" --tags "レビュー,新譜,J-POP"
```

## Markdownの基本

本文は通常の Markdown 記法で書けます。**太字**、*斜体*、リンク、画像、リストなど一般的な記法に対応しています。

- アーティスト情報
- リリース情報
- レビューやコラム

見出しやコードブロックも自由に使えます。
