# Music Blog Template (Astro + Tailwind CSS)

軽量な音楽ニュース・コラム風の静的ブログテンプレート。記事は Markdown で管理し、
GitHub Actions 経由で Cloudflare Pages（無料枠）へ自動デプロイできます。

## 構成

```
src/
  content/
    config.ts        # 記事のスキーマ定義 (title, description, pubDate, image, tags...)
    posts/*.md        # 記事本体（Markdown）
  layouts/
    BaseLayout.astro   # 共通レイアウト（head, header, footer）
  components/
    Header.astro / Footer.astro / PostCard.astro
  pages/
    index.astro         # トップページ（記事一覧）
    posts/[...slug].astro  # 記事詳細ページ
    tags/index.astro       # タグ一覧
    tags/[tag].astro       # タグ別記事一覧
scripts/
  generate-post.mjs   # 記事の自動生成スクリプト
.github/workflows/
  deploy.yml          # Cloudflare Pagesへの自動デプロイ
```

## ローカル開発

```bash
npm install
npm run dev
```

`http://localhost:4321` でプレビューできます。

```bash
npm run build     # dist/ に静的ファイルを出力
npm run preview   # ビルド結果をローカルでプレビュー
```

## 記事の追加方法

### 1. 手動で追加

`src/content/posts/` に `.md` ファイルを追加します。frontmatterの形式:

```md
---
title: "記事タイトル"
description: "一覧やOGPに使う要約文"
pubDate: 2026-09-17
image: "/images/posts/example.jpg"   # public/images/posts/ に置くか外部URL
imageAlt: "画像の代替テキスト"
tags: ["レビュー", "新譜"]
draft: false
---

本文をMarkdownで書く。
```

### 2. 自動生成スクリプトで追加

`scripts/generate-post.mjs` は、タイトル・本文・アイキャッチ画像・タグを渡すと
`src/content/posts/` に Markdown ファイルを自動生成します。RSS取り込みやAI生成
パイプラインなど、外部の自動化フローから呼び出すことを想定しています。

CLI引数で指定:

```bash
npm run new-post -- \
  --title "新譜レビュー：〇〇の最新アルバム" \
  --body "本文をここに書く（Markdown可）" \
  --image "/images/posts/example.jpg" \
  --tags "レビュー,新譜,J-POP" \
  --description "一言要約"
```

本文をファイルから読み込む場合:

```bash
npm run new-post -- --title "..." --body-file draft.md --tags "コラム"
```

JSONファイルから一括投入する場合（自動化パイプライン向け）:

```bash
npm run new-post -- --json data.json
```

```json
{
  "title": "新譜レビュー：〇〇",
  "body": "本文（Markdown）",
  "image": "/images/posts/example.jpg",
  "tags": ["レビュー", "新譜"],
  "description": "一言要約"
}
```

同名スラッグが既にある場合はエラーになります。上書きしたい場合は `--force` を付けてください。

## アイキャッチ画像

`public/images/posts/` に画像を置き、frontmatterの `image` にパス（例: `/images/posts/xxx.jpg`）
を指定するか、外部URL（画像CDNなど）を直接指定します。実在の人物・バンドの写真は肖像権・著作権の
権利関係を確認してから使用してください（不明な場合はフリー素材か、プレースホルダー画像を使う）。

## SEO対策（組み込み済み）

- **サイトマップ自動生成**: `@astrojs/sitemap` により `sitemap-index.xml` を自動生成
- **RSSフィード**: `/rss.xml`（`src/pages/rss.xml.js`）
- **構造化データ（JSON-LD）**: 各記事に `Article` スキーマを自動出力（`src/pages/posts/[...slug].astro`）
- **canonical URL / OGP / Twitter Card**: `BaseLayout.astro` に実装済み
- **robots.txt**: `public/robots.txt`（`astro.config.mjs` の `site` を実際のドメインに変更したら、
  `robots.txt` のSitemap行も合わせて更新してください）

検索順位はコンテンツの質・被リンク・更新頻度などトータルで決まるため、これらは「土台」であり
魔法ではありません。継続的な良質な記事更新と組み合わせて効果が出ます。

## アフィリエイト・収益化について

記事のfrontmatterで `affiliate: true` を指定すると、記事内に法律で求められる広告表記
（景品表示法のステルスマーケティング規制対応）が自動表示されます（`src/components/AffiliateDisclosure.astro`）。

実際にアフィリエイト収益を得るには、以下はサイト運営者本人での対応が必要です（Claudeが代行できない部分）:

1. 各ASP（A8.net、もしもアフィリエイト、Amazon アソシエイト、楽天アフィリエイト等）に**本人が**登録
   （本人確認・銀行口座登録が必要なため）
2. 発行されたアフィリエイトリンク・バナーを記事内に埋め込む
3. サイトの「運営者情報」「プライバシーポリシー」ページを整備（ASP審査で必須になることが多い）

土台（表記コンポーネント、記事構成）はすでに用意してあるので、ASP登録が完了次第すぐに組み込めます。

## Cloudflare Pages への自動デプロイ（無料）

Cloudflare Pages は静的サイトなら無料枠で運用できます。GitHub Actions（`.github/workflows/deploy.yml`）
が `main` ブランチへの push をトリガーに、ビルドしてデプロイします。

### セットアップ手順

1. **GitHubリポジトリを作成してこのプロジェクトをpush**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<your-account>/<your-repo>.git
   git push -u origin main
   ```

2. **Cloudflareダッシュボードで Pages プロジェクトを作成**
   - [Cloudflare Pages](https://dash.cloudflare.com/) にログイン（無料アカウントでOK）
   - Workers & Pages → Create → Pages → "Connect to Git" は使わず、
     GitHub Actions からのデプロイ専用プロジェクトとして作成してOKです
     （最初のデプロイ時に自動作成されることもあります）
   - プロジェクト名を決め、`.github/workflows/deploy.yml` の `projectName` を
     その名前に合わせて書き換えてください

3. **APIトークンとアカウントIDを取得**
   - Account ID: Cloudflareダッシュボード右下、または対象ドメインの概要ページに表示
   - API Token: [My Profile → API Tokens](https://dash.cloudflare.com/profile/api-tokens) →
     "Create Token" → "Edit Cloudflare Workers" or "Cloudflare Pages" テンプレートを使用

4. **GitHubリポジトリにSecretsを登録**

   リポジトリの Settings → Secrets and variables → Actions → New repository secret

   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

5. **`main` ブランチへpushすると自動デプロイされます**

   以降は記事を追加して push するだけで、ビルド〜デプロイが自動実行されます。

### 費用について

- Cloudflare Pages: 静的サイトのホスティングは無料枠内で運用可能（ビルド回数・帯域とも
  個人ブログ用途では無料枠で十分なことが多いです）
- GitHub Actions: パブリックリポジトリは無料。プライベートリポジトリも
  月2,000分まで無料枠あり
- 独自ドメインを使わない場合、Cloudflareが発行する `*.pages.dev` のURLをそのまま無料で使えます

## タグページ

`tags/[tag].astro` が記事のtagsから自動生成されるため、タグ追加のための
追加作業は不要です。`/tags/` で一覧、`/tags/<tag名>/` で該当記事一覧が見られます。
