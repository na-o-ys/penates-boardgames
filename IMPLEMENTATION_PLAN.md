# ワンナイト人狼 実装計画

## 概要

Design Docに基づき、以下の7フェーズで開発を進める。
各フェーズは独立してテスト可能な単位で区切られている。

---

## Phase 1: プロジェクトセットアップ ✅ 完了

### 使用バージョン
| パッケージ | バージョン |
|-----------|-----------|
| Next.js | 16.1.1 |
| React | 19.2.3 |
| TypeScript | 5.9.3 |
| Tailwind CSS | 4.1.18 |
| Supabase JS | 2.90.1 |
| Supabase SSR | 0.8.0 |

### 1.1 Next.js プロジェクト初期化 ✅
- Next.js 16 (App Router) プロジェクト作成
- TypeScript 5.9 設定
- ESLint 9 設定

### 1.2 スタイリング設定 ✅
- Tailwind CSS v4 インストール・設定
- グローバルスタイル定義（カラーパレット、フォント）

### 1.3 Supabase セットアップ ✅
- Supabase クライアントライブラリインストール
- 環境変数設定（`.env.local.example`）
- Supabase クライアント初期化コード

### 1.4 プロジェクト構造
```
src/
├── app/                    # Next.js App Router
│   ├── page.tsx            # ランディングページ
│   ├── room/
│   │   └── [roomId]/
│   │       └── page.tsx    # ゲームルーム
│   └── layout.tsx
├── components/             # UIコンポーネント
│   ├── ui/                 # 汎用UIパーツ
│   ├── lobby/              # ロビー画面
│   ├── night/              # 夜フェーズ
│   ├── day/                # 昼フェーズ
│   ├── voting/             # 投票画面
│   └── result/             # 結果画面
├── lib/
│   ├── game/               # ゲームロジック（純粋関数）
│   │   ├── types.ts        # 型定義
│   │   ├── reducer.ts      # 状態更新ロジック
│   │   ├── resolver.ts     # 最終役職解決
│   │   ├── validator.ts    # アクションバリデーション
│   │   └── masking.ts      # データマスキング
│   ├── supabase/
│   │   ├── client.ts       # Supabaseクライアント
│   │   ├── server.ts       # サーバー用クライアント
│   │   └── realtime.ts     # Realtime設定
│   └── utils/              # ユーティリティ
├── actions/                # Server Actions
│   ├── room.ts             # 部屋作成・参加
│   ├── game.ts             # ゲーム進行
│   └── vote.ts             # 投票
└── hooks/                  # カスタムフック
    ├── useGameState.ts     # ゲーム状態管理
    └── useRealtime.ts      # Realtime購読
```

---

## Phase 2: ドメイン型定義

### 2.1 基本型 (`src/lib/game/types.ts`)
```typescript
// プレイヤーID
type PlayerId = string;

// 役職
type Role =
  | 'WEREWOLF'
  | 'VILLAGER'
  | 'SEER'
  | 'ROBBER'
  | 'TROUBLEMAKER'
  | 'TANNER';

// ゲームフェーズ
type Phase = 'LOBBY' | 'NIGHT' | 'DAY' | 'VOTING' | 'RESULT';

// 陣営
type Team = 'VILLAGE' | 'WEREWOLF' | 'TANNER';
```

### 2.2 アクション型
```typescript
// 夜アクションの種類
type ActionType =
  | 'WEREWOLF_LOOK'      // 人狼: 中央カード確認（単独時）
  | 'SEER_LOOK_PLAYER'   // 占い師: プレイヤー確認
  | 'SEER_LOOK_CENTER'   // 占い師: 中央2枚確認
  | 'ROBBER_SWAP'        // 怪盗: カード交換
  | 'TROUBLEMAKER_SWAP'  // トラブルメーカー: 交換
  | 'SKIP';              // 行動スキップ

interface GameAction {
  readonly actorId: PlayerId;
  readonly type: ActionType;
  readonly targetIds: readonly string[];
  readonly result?: readonly Role[];  // アクション結果（見えた役職）
  readonly timestamp: number;
}
```

### 2.3 ゲーム状態型
```typescript
interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly isHost: boolean;
  readonly isConnected: boolean;
}

interface GameConfig {
  readonly roles: readonly Role[];  // 使用する役職リスト
  readonly nightDuration: number;   // 夜フェーズ秒数
  readonly dayDuration: number;     // 昼フェーズ秒数
  readonly votingDuration: number;  // 投票フェーズ秒数
}

interface GameState {
  readonly roomId: string;
  readonly phase: Phase;
  readonly players: readonly Player[];
  readonly config: GameConfig;
  readonly initialDistribution: Record<string, Role>;
  readonly actions: readonly GameAction[];
  readonly votes: Record<PlayerId, PlayerId>;
  readonly phaseStartedAt: number | null;
}
```

### 2.4 クライアント用マスク済み型
```typescript
interface ClientGameState {
  readonly roomId: string;
  readonly phase: Phase;
  readonly players: readonly Player[];
  readonly config: GameConfig;
  readonly myRole: Role | null;
  readonly myActions: readonly GameAction[];
  readonly actionResults: readonly ActionResult[];
  readonly votes: Record<PlayerId, PlayerId> | null;
  readonly phaseStartedAt: number | null;
  readonly finalRoles?: Record<string, Role>;  // RESULTフェーズのみ
}
```

---

## Phase 3: ゲームロジック（純粋関数）

### 3.1 役職配布 (`src/lib/game/distribution.ts`)
- `distributeRoles(players: Player[], roles: Role[]): Record<string, Role>`
- Fisher-Yatesシャッフルでランダム配布
- プレイヤー数 + 2（中央カード）枚を配布

### 3.2 アクションバリデーション (`src/lib/game/validator.ts`)
- `isValidAction(state: GameState, action: GameAction): boolean`
- フェーズチェック（NIGHTフェーズのみアクション可能）
- 役職チェック（自分の役職に応じたアクションのみ）
- ターゲットチェック（存在するプレイヤー/中央カード）
- 重複チェック（同じプレイヤーが2回行動していない）

### 3.3 状態更新 (`src/lib/game/reducer.ts`)
- `gameReducer(state: GameState, action: GameAction): GameState`
- イミュータブルな状態更新
- フェーズ自動遷移判定

### 3.4 最終役職解決 (`src/lib/game/resolver.ts`)
- `resolveFinalRoles(initial: Record<string, Role>, actions: GameAction[]): Record<string, Role>`
- 優先度順（ROBBER → TROUBLEMAKER）にアクション適用
- 占い師は役職変更しないため除外

### 3.5 勝敗判定 (`src/lib/game/judge.ts`)
- `calculateVoteResult(votes: Record<PlayerId, PlayerId>): PlayerId[]`
- `determineWinner(executedIds: PlayerId[], finalRoles: Record<string, Role>): WinResult`
- 同票処理、平和村判定を含む

### 3.6 データマスキング (`src/lib/game/masking.ts`)
- `maskGameState(state: GameState, playerId: PlayerId): ClientGameState`
- フェーズに応じた情報フィルタリング

---

## Phase 4: データベース層

### 4.1 Supabase Schema
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  version INTEGER NOT NULL DEFAULT 1,
  game_state JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for TTL cleanup
CREATE INDEX idx_rooms_updated_at ON rooms(updated_at);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
```

### 4.2 データアクセス関数 (`src/lib/supabase/rooms.ts`)
- `createRoom(): Promise<string>` - 部屋作成
- `getRoom(roomId: string): Promise<GameState | null>` - 部屋取得
- `updateRoom(roomId: string, version: number, newState: GameState): Promise<boolean>` - 楽観的ロック付き更新
- `deleteRoom(roomId: string): Promise<void>` - 部屋削除

### 4.3 Realtime設定 (`src/lib/supabase/realtime.ts`)
- `subscribeToRoom(roomId: string, onUpdate: () => void): RealtimeChannel`
- Postgres Changesを使用してUPDATEを監視

---

## Phase 5: Server Actions

### 5.1 部屋管理 (`src/actions/room.ts`)
- `createRoom()`: 新規部屋作成、ホストとして参加
- `joinRoom(roomId: string, playerName: string)`: 部屋参加
- `leaveRoom(roomId: string)`: 部屋退出

### 5.2 ゲーム進行 (`src/actions/game.ts`)
- `startGame(roomId: string)`: ゲーム開始（ホストのみ）
- `submitNightAction(roomId: string, action: GameAction)`: 夜アクション実行
- `advancePhase(roomId: string)`: フェーズ進行（タイマー用）

### 5.3 投票 (`src/actions/vote.ts`)
- `submitVote(roomId: string, targetId: PlayerId)`: 投票
- `getGameState(roomId: string)`: マスク済み状態取得

---

## Phase 6: UIコンポーネント

### 6.1 ランディングページ (`src/app/page.tsx`)
- 部屋作成ボタン
- 部屋ID入力フィールド（参加用）

### 6.2 ロビー画面 (`src/components/lobby/`)
- `LobbyScreen.tsx`: 参加者一覧、役職設定、開始ボタン
- `PlayerList.tsx`: プレイヤーリスト表示
- `RoleSelector.tsx`: 役職構成設定（ホスト用）

### 6.3 夜フェーズ (`src/components/night/`)
- `NightScreen.tsx`: 夜フェーズコンテナ
- `RoleCard.tsx`: 自分の役職表示
- `WerewolfAction.tsx`: 人狼アクションUI
- `SeerAction.tsx`: 占い師アクションUI
- `RobberAction.tsx`: 怪盗アクションUI
- `TroublemakerAction.tsx`: トラブルメーカーUI
- `WaitingScreen.tsx`: アクション待機画面

### 6.4 昼フェーズ (`src/components/day/`)
- `DayScreen.tsx`: 議論画面
- `Timer.tsx`: カウントダウンタイマー
- `NoteBoard.tsx`: メモ機能（ローカル保存）

### 6.5 投票フェーズ (`src/components/voting/`)
- `VotingScreen.tsx`: 投票画面
- `PlayerVoteCard.tsx`: 投票対象選択カード

### 6.6 結果画面 (`src/components/result/`)
- `ResultScreen.tsx`: 結果表示コンテナ
- `ExecutionReveal.tsx`: 処刑者発表
- `WinnerAnnouncement.tsx`: 勝敗発表
- `RoleReveal.tsx`: 全員の役職公開
- `ActionLog.tsx`: アクション履歴表示

---

## Phase 7: 統合・テスト

### 7.1 ユニットテスト
- ゲームロジック（純粋関数）のテスト
- Vitest使用

### 7.2 E2Eテスト
- Playwright使用
- 複数ブラウザでの同時プレイテスト

### 7.3 モバイル対応
- レスポンシブデザイン確認
- タッチ操作最適化

### 7.4 エラーハンドリング
- ネットワークエラー時のリトライ
- 楽観的ロック失敗時の再取得

---

## 実装優先度

### MVP（最小実装）
1. Phase 1: プロジェクトセットアップ
2. Phase 2: ドメイン型定義
3. Phase 3: ゲームロジック（純粋関数）
4. Phase 4: データベース層
5. Phase 5: Server Actions
6. Phase 6: 基本UI（ロビー、夜、昼、投票、結果）

### 後回し可能
- メモ機能
- アバター選択
- SE/BGM
- アニメーション演出

---

## 依存関係図

```
Phase 1 (Setup)
    ↓
Phase 2 (Types) ─────────────────┐
    ↓                            ↓
Phase 3 (Logic) ──→ Phase 4 (DB) ──→ Phase 5 (Actions)
                                            ↓
                                     Phase 6 (UI)
                                            ↓
                                     Phase 7 (Test)
```

---

## 技術的考慮事項

### セッション管理
- プレイヤーIDはブラウザのlocalStorageに保存
- UUIDv4で生成、部屋ごとに一意

### セキュリティ
- Server Actionsでのプレイヤー認証
- 他プレイヤーの役職は必ずサーバー側でマスク
- SQLインジェクション対策（Supabase SDK使用で自動対応）

### パフォーマンス
- 楽観的UI更新
- Realtime接続は部屋単位で1つ
- 不要な再レンダリング防止（React.memo, useMemo）

### スケーラビリティ
- 古い部屋の自動削除（updated_at + 24時間でTTL）
- Supabaseの自動スケーリング活用
