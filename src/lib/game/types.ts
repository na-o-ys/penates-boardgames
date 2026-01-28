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
  | "HUNTER"
  | "TANNER"
  | "MADMAN";

/** ゲームフェーズ */
export type Phase = "LOBBY" | "NIGHT" | "DAY" | "VOTING" | "HUNTER_REVENGE" | "RESULT";

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
  // 人狼用: 仲間の人狼一覧
  readonly fellowWerewolves?: readonly PlayerId[];
  // HUNTER_REVENGEフェーズ用
  readonly executedHunterIds?: readonly PlayerId[]; // 処刑された狩人のID
  readonly isExecutedHunter?: boolean; // 自分が処刑された狩人か
  readonly hunterRevengeChosen?: Record<PlayerId, boolean>; // 狩人が道連れを選択済みか
  // RESULTフェーズのみ
  readonly initialRoles?: Record<string, Role>;
  readonly finalRoles?: Record<string, Role>;
  readonly allActions?: readonly GameAction[];
  readonly allVotes?: Record<PlayerId, PlayerId>;
  readonly executedPlayerIds?: readonly PlayerId[];
  readonly hunterRevengeTargets?: Record<PlayerId, PlayerId>; // 狩人の道連れ結果
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
  HUNTER: 99,
  TANNER: 99,
  MADMAN: 99,
};

/** 役職の陣営 */
export const ROLE_TEAM: Record<Role, Team> = {
  WEREWOLF: "WEREWOLF",
  VILLAGER: "VILLAGE",
  SEER: "VILLAGE",
  ROBBER: "VILLAGE",
  TROUBLEMAKER: "VILLAGE",
  HUNTER: "VILLAGE",
  TANNER: "MINORITY",
  MADMAN: "WEREWOLF",
};

/** 役職の日本語名 */
export const ROLE_NAMES: Record<Role, string> = {
  WEREWOLF: "人狼",
  VILLAGER: "村人",
  SEER: "占い師",
  ROBBER: "怪盗",
  TROUBLEMAKER: "トラブルメーカー",
  HUNTER: "狩人",
  TANNER: "吊人",
  MADMAN: "狂人",
};

/** 役職が夜アクションを持つか */
export const ROLE_HAS_ACTION: Record<Role, boolean> = {
  WEREWOLF: true,
  SEER: true,
  ROBBER: true,
  TROUBLEMAKER: true,
  VILLAGER: false,
  HUNTER: false,
  TANNER: false,
  MADMAN: false,
};

/** 役職のMaterial Iconsアイコン名 */
export const ROLE_MATERIAL_ICONS: Record<Role, string> = {
  WEREWOLF: "pets",
  SEER: "visibility",
  ROBBER: "theater_comedy",
  TROUBLEMAKER: "sync_alt",
  VILLAGER: "accessibility_new",
  HUNTER: "gps_fixed",
  TANNER: "sentiment_very_dissatisfied",
  MADMAN: "pets",
};

/** 役職カードの配色 */
export const ROLE_CARD_COLORS: Record<Role, {
  bg: string;
  border: string;
  text: string;
}> = {
  WEREWOLF: { bg: "bg-red-900", border: "border-red-500", text: "text-red-200" },
  SEER: { bg: "bg-indigo-900", border: "border-indigo-400", text: "text-indigo-200" },
  ROBBER: { bg: "bg-gray-800", border: "border-gray-400", text: "text-gray-200" },
  TROUBLEMAKER: { bg: "bg-emerald-900", border: "border-emerald-400", text: "text-emerald-200" },
  VILLAGER: { bg: "bg-slate-700", border: "border-slate-500", text: "text-slate-300" },
  HUNTER: { bg: "bg-green-900", border: "border-green-400", text: "text-green-200" },
  TANNER: { bg: "bg-orange-900", border: "border-orange-400", text: "text-orange-200" },
  MADMAN: { bg: "bg-gray-700", border: "border-gray-400", text: "text-gray-300" },
};

/** 役職のアクセントカラー（UIカード用） */
export const ROLE_ACCENT_COLORS: Record<Role, {
  border30: string;
  gradient: string;
  iconBorder: string;
  iconText: string;
}> = {
  WEREWOLF: { border30: "border-red-500/30", gradient: "to-red-500/10", iconBorder: "border-red-500/50", iconText: "text-red-400" },
  SEER: { border30: "border-indigo-400/30", gradient: "to-indigo-400/10", iconBorder: "border-indigo-400/50", iconText: "text-indigo-400" },
  ROBBER: { border30: "border-gray-400/30", gradient: "to-gray-400/10", iconBorder: "border-gray-400/50", iconText: "text-gray-300" },
  TROUBLEMAKER: { border30: "border-emerald-400/30", gradient: "to-emerald-400/10", iconBorder: "border-emerald-400/50", iconText: "text-emerald-400" },
  VILLAGER: { border30: "border-slate-500/30", gradient: "to-slate-500/10", iconBorder: "border-slate-500/50", iconText: "text-slate-300" },
  HUNTER: { border30: "border-green-400/30", gradient: "to-green-400/10", iconBorder: "border-green-400/50", iconText: "text-green-400" },
  TANNER: { border30: "border-orange-400/30", gradient: "to-orange-400/10", iconBorder: "border-orange-400/50", iconText: "text-orange-400" },
  MADMAN: { border30: "border-gray-400/30", gradient: "to-gray-400/10", iconBorder: "border-gray-400/50", iconText: "text-gray-400" },
};

/** 役職の説明 */
export const ROLE_DESCRIPTIONS: Record<Role, {
  team: string;
  ability: string;
  winCondition: string;
}> = {
  WEREWOLF: {
    team: "人狼陣営",
    ability: "夜に仲間の人狼を確認できます。単独の場合、中央カード1枚を確認できます。",
    winCondition: "人狼が1人も処刑されなければ勝利",
  },
  VILLAGER: {
    team: "村人陣営",
    ability: "特殊能力はありません。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
  SEER: {
    team: "村人陣営",
    ability: "夜に他プレイヤー1人の役職、または中央カード2枚を確認できます。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
  ROBBER: {
    team: "村人陣営",
    ability: "夜に他プレイヤー1人と役職を交換し、新しい役職を確認できます。",
    winCondition: "交換後の役職の陣営として勝敗判定",
  },
  TROUBLEMAKER: {
    team: "村人陣営",
    ability: "夜に他の2人のプレイヤーの役職を交換します（中身は見られません）。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
  HUNTER: {
    team: "村人陣営",
    ability: "処刑された場合、道連れにするプレイヤーを1人選べます。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
  TANNER: {
    team: "第三陣営",
    ability: "特殊能力はありません。",
    winCondition: "自分が処刑されれば単独勝利",
  },
  MADMAN: {
    team: "人狼陣営",
    ability: "特殊能力はありません。人狼の仲間として村人を欺きましょう。",
    winCondition: "人狼が1人も処刑されなければ勝利（自分が処刑されても負けにならない）",
  },
};

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

/** 無効化された役職（UIに表示しない） */
export const DISABLED_ROLES: ReadonlySet<Role> = new Set(["TROUBLEMAKER"]);
