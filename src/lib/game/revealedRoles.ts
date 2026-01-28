import type { ActionResult, GameAction, Player, Role } from "./types";

export interface RevealedInfo {
  players: Record<string, Role>;
  centers: Record<string, Role>;
}

/**
 * actionResults から判明済みの役職情報を抽出する
 */
export function buildRevealedInfo(actionResults: readonly ActionResult[]): RevealedInfo {
  const players: Record<string, Role> = {};
  const centers: Record<string, Role> = {};

  for (const result of actionResults) {
    if (!result.revealedRoles?.length) continue;

    switch (result.type) {
      case "SEER_LOOK_PLAYER":
        players[result.targetIds[0]] = result.revealedRoles[0];
        break;
      case "ROBBER_SWAP":
        players[result.targetIds[0]] = result.revealedRoles[0];
        break;
      case "SEER_LOOK_CENTER":
        result.targetIds.forEach((id, i) => {
          centers[id] = result.revealedRoles![i];
        });
        break;
      case "WEREWOLF_LOOK":
        centers[result.targetIds[0]] = result.revealedRoles[0];
        break;
    }
  }

  return { players, centers };
}

/**
 * 交換によって役職が変わったプレイヤーの交換理由を返す
 */
export function getSwapReason(
  playerId: string,
  allActions: readonly GameAction[],
  players: readonly Player[]
): string | null {
  for (const action of allActions) {
    if (action.type === "ROBBER_SWAP" && action.targetIds[0] === playerId) {
      const robberName = players.find((p) => p.id === action.actorId)?.name;
      return `${robberName ?? "怪盗"}に奪われた`;
    }
    if (action.type === "ROBBER_SWAP" && action.actorId === playerId) {
      const targetName = players.find((p) => p.id === action.targetIds[0])?.name;
      return `${targetName ?? "相手"}から奪った`;
    }
    if (
      action.type === "TROUBLEMAKER_SWAP" &&
      (action.targetIds[0] === playerId || action.targetIds[1] === playerId)
    ) {
      const makerName = players.find((p) => p.id === action.actorId)?.name;
      return `${makerName ?? "トラブルメーカー"}に交換された`;
    }
  }
  return null;
}
