# ワンナイト人狼 ブラウザゲーム Design Doc

## 1. プロジェクト概要

* **目的:** 3〜10人がPC/スマホのブラウザのみで、GM（ゲームマスター）なしで「ワンナイト人狼」を遊べるWebアプリケーション。
* **特徴:** アプリインストール不要、URL共有のみで参加可能。リアルタイム進行。
* **設計哲学:** **Serverless & Functional Core**。
* VercelとSupabaseを活用したサーバーレス構成。
* ゲームロジックは副作用のない純粋関数で構築し、PostgreSQLをKVS（Key-Value Store）として利用する。



---

## 2. ゲーム基本仕様

### 2.1 基本ルール

* **プレイ人数:** 3人 〜 10人
* **カード構成:** プレイヤー人数 + 2枚（「中央」にある余りカード）
* **勝敗条件:**
* **村人陣営の勝利:** 投票で「人狼」を1人以上処刑する。ただし人狼が不在（平和村）の場合は、誰も処刑しない（全員の投票先がバラバラ、または平和村投票）ことで勝利となる。
* **人狼陣営の勝利:** 人狼が処刑されず、人間（または処刑されても勝利にならない役職）が処刑される。
* **その他の勝利:** 吊人（Tanner）などの特殊勝利条件を持つ役職が処刑される。



### 2.2 実装役職 (MVP)

夜の行動順序（ロジック上の優先度）に従って定義する。

1. **人狼 (Werewolf):** 仲間の人狼を確認できる。自分一人の場合は中央のカードを見る。
2. **占い師 (Seer):** 他人のカードを1枚見る、または中央のカードを2枚見る。
3. **怪盗 (Robber):** 他人のカードを1枚強奪し、自分と入れ替える（入れ替わった後の役職を確認する）。
4. **トラブルメーカー (Troublemaker):** 他人同士のカードを入れ替える（中身は見ない）。
5. **村人 (Villager):** 特になし。
6. **吊人 (Tanner):** 処刑されると単独勝利。夜の行動はなし。

### 2.3 ゲームフェーズ (State Machine)

1. **Lobby (待機室):**
* プレイヤーの入室、名前決定、ホストによる役職構成設定。


2. **Card Distribution (配布):**
* サーバー側でランダムに役職を割り当て、各プレイヤーに通知（まだ他言無用）。


3. **Night Phase (アクション):**
* 能力を持つ役職がアクションを実行する。
* 実際のカード交換は即時反映されず、全ての入力が終わった後にロジック上で解決される。


4. **Day Phase (議論):**
* タイマーによる制限時間内での議論。
* プレイヤーは「誰が何をしたか」を推理し合う。


5. **Voting (投票):**
* 全員一斉に処刑したいプレイヤーを選択する。


6. **Result (結果発表):**
* 投票結果の開示 -> 処刑者の決定 -> 勝敗判定 -> 内訳（アクション履歴）の完全開示。



---

## 3. システムアーキテクチャ

### 3.1 技術スタック

* **Frontend & BFF:** Next.js (App Router), TypeScript, Tailwind CSS
* **Database:** Supabase (PostgreSQL)
* **Realtime:** Supabase Realtime
* **Deploy:** Vercel

### 3.2 データフロー (Fetch-on-Signal Pattern)

セキュリティ（隠匿情報）とリアルタイム性を両立させるため、**「更新通知」と「データ取得」を分離**する。

1. **Action (Write):** クライアントがNext.js Server Actionを叩く。ロジック計算後、SupabaseのDBを更新。
2. **Signal (Notify):** Supabase RealtimeがDB変更を検知し、全クライアントに「データが更新された」という軽量なシグナルのみを送る。
3. **Fetch (Read):** シグナルを受け取った各クライアントは、自動的にServer Action経由で最新のデータを再取得（Revalidation）する。この際、サーバー側で「そのプレイヤーが見てはいけない情報」をマスクして返す。

---

## 4. データモデル設計

### 4.1 Database Schema (Supabase)

リレーショナルモデルではなく、JSONBを活用したドキュメント指向（KVSライク）な設計を採用する。

**Table: `rooms**`

| Column Name | Type | Description |
| --- | --- | --- |
| `id` | `uuid` | Primary Key (Room ID) |
| `version` | `int` | 楽観的ロック用のバージョン番号 |
| `updated_at` | `timestamptz` | 最終更新日時（TTL管理用） |
| `game_state` | `jsonb` | **ゲームの全状態（正解データ）を格納** |

### 4.2 Immutable Data Structures (TypeScript)

`game_state` カラムに格納されるJSONの構造定義。全てのプロパティは `readonly` とする。

```typescript
type PlayerId = string; // UUID (Supabase Auth ID or Generated Session ID)
type Role = 'WEREWOLF' | 'VILLAGER' | 'SEER' | 'ROBBER' | 'TROUBLEMAKER' | 'TANNER';
type Phase = 'LOBBY' | 'NIGHT' | 'DAY' | 'VOTING' | 'RESULT';

// アクションログ（Event Sourcing）
interface GameAction {
  readonly actorId: PlayerId;
  readonly type: 'SEER_LOOK' | 'ROBBER_SWAP' | 'TROUBLEMAKER_SWAP';
  readonly targetIds: ReadonlyArray<string>; // 対象プレイヤーID or 'CENTER_1'
  readonly timestamp: number;
}

// ゲーム状態全体（Single Source of Truth）
interface GameState {
  readonly roomId: string;
  readonly phase: Phase;
  readonly players: ReadonlyArray<{
    readonly id: PlayerId;
    readonly name: string;
    readonly avatar: string;
    readonly isHost: boolean;
  }>;
  readonly initialDistribution: ReadonlyMap<string, Role>; // Key: PlayerId | 'CENTER_n'
  readonly actions: ReadonlyArray<GameAction>; // 実行された全アクション
  readonly votes: ReadonlyMap<PlayerId, PlayerId>; // 投票結果
  readonly config: {
    readonly nightTime: number;
    readonly dayTime: number;
  };
}

```

---

## 5. ロジック詳細設計

### 5.1 State Management (Functional Core)

状態更新は、バックエンド（Next.js Server Action）にて純粋関数を用いて行う。

```typescript
// 純粋関数: 現在の状態 + アクション -> 次の状態
function gameReducer(currentState: GameState, action: GameAction): GameState {
  // 1. バリデーション (手番チェック、フェーズチェック)
  if (!isValidAction(currentState, action)) {
    throw new Error("Invalid Action");
  }

  // 2. 新しい状態の生成 (Immutabilityを維持)
  return {
    ...currentState,
    actions: [...currentState.actions, action],
    // 必要に応じてフェーズ進行判定などをここに記述
  };
}

```

### 5.2 State Resolver (Result Calculation)

「誰がどの役職になったか」はDBに保存せず、初期配置とアクションログから動的に導出する。

```typescript
function resolveFinalRoles(
  initialDist: ReadonlyMap<string, Role>,
  actions: ReadonlyArray<GameAction>
): Map<string, Role> {
  const currentDist = new Map(initialDist);

  // アクションの優先度順（占い < 怪盗 < トラブルメーカー）にソートして適用
  const sortedActions = [...actions].sort(prioritySort);

  for (const act of sortedActions) {
    applyActionEffect(currentDist, act);
  }
  return currentDist;
}

```

---

## 6. API & セキュリティ設計

### 6.1 楽観的ロックによる排他制御

Supabaseへの書き込み時、競合を防ぐために `version` カラムを利用する。

```sql
UPDATE rooms
SET
  game_state = $new_state,
  version = version + 1
WHERE
  id = $room_id AND version = $current_version;

```

※ 更新行数が0だった場合、他プレイヤーが先に操作したとみなし、クライアントにリトライを促す。

### 6.2 データのマスキング (DTO)

クライアントには生の `GameState` を渡さず、閲覧権限に応じた `ClientGameState` に変換して返す。

* **LOBBY / DAY / VOTING:**
* `initialDistribution`: 自分以外の役職は `UNKNOWN` に置換。
* `actions`: 自分のアクション以外は削除（「誰かが動いた」事実だけ残すか、完全に消す）。


* **RESULT:**
* 全ての情報を開示。



---

## 7. UI/UX フロー

1. **ランディング & ロビー**
* 部屋作成ボタン -> UUID発行 -> `rooms` テーブルにINSERT。
* Supabase Realtimeで `rooms:id=eq.uuid` をSubscribe。


2. **夜フェーズ (Night Phase)**
* 画面に「自分のカード」を表示。
* 役職に応じたアクションUI（モーダル等）を表示。
* アクション実行 -> Server Action呼び出し -> 完了待機画面へ。


3. **昼フェーズ (Day Phase)**
* 全員のアクション完了 or タイマー終了で自動遷移。
* 中央にカウントダウンタイマー。
* 誰が誰を疑っているかメモできるUI（クライアントローカル保存）。


4. **投票 (Voting)**
* プレイヤーアイコンをクリックして投票。
* 投票完了者が可視化される。


5. **結果発表 (Result)**
* **Step 1:** 最多得票者の発表（処刑）。
* **Step 2:** 勝敗判定（人間チーム vs 人狼チーム）。
* **Step 3:** 全員の正体オープン。
