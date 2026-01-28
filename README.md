# ワンナイト人狼 ブラウザゲーム

3〜10人でプレイできるワンナイト人狼のブラウザゲームです。
アプリインストール不要、URL共有のみで参加可能。

## 技術スタック

- **Frontend**: Next.js 16, React 19, TypeScript 5.9
- **Styling**: Tailwind CSS 4
- **Database**: Supabase (PostgreSQL)
- **Realtime**: Supabase Realtime
- **Deploy**: Vercel

## 開発環境のセットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、Supabaseの認証情報を設定してください。

```bash
cp .env.local.example .env.local
```

### 3. 開発サーバーの起動

```bash
npm run dev
```

http://localhost:3000 でアプリケーションが起動します。

## スクリプト

| コマンド | 説明 |
|---------|------|
| `npm run dev` | 開発サーバー起動 |
| `npm run build` | プロダクションビルド |
| `npm run start` | プロダクションサーバー起動 |
| `npm run lint` | ESLintによるコードチェック |
| `npm run typecheck` | TypeScript型チェック |

## プロジェクト構造

```
src/
├── app/                    # Next.js App Router
├── components/             # UIコンポーネント
│   ├── lobby/              # ロビー画面
│   ├── night/              # 夜フェーズ
│   ├── day/                # 昼フェーズ
│   ├── voting/             # 投票画面
│   └── result/             # 結果画面
├── lib/
│   ├── game/               # ゲームロジック（純粋関数）
│   └── supabase/           # Supabase設定
├── actions/                # Server Actions
└── hooks/                  # カスタムフック
```

## ドキュメント

- [Design Doc](./design_doc.md) - 設計ドキュメント
- [実装計画](./IMPLEMENTATION_PLAN.md) - 開発フェーズと詳細計画
