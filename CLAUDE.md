# CLAUDE.md

このファイルはClaude Codeがこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

One Night Werewolf（ワンナイト人狼）のブラウザ対応マルチプレイヤーゲーム。

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **言語**: TypeScript 5.9
- **スタイリング**: Tailwind CSS 4
- **データベース**: Supabase (PostgreSQL + Realtime)
- **テスト**: Vitest (ユニット), Playwright (E2E)

## コマンド

```bash
npm run dev          # 開発サーバー起動
npm run build        # プロダクションビルド
npm run lint         # ESLint実行
npm run typecheck    # TypeScript型チェック
npm run test         # ユニットテスト実行
npm run test:e2e     # E2Eテスト実行
```

## ディレクトリ構成

```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx           # ランディングページ
│   └── room/[roomId]/     # ゲームルームページ
├── actions/               # Server Actions
│   ├── game.ts           # ゲーム進行アクション
│   └── room.ts           # 部屋管理アクション
├── components/            # UIコンポーネント
│   ├── lobby/            # ロビーフェーズ
│   ├── night/            # 夜フェーズ
│   ├── day/              # 昼フェーズ
│   ├── voting/           # 投票フェーズ
│   └── result/           # 結果フェーズ
├── hooks/                 # カスタムフック
│   ├── useGameState.ts   # ゲーム状態管理
│   └── useRealtime.ts    # Supabase Realtime
└── lib/
    ├── game/             # ゲームロジック（純粋関数）
    │   ├── types.ts      # 型定義
    │   ├── reducer.ts    # 状態遷移
    │   ├── judge.ts      # 勝敗判定
    │   └── masking.ts    # クライアント用マスキング
    ├── supabase/         # Supabaseクライアント
    └── session.ts        # プレイヤーセッション管理
```

## アーキテクチャ

### Functional Core パターン
- `src/lib/game/` 内は純粋関数のみ
- 副作用は Server Actions に集約

### データフロー
1. クライアントがServer Actionを呼び出し
2. Server ActionがSupabaseを更新
3. Supabase RealtimeがクライアントにBroadcast
4. クライアントが最新状態をFetch

### 楽観的ロック
- `rooms`テーブルの`version`カラムで競合制御
- `updateRoomWithRetry`で自動リトライ

## ゲームフェーズ

1. **LOBBY**: プレイヤー参加、役職設定
2. **NIGHT**: 夜アクション実行
3. **DAY**: 議論フェーズ
4. **VOTING**: 投票
5. **RESULT**: 結果発表

## 役職

| 役職 | 陣営 | 夜アクション |
|------|------|-------------|
| WEREWOLF | 人狼 | 仲間確認/単独時は中央1枚確認 |
| VILLAGER | 村人 | なし |
| SEER | 村人 | プレイヤー1人 or 中央2枚を確認 |
| ROBBER | 村人 | 他プレイヤーと役職交換（結果確認） |
| TROUBLEMAKER | 村人 | 他2人の役職を交換 |
| TANNER | 吊人 | なし |

## 型定義の重要ポイント

### GameState（サーバー側完全状態）
```typescript
interface GameState {
  roomId: string;
  phase: Phase;
  players: readonly Player[];
  config: GameConfig;
  initialDistribution: Record<string, Role>;
  actions: readonly GameAction[];
  votes: Record<PlayerId, PlayerId>;
  phaseStartedAt: number | null;
}
```

### ClientGameState（クライアント用マスク済み）
```typescript
interface ClientGameState {
  // 共通
  roomId: string;
  phase: Phase;
  players: readonly Player[];
  config: GameConfig;
  // マスク済み情報
  myRole: Role | null;
  myActions: readonly GameAction[];
  actionResults: readonly ActionResult[];
  // 状態
  hasActed: boolean;
  allActed: boolean;
  votedPlayers: readonly PlayerId[];
  myVote: PlayerId | null;
  // RESULTフェーズのみ
  finalRoles?: Record<string, Role>;
  winners?: readonly PlayerId[];
  winningTeam?: Team | null;
}
```

## テスト

### ユニットテスト
`src/lib/game/game.test.ts` に18シナリオ:
- 基本勝敗パターン
- 役職交換シナリオ
- エッジケース（平和村、同票処理など）

### E2Eテスト
`tests/e2e/` にPlaywrightテスト:
- 部屋作成・参加フロー
- ロビーフェーズ
- フルゲームシナリオ

## 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 注意事項

- Server Actionsは`"use server"`ディレクティブ必須
- クライアントコンポーネントは`"use client"`必須
- ゲームロジックに副作用を含めない
- 役職情報のマスキングは`masking.ts`で一元管理
