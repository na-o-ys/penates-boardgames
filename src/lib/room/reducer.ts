import type { GameConfig, Player, PlayerId, Role } from "../game/types";
import type { RoomState } from "./types";
import { startGame as startGameLogic, startGameWithDistribution as startGameWithDistributionLogic } from "../game/reducer";

/** プレイヤー人数に応じたデフォルト役職構成を返す */
function getDefaultRoles(playerCount: number): Role[] {
  switch (playerCount) {
    case 0:
    case 1:
    case 2:
      return [];
    case 3: return ["WEREWOLF", "WEREWOLF", "VILLAGER", "SEER", "ROBBER"];
    case 4: return ["WEREWOLF", "WEREWOLF", "VILLAGER", "VILLAGER", "SEER", "ROBBER"];
    case 5: return ["WEREWOLF", "WEREWOLF", "VILLAGER", "VILLAGER", "VILLAGER", "SEER", "ROBBER"];
    case 6: return ["WEREWOLF", "WEREWOLF", "VILLAGER", "VILLAGER", "VILLAGER", "VILLAGER", "SEER", "ROBBER"];
    case 7: return ["WEREWOLF", "WEREWOLF", "VILLAGER", "VILLAGER", "VILLAGER", "VILLAGER", "SEER", "SEER", "ROBBER"];
    case 8: return ["WEREWOLF", "WEREWOLF", "MADMAN", "VILLAGER", "VILLAGER", "VILLAGER", "VILLAGER", "SEER", "SEER", "ROBBER"];
    default: {
      const base = getDefaultRoles(8);
      for (let i = 8; i < playerCount; i++) base.push("VILLAGER");
      return base;
    }
  }
}

/** 議論フェーズのデフォルト時間を算出（(人数-1)分、最低1分） */
function defaultDayDuration(playerCount: number): number {
  return Math.max(60, (playerCount - 1) * 60);
}

/** 初期ルーム状態を作成 */
export function createInitialRoomState(roomId: string, host: Player): RoomState {
  return {
    roomId,
    members: [host],
    config: {
      roles: getDefaultRoles(1),
      nightDuration: 30,
      dayDuration: 120,
      votingDuration: 30,
      updatedAt: 0,
    },
    playerStats: {},
    roomStats: { gamesPlayed: 0, villageWins: 0, werewolfWins: 0, minorityWins: 0, draws: 0 },
    game: null,
  };
}

/** メンバーを追加（フェーズ制限なし） */
export function addMember(state: RoomState, player: Player): RoomState {
  if (state.members.some((m) => m.id === player.id)) {
    throw new Error("既に参加済みのメンバーです");
  }

  const newMembers = [...state.members, player];

  // ゲーム進行中は config を変更しない
  if (state.game !== null) {
    return { ...state, members: newMembers };
  }

  return {
    ...state,
    members: newMembers,
    config: {
      ...state.config,
      roles: getDefaultRoles(newMembers.length),
      dayDuration: defaultDayDuration(newMembers.length),
      updatedAt: Date.now(),
    },
  };
}

/** メンバーを削除 */
export function removeMember(state: RoomState, playerId: PlayerId): RoomState {
  if (state.game !== null && state.game.phase !== "FINISHED") {
    throw new Error("ゲーム進行中はメンバーを削除できません");
  }

  const newMembers = state.members.filter((m) => m.id !== playerId);
  return {
    ...state,
    members: newMembers,
    config: {
      ...state.config,
      roles: getDefaultRoles(newMembers.length),
      dayDuration: defaultDayDuration(newMembers.length),
      updatedAt: Date.now(),
    },
  };
}

/** ゲーム設定を更新 */
export function updateConfig(state: RoomState, config: GameConfig): RoomState {
  if (state.game !== null && state.game.phase !== "FINISHED") {
    throw new Error("ゲーム進行中は設定を変更できません");
  }
  return { ...state, config };
}

/** ゲームを開始（members → game.players にスナップショット） */
export function startGame(state: RoomState): RoomState {
  if (state.game !== null && state.game.phase !== "FINISHED") {
    throw new Error("ゲーム進行中は新しいゲームを開始できません");
  }

  const game = startGameLogic(state.members, state.config);
  return { ...state, game };
}

/** 固定配置でゲームを開始（テスト用） */
export function startGameWithDistribution(
  state: RoomState,
  distribution: Record<string, Role>
): RoomState {
  const game = startGameWithDistributionLogic(state.members, state.config, distribution);
  return { ...state, game };
}
