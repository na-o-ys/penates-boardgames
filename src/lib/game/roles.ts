import type { Role, Team } from "./types";

// ========================================
// 役職定義型
// ========================================

export interface RoleDefinition {
  name: string;
  team: Team;
  priority: number;
  hasNightAction: boolean;
  isWerewolfExecution: boolean;    // 処刑時に人狼扱い（人狼陣営の敗北条件）
  isWerewolfNightAlly: boolean;    // 夜の仲間チェック対象
  revealsCenter: boolean;
  voteWeight: number;              // 投票の重み（通常1、村長は2）
  materialIcon: string;
  cardColors: { bg: string; border: string; text: string };
  accentColors: { border30: string; gradient: string; iconBorder: string; iconText: string };
  description: { team: string; ability: string; winCondition: string };
}

// ========================================
// 各役職の定義
// ========================================

const werewolf: RoleDefinition = {
  name: "人狼",
  team: "WEREWOLF",
  priority: 1,
  hasNightAction: true,
  isWerewolfExecution: true,
  isWerewolfNightAlly: true,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "pets",
  cardColors: { bg: "bg-red-900", border: "border-red-500", text: "text-red-200" },
  accentColors: { border30: "border-red-500/30", gradient: "to-red-500/10", iconBorder: "border-red-500/50", iconText: "text-red-400" },
  description: {
    team: "人狼陣営",
    ability: "夜に仲間の人狼を確認できます。",
    winCondition: "人狼が1人も処刑されなければ勝利",
  },
};

const alphaWolf: RoleDefinition = {
  name: "大狼",
  team: "WEREWOLF",
  priority: 1,
  hasNightAction: true,
  isWerewolfExecution: true,
  isWerewolfNightAlly: true,
  revealsCenter: true,
  voteWeight: 1,
  materialIcon: "pets",
  cardColors: { bg: "bg-purple-900", border: "border-purple-500", text: "text-purple-200" },
  accentColors: { border30: "border-purple-500/30", gradient: "to-purple-500/10", iconBorder: "border-purple-500/50", iconText: "text-purple-400" },
  description: {
    team: "人狼陣営",
    ability: "夜に仲間の人狼を確認し、墓地のカード2枚が自動的に開示されます。",
    winCondition: "人狼が1人も処刑されなければ勝利",
  },
};

const villager: RoleDefinition = {
  name: "村人",
  team: "VILLAGE",
  priority: 99,
  hasNightAction: false,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "accessibility_new",
  cardColors: { bg: "bg-slate-700", border: "border-slate-500", text: "text-slate-300" },
  accentColors: { border30: "border-slate-500/30", gradient: "to-slate-500/10", iconBorder: "border-slate-500/50", iconText: "text-slate-300" },
  description: {
    team: "村人陣営",
    ability: "特殊能力はありません。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
};

const seer: RoleDefinition = {
  name: "占い師",
  team: "VILLAGE",
  priority: 2,
  hasNightAction: true,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "visibility",
  cardColors: { bg: "bg-indigo-900", border: "border-indigo-400", text: "text-indigo-200" },
  accentColors: { border30: "border-indigo-400/30", gradient: "to-indigo-400/10", iconBorder: "border-indigo-400/50", iconText: "text-indigo-400" },
  description: {
    team: "村人陣営",
    ability: "夜に他プレイヤー1人の役職、または中央カード2枚を確認できます。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
};

const robber: RoleDefinition = {
  name: "怪盗",
  team: "VILLAGE",
  priority: 3,
  hasNightAction: true,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "theater_comedy",
  cardColors: { bg: "bg-gray-800", border: "border-gray-400", text: "text-gray-200" },
  accentColors: { border30: "border-gray-400/30", gradient: "to-gray-400/10", iconBorder: "border-gray-400/50", iconText: "text-gray-300" },
  description: {
    team: "村人陣営",
    ability: "夜に他プレイヤー1人と役職を交換し、新しい役職を確認できます。",
    winCondition: "交換後の役職の陣営として勝敗判定",
  },
};

const whiteRobber: RoleDefinition = {
  name: "白怪盗",
  team: "VILLAGE",
  priority: 3,
  hasNightAction: true,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "mail",
  cardColors: { bg: "bg-gray-800", border: "border-white", text: "text-white" },
  accentColors: { border30: "border-white/30", gradient: "to-white/10", iconBorder: "border-white/50", iconText: "text-white" },
  description: {
    team: "村人陣営",
    ability: "夜に他プレイヤー1人と役職を交換し、新しい役職を確認できます。また、ランダムなプレイヤーに予告状を届けます（届け先は自分にもわかりません）。",
    winCondition: "交換後の役職の陣営として勝敗判定",
  },
};

const troublemaker: RoleDefinition = {
  name: "トラブルメーカー",
  team: "VILLAGE",
  priority: 4,
  hasNightAction: true,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "sync_alt",
  cardColors: { bg: "bg-emerald-900", border: "border-emerald-400", text: "text-emerald-200" },
  accentColors: { border30: "border-emerald-400/30", gradient: "to-emerald-400/10", iconBorder: "border-emerald-400/50", iconText: "text-emerald-400" },
  description: {
    team: "村人陣営",
    ability: "夜に他の2人のプレイヤーの役職を交換します（中身は見られません）。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
};

const hunter: RoleDefinition = {
  name: "狩人",
  team: "VILLAGE",
  priority: 99,
  hasNightAction: false,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "gps_fixed",
  cardColors: { bg: "bg-green-900", border: "border-green-400", text: "text-green-200" },
  accentColors: { border30: "border-green-400/30", gradient: "to-green-400/10", iconBorder: "border-green-400/50", iconText: "text-green-400" },
  description: {
    team: "村人陣営",
    ability: "処刑された場合、道連れにするプレイヤーを1人選べます。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
};

const tanner: RoleDefinition = {
  name: "吊人",
  team: "MINORITY",
  priority: 99,
  hasNightAction: false,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "sentiment_very_dissatisfied",
  cardColors: { bg: "bg-orange-900", border: "border-orange-400", text: "text-orange-200" },
  accentColors: { border30: "border-orange-400/30", gradient: "to-orange-400/10", iconBorder: "border-orange-400/50", iconText: "text-orange-400" },
  description: {
    team: "第三陣営",
    ability: "特殊能力はありません。",
    winCondition: "自分が処刑されれば単独勝利",
  },
};

const madman: RoleDefinition = {
  name: "狂人",
  team: "WEREWOLF",
  priority: 99,
  hasNightAction: false,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "pets",
  cardColors: { bg: "bg-gray-700", border: "border-gray-400", text: "text-gray-300" },
  accentColors: { border30: "border-gray-400/30", gradient: "to-gray-400/10", iconBorder: "border-gray-400/50", iconText: "text-gray-400" },
  description: {
    team: "人狼陣営",
    ability: "特殊能力はありません。人狼の仲間として村人を欺きましょう。",
    winCondition: "人狼が1人も処刑されなければ勝利（自分が処刑されても負けにならない）",
  },
};

const baker: RoleDefinition = {
  name: "パン屋",
  team: "VILLAGE",
  priority: 99,
  hasNightAction: false,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "bakery_dining",
  cardColors: { bg: "bg-amber-900", border: "border-amber-400", text: "text-amber-200" },
  accentColors: { border30: "border-amber-400/30", gradient: "to-amber-400/10", iconBorder: "border-amber-400/50", iconText: "text-amber-400" },
  description: {
    team: "村人陣営",
    ability: "夜にランダムなプレイヤーにパンを届けます。届け先は自分にもわかりません。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
};

const mayor: RoleDefinition = {
  name: "村長",
  team: "VILLAGE",
  priority: 99,
  hasNightAction: false,
  isWerewolfExecution: false,
  isWerewolfNightAlly: false,
  revealsCenter: false,
  voteWeight: 2,
  materialIcon: "account_balance",
  cardColors: { bg: "bg-blue-900", border: "border-blue-400", text: "text-blue-200" },
  accentColors: { border30: "border-blue-400/30", gradient: "to-blue-400/10", iconBorder: "border-blue-400/50", iconText: "text-blue-400" },
  description: {
    team: "村人陣営",
    ability: "投票が2票分としてカウントされます。",
    winCondition: "人狼を1人以上処刑すれば勝利",
  },
};

const cia: RoleDefinition = {
  name: "CIA",
  team: "VILLAGE",
  priority: 1,
  hasNightAction: false,
  isWerewolfExecution: false,
  isWerewolfNightAlly: true,
  revealsCenter: false,
  voteWeight: 1,
  materialIcon: "policy",
  cardColors: { bg: "bg-cyan-900", border: "border-cyan-400", text: "text-cyan-200" },
  accentColors: { border30: "border-cyan-400/30", gradient: "to-cyan-400/10", iconBorder: "border-cyan-400/50", iconText: "text-cyan-400" },
  description: {
    team: "村人陣営",
    ability: "夜の人狼仲間確認に人狼として参加します。",
    winCondition: "人狼を1人以上処刑すれば勝利（※自分がCIAであることを話してはいけません）",
  },
};

// ========================================
// ROLESマップ
// ========================================

export const ROLES: Record<Role, RoleDefinition> = {
  WEREWOLF: werewolf,
  ALPHA_WOLF: alphaWolf,
  VILLAGER: villager,
  SEER: seer,
  ROBBER: robber,
  WHITE_ROBBER: whiteRobber,
  TROUBLEMAKER: troublemaker,
  HUNTER: hunter,
  TANNER: tanner,
  MADMAN: madman,
  BAKER: baker,
  MAYOR: mayor,
  CIA: cia,
};

// ========================================
// 無効化された役職
// ========================================

export const DISABLED_ROLES: ReadonlySet<Role> = new Set(["TROUBLEMAKER"]);

// ========================================
// 選択可能な役職（VILLAGER以外）
// ========================================

export const SELECTABLE_ROLES: readonly Role[] = ([
  "WEREWOLF",
  "ALPHA_WOLF",
  "MADMAN",
  "SEER",
  "CIA",
  "ROBBER",
  "WHITE_ROBBER",
  "TROUBLEMAKER",
  "HUNTER",
  "MAYOR",
  "BAKER",
  "TANNER",
] as const).filter((r) => !DISABLED_ROLES.has(r));
