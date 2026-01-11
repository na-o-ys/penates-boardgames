// ========================================
// 基本型定義
// ========================================

/** プレイヤーID (UUID) */
export type PlayerId = string;

/** 役職 */
export type Role =
  | "WEREWOLF"
  | "VILLAGER"
  | "SEER"
  | "ROBBER"
  | "TROUBLEMAKER"
  | "TANNER";

/** ゲームフェーズ */
export type Phase = "LOBBY" | "NIGHT" | "DAY" | "VOTING" | "RESULT";

/** 陣営 */
export type Team = "VILLAGE" | "WEREWOLF" | "TANNER";

/** 配置キー (プレイヤーID or 中央カード) */
export type DistributionKey = PlayerId | "CENTER_0" | "CENTER_1";

// ========================================
// アクション型
// ========================================

/** 夜アクションの種類 */
export type ActionType =
  | "WEREWOLF_LOOK" // 人狼: 中央カード確認（単独時）
  | "SEER_LOOK_PLAYER" // 占い師: プレイヤー確認
  | "SEER_LOOK_CENTER" // 占い師: 中央2枚確認
  | "ROBBER_SWAP" // 怪盗: カード交換
  | "TROUBLEMAKER_SWAP" // トラブルメーカー: 交換
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
  readonly phaseStartedAt: number | null;
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
  // RESULTフェーズのみ
  readonly finalRoles?: Record<string, Role>;
  readonly allActions?: readonly GameAction[];
  readonly allVotes?: Record<PlayerId, PlayerId>;
  readonly executedPlayerIds?: readonly PlayerId[];
  readonly winners?: readonly PlayerId[];
  readonly winningTeam?: Team | null;
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
// 役職メタデータ
// ========================================

/** 役職の優先度（夜アクション順） */
export const ROLE_PRIORITY: Record<Role, number> = {
  WEREWOLF: 1,
  SEER: 2,
  ROBBER: 3,
  TROUBLEMAKER: 4,
  VILLAGER: 99,
  TANNER: 99,
};

/** 役職の陣営 */
export const ROLE_TEAM: Record<Role, Team> = {
  WEREWOLF: "WEREWOLF",
  VILLAGER: "VILLAGE",
  SEER: "VILLAGE",
  ROBBER: "VILLAGE",
  TROUBLEMAKER: "VILLAGE",
  TANNER: "TANNER",
};

/** 役職の日本語名 */
export const ROLE_NAMES: Record<Role, string> = {
  WEREWOLF: "人狼",
  VILLAGER: "村人",
  SEER: "占い師",
  ROBBER: "怪盗",
  TROUBLEMAKER: "トラブルメーカー",
  TANNER: "吊人",
};

/** 役職が夜アクションを持つか */
export const ROLE_HAS_ACTION: Record<Role, boolean> = {
  WEREWOLF: true,
  SEER: true,
  ROBBER: true,
  TROUBLEMAKER: true,
  VILLAGER: false,
  TANNER: false,
};
