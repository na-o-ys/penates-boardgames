// ========================================
// 基本型定義
// ========================================

/** プレイヤーID (UUID) */
export type PlayerId = string;

/** 役職 */
export type Role =
  | "WEREWOLF"
  | "ALPHA_WOLF"
  | "VILLAGER"
  | "SEER"
  | "APPRENTICE_SEER"
  | "ROBBER"
  | "WHITE_ROBBER"
  | "TROUBLEMAKER"
  | "HUNTER"
  | "TANNER"
  | "MADMAN"
  | "BAKER"
  | "MAYOR"
  | "CIA";

/** ゲームフェーズ */
export type Phase = "LOBBY" | "NIGHT" | "DAY" | "VOTING" | "HUNTER_REVENGE" | "FINISHED";

/** 陣営 */
export type Team = "VILLAGE" | "WEREWOLF" | "MINORITY";

/** 配置キー (プレイヤーID or 中央カード) */
export type DistributionKey = PlayerId | "CENTER_0" | "CENTER_1";

// ========================================
// アクション型
// ========================================

/** アクションの種類 */
export type ActionType =
  | "WEREWOLF_LOOK" // 人狼: 中央カード確認（単独時）
  | "SEER_LOOK_PLAYER" // 占い師: プレイヤー確認
  | "SEER_LOOK_CENTER" // 占い師: 中央2枚確認
  | "ROBBER_SWAP" // 怪盗: カード交換
  | "TROUBLEMAKER_SWAP" // トラブルメーカー: 交換
  | "HUNTER_REVENGE" // 狩人: 道連れ選択
  | "SKIP"; // 行動スキップ

/** ゲームアクション（イベントソーシング用） */
export interface GameAction {
  readonly actorId: PlayerId;
  readonly type: ActionType;
  readonly targetIds: readonly string[];
  readonly result?: readonly Role[]; // アクション結果（見えた役職）
  readonly timestamp: number;
}

// ========================================
// プレイヤー・設定型
// ========================================

/** プレイヤー情報 */
export interface Player {
  readonly id: PlayerId;
  readonly name: string;
  readonly isHost: boolean;
  readonly isConnected: boolean;
}

/** ゲーム設定 */
export interface GameConfig {
  readonly roles: readonly Role[]; // 使用する役職リスト
  readonly nightDuration: number; // 夜フェーズ秒数
  readonly dayDuration: number; // 昼フェーズ秒数
  readonly votingDuration: number; // 投票フェーズ秒数
  readonly updatedAt: number; // 設定更新タイムスタンプ
}

// ========================================
// ゲーム状態型
// ========================================

/** ゲーム状態全体（Single Source of Truth） */
export interface GameState {
  readonly roomId: string;
  readonly phase: Phase;
  readonly players: readonly Player[];
  readonly config: GameConfig;
  readonly initialDistribution: Record<string, Role>; // Key: PlayerId | 'CENTER_n'
  readonly actions: readonly GameAction[];
  readonly votes: Record<PlayerId, PlayerId>;
  readonly hunterRevengeTarget: Record<PlayerId, PlayerId>; // 狩人ID → 道連れ対象ID
  readonly breadRecipientId: PlayerId | null; // パンを受け取ったプレイヤーID
  readonly noticeRecipientId: PlayerId | null; // 予告状を受け取ったプレイヤーID
  readonly phaseStartedAt: number | null;
  readonly playerStats: Record<PlayerId, PlayerStat>; // プレイヤースタッツ
  readonly roomStats: RoomStats; // ルーム全体スタッツ
  readonly readyForNextGame: Record<PlayerId, boolean>; // 次ゲームへの準備完了状態
}

// ========================================
// クライアント用マスク済み型
// ========================================

/** アクション結果（クライアント用） */
export interface ActionResult {
  readonly type: ActionType;
  readonly targetIds: readonly string[];
  readonly revealedRoles?: readonly Role[];
}

/** クライアント用ゲーム状態（マスク済み） */
export interface ClientGameState {
  readonly roomId: string;
  readonly phase: Phase;
  readonly players: readonly Player[];
  readonly config: GameConfig;
  readonly myRole: Role | null;
  readonly myActions: readonly GameAction[];
  readonly actionResults: readonly ActionResult[];
  readonly hasActed: boolean;
  readonly allActed: boolean;
  readonly votedPlayers: readonly PlayerId[]; // 投票済みプレイヤー一覧
  readonly myVote: PlayerId | null;
  readonly phaseStartedAt: number | null;
  // 人狼用: 仲間の人狼一覧
  readonly fellowWerewolves?: readonly PlayerId[];
  // 墓地カード自動開示（大狼用）
  readonly revealedCenterRoles?: Record<string, Role>;
  // HUNTER_REVENGEフェーズ用
  readonly executedHunterIds?: readonly PlayerId[]; // 処刑された狩人のID
  readonly isExecutedHunter?: boolean; // 自分が処刑された狩人か
  readonly hunterRevengeChosen?: Record<PlayerId, boolean>; // 狩人が道連れを選択済みか
  // パン屋からパンを受け取ったか
  readonly receivedBread?: boolean;
  // 白怪盗から予告状を受け取ったか
  readonly receivedNotice?: boolean;
  // スタッツ
  readonly playerStats?: Record<PlayerId, PlayerStat>;
  readonly roomStats?: RoomStats;
  // FINISHEDフェーズのみ
  readonly initialRoles?: Record<string, Role>;
  readonly finalRoles?: Record<string, Role>;
  readonly allActions?: readonly GameAction[];
  readonly allVotes?: Record<PlayerId, PlayerId>;
  readonly executedPlayerIds?: readonly PlayerId[];
  readonly hunterRevengeTargets?: Record<PlayerId, PlayerId>; // 狩人の道連れ結果
  readonly winners?: readonly PlayerId[];
  readonly winningTeam?: Team | null;
  // 次ゲーム準備状態
  readonly readyForNextGame?: Record<PlayerId, boolean>;
  readonly isReadyForNextGame?: boolean; // 自分が準備完了か
  readonly allPlayersReady?: boolean; // 全員準備完了か
}

// ========================================
// プレイヤースタッツ型
// ========================================

/** プレイヤー個人スタッツ */
export interface PlayerStat {
  readonly totalGames: number;
  readonly totalWins: number;
  readonly villageGames: number;
  readonly villageWins: number;
  readonly werewolfGames: number;
  readonly werewolfWins: number;
  readonly minorityGames: number;
  readonly minorityWins: number;
}

/** ルーム全体スタッツ（ゲーム単位） */
export interface RoomStats {
  readonly gamesPlayed: number;
  readonly villageWins: number;
  readonly werewolfWins: number;
  readonly minorityWins: number;
  readonly draws: number;
}

// ========================================
// 勝敗判定型
// ========================================

/** 勝敗結果 */
export interface WinResult {
  readonly winningTeam: Team | null; // nullは引き分け
  readonly winners: readonly PlayerId[];
  readonly executedPlayerIds: readonly PlayerId[];
}

// ========================================
// データベース型
// ========================================

/** Roomsテーブルの行型 */
export interface RoomRow {
  id: string;
  version: number;
  game_state: GameState;
  created_at: string;
  updated_at: string;
}

// ========================================
// 役職メタデータ（roles.tsで定義）
// ========================================

export * from "./roles";

// ========================================
// 陣営メタデータ
// ========================================

/** 陣営名に対応するテキストカラー */
export const TEAM_COLORS: Record<string, string> = {
  "人狼陣営": "text-[var(--color-role-werewolf)]",
  "村人陣営": "text-[var(--color-ready)]",
  "第三陣営": "text-[var(--color-role-tanner)]",
};

/** 陣営に対応するボーダーカラー */
export const TEAM_BORDER_COLORS: Record<Team, {
  border: string;
  border30: string;
  border50: string;
}> = {
  WEREWOLF: { border: "border-red-500", border30: "border-red-500/30", border50: "border-red-500/50" },
  VILLAGE: { border: "border-emerald-500", border30: "border-emerald-500/30", border50: "border-emerald-500/50" },
  MINORITY: { border: "border-orange-500", border30: "border-orange-500/30", border50: "border-orange-500/50" },
};

export const TEAM_LABEL_COLORS: Record<Team, string> = {
  WEREWOLF: "text-red-400",
  VILLAGE: "text-white",
  MINORITY: "text-orange-400",
};
