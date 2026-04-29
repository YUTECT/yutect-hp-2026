# YUTECT — Corporate Site

Astro + microCMS で構築された YUTECT のコーポレートサイト。

## 構成

- **Framework**: Astro 4 (静的サイト生成)
- **CMS**: microCMS (お知らせ + ブログ)
- **Hosting**: Netlify
- **更新フロー**: microCMS 投稿 → Webhook → Netlify 再ビルド → 公開

## ディレクトリ

```
HP/
├── _legacy/           旧 index.html (参照用、本番ビルド対象外)
├── public/            静的アセット (画像・ロゴ)
│   └── assets/
├── src/
│   ├── components/    Astro コンポーネント (Nav, Footer, NewsSection)
│   ├── layouts/       Layout.astro (HTMLシェル)
│   ├── lib/           microcms.ts (CMSクライアント)
│   ├── pages/
│   │   ├── index.astro          トップページ
│   │   └── news/[id].astro      記事詳細 (動的に生成)
│   └── styles/        global.css
├── astro.config.mjs
├── package.json
└── .env.example       環境変数サンプル
```

## ローカル開発

```bash
npm install
cp .env.example .env       # microCMS の認証情報を記入
npm run dev                # http://localhost:4321
```

`.env` が未設定でも起動はします（ニュース欄は空表示）。

## ビルド

```bash
npm run build              # .vercel/output に静的ファイル生成
```

---

## microCMS 側のセットアップ

トップの「ニュース＆コラム」セクションは `news`（お知らせ）と `blog`（ブログ）の**最新を混在表示**します。両方のAPIを作成してください。

### 1. サービス作成

[microcms.io](https://microcms.io) でサービスを作成（テンプレートは使わず「自分で作成」）。サービスドメインを控える（例: `yutect`）。

### 2. APIスキーマ作成

#### 2-1. `news` API（お知らせ）

API名: `お知らせ` / エンドポイント: `news` / API型: **リスト形式**

| フィールドID | 表示名 | 種類 | 必須 | 備考 |
|---|---|---|---|---|
| `title` | タイトル | テキスト | ✓ | |
| `publishedDate` | 公開日 | 日時 |  | 未設定時は `publishedAt` を使用 |
| `category` | カテゴリ | セレクト |  | 値: `RELEASE` / `CASE` / `EVENT`<br>「複数選択」OFF |
| `thumbnail` | サムネイル | 画像 |  | 16:10 推奨 |
| `excerpt` | 抜粋 | テキストエリア |  | カードや meta 用の短文 |
| `body` | 本文 | リッチエディタ |  | 内部記事のみ記入。外部リンクの場合は空でOK |
| `externalUrl` | 外部URL | テキスト |  | PR TIMES など外部記事URL。設定するとカードが直接外部に飛ぶ |

> `RELEASE` カテゴリのときカードバッジが金色になります。

#### 2-2. `blog` API（ブログ）

API名: `ブログ` / エンドポイント: `blog` / API型: **リスト形式**

| フィールドID | 表示名 | 種類 | 必須 | 備考 |
|---|---|---|---|---|
| `title` | タイトル | テキスト | ✓ | |
| `publishedDate` | 公開日 | 日時 |  | |
| `category` | カテゴリ | セレクト |  | 値: `TECH` / `DESIGN` / `CASE` / `COLUMN` |
| `thumbnail` | サムネイル | 画像 |  | ブログはサムネ重要 |
| `excerpt` | 抜粋 | テキストエリア |  | |
| `body` | 本文 | リッチエディタ |  | 内部記事のみ記入 |
| `externalUrl` | 外部URL | テキスト |  | Zenn / note / Medium など外部記事URL |

### 3. APIキーを発行

- 管理画面 → サービス設定 → 「APIキー」 → 新規発行
- 権限: **GET のみ** (公開記事の取得用) — `news` `blog` 両方のAPIを許可
- 1つのキーで両APIにアクセスできるので、キーは**1つだけ**でOK
- 必要に応じて IP制限・リファラ制限を設定

### 表示ロジック

- トップページ: `news` と `blog` を混在 → `publishedDate` 降順で最新4件
- カードに種別バッジ（NEWS / BLOG）を表示
- `externalUrl` が設定されている記事 → クリックでその外部URLに（新しいタブで）遷移
- `externalUrl` が空の記事 → 内部詳細ページ `/news/[id]` または `/blog/[id]` に遷移

---

## Netlify デプロイ手順

### 1. Netlify にプロジェクト追加

[app.netlify.com](https://app.netlify.com) にログイン → 「Add new site」 → 「Import an existing project」 → 「**Deploy with GitHub**」

GitHub連携を許可後、`YUTECT/yutect-hp-2026` を選択。

### 2. ビルド設定

Netlify は `netlify.toml` を読んで自動設定するので、基本そのまま進めて問題なし。

| 項目 | 値 |
|---|---|
| Build command | `npm run build` |
| Publish directory | `dist` |

### 3. 環境変数を Netlify に登録

Site settings → Environment variables → Add a variable

| Key | Value |
|---|---|
| `MICROCMS_SERVICE_DOMAIN` | サービスドメイン (例: `yutect`) |
| `MICROCMS_API_KEY` | microCMS で発行したAPIキー |

設定後、Deploys → Trigger deploy → 「Deploy site」で反映。

### 4. microCMS Webhook を設定 (記事公開時の自動デプロイ)

#### Netlify側

1. Site settings → Build & deploy → **Build hooks**
2. 「Add build hook」→ 名前: `microcms` / Branch: `main`
3. 生成された URL（`https://api.netlify.com/build_hooks/...`）をコピー

#### microCMS側

各APIごとにWebhookを設定します（`news` と `blog` の両方）。

1. 管理画面 → 対象API（`news` または `blog`） → API設定 → **Webhook**
2. 「カスタム通知」を選択 → URL に Netlify の Build Hook URL を貼り付け
3. トリガー: コンテンツの**公開時 / 更新時 / 削除時**にチェック
4. `news` `blog` 両方で同じ URL を設定（同じビルドフックで両方からトリガーOK）

これで microCMS で公開ボタンを押すと Netlify が自動で再ビルドし、1〜2分でサイトに反映されます。

---

## 運用フロー

1. microCMS にログインして記事を作成・公開
2. 自動で Vercel が再ビルド・配信
3. `/` の最新4件と `/news/<id>` 詳細ページに反映

## トラブルシューティング

### ニュース欄が空のまま

- `.env`（ローカル）or Vercel環境変数（本番）の `MICROCMS_SERVICE_DOMAIN` / `MICROCMS_API_KEY` を確認
- microCMS で記事が**公開状態**になっているか確認（下書き状態だと取得できません）

### 記事公開しても反映されない

- Vercel Deploy Hook URL が microCMS Webhook に正しく登録されているか
- Vercel ダッシュボードの Deployments で再ビルドが走っているか確認

### カテゴリのバッジが期待通りでない

`src/lib/microcms.ts` の `pickCategory` と `src/components/NewsSection.astro` の `goldCategories` を確認。`RELEASE` 以外を金色バッジにしたい場合はここで調整。

---

## 関連ファイル

- microCMS連携の中核: [src/lib/microcms.ts](src/lib/microcms.ts)
- 一覧表示: [src/components/NewsSection.astro](src/components/NewsSection.astro)
- 記事詳細: [src/pages/news/[id].astro](src/pages/news/[id].astro)
