# YUTECT — Corporate Site

Astro + microCMS で構築された YUTECT のコーポレートサイト。

## 構成

- **Framework**: Astro 4 (静的サイト生成)
- **CMS**: microCMS (ニュース記事のみ)
- **Hosting**: Vercel
- **更新フロー**: microCMS 投稿 → Webhook → Vercel 再ビルド → 公開

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

## Vercel デプロイ手順

### 1. リポジトリを GitHub にプッシュ

```bash
git init
git add .
git commit -m "initial commit"
gh repo create yutect-hp --private --source=. --remote=origin --push
```

### 2. Vercel にプロジェクト追加

[vercel.com/new](https://vercel.com/new) → GitHub リポジトリを選択 → そのまま Deploy

Astro は自動検出されます。Framework Preset を `Astro` にしておけばOK。

### 3. 環境変数を Vercel に登録

Vercel ダッシュボード → Settings → Environment Variables

| Key | Value |
|---|---|
| `MICROCMS_SERVICE_DOMAIN` | サービスドメイン (例: `yutect`) |
| `MICROCMS_API_KEY` | microCMS で発行したAPIキー |

設定後、Deployments → 最新デプロイの「⋯」→ Redeploy で反映。

### 4. microCMS Webhook を設定 (記事公開時の自動デプロイ)

#### Vercel側

1. Vercel ダッシュボード → Settings → **Git** → Deploy Hooks
2. 「Create Hook」→ 名前: `microcms` / Branch: `main`
3. 生成された URL をコピー

#### microCMS側

1. 管理画面 → サービス設定 → API設定 → `news` → **Webhook**
2. 「カスタム通知」を選択 → URL に Vercel の Deploy Hook URL を貼り付け
3. トリガー: コンテンツの**公開時 / 更新時 / 削除時**にチェック

これで microCMS で公開ボタンを押すと Vercel が自動で再ビルドし、数十秒〜1分でサイトに反映されます。

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
