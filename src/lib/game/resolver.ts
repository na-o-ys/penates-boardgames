import type { GameAction, Role } from "./types";
import { ROLE_IS_WEREWOLF_ALLY, ROLE_PRIORITY } from "./types";

/**
 * アクションを優先度順にソートする
 * 優先度: WEREWOLF(1) -> SEER(2) -> ROBBER(3) -> TROUBLEMAKER(4)
 */
function sortActionsByPriority(
  actions: readonly GameAction[]
): readonly GameAction[] {
  return [...actions].sort((a, b) => {
    const priorityA = getActionPriority(a.type);
    const priorityB = getActionPriority(b.type);
    return priorityA - priorityB;
  });
}

/**
 * アクションタイプから優先度を取得
 */
function getActionPriority(actionType: string): number {
  switch (actionType) {
    case "WEREWOLF_LOOK":
      return ROLE_PRIORITY.WEREWOLF;
    case "SEER_LOOK_PLAYER":
    case "SEER_LOOK_CENTER":
      return ROLE_PRIORITY.SEER;
    case "ROBBER_SWAP":
      return ROLE_PRIORITY.ROBBER;
    case "TROUBLEMAKER_SWAP":
      return ROLE_PRIORITY.TROUBLEMAKER;
    default:
      return 99;
  }
}

/**
 * 初期配置とアクションログから最終的な役職配置を計算する
 *
 * @param initialDistribution - 初期の役職配置
 * @param actions - 実行されたアクションのログ
 * @returns 最終的な役職配置
 */
export function resolveFinalRoles(
  initialDistribution: Record<string, Role>,
  actions: readonly GameAction[]
): Record<string, Role> {
  // 初期配置をコピー
  const currentDistribution = { ...initialDistribution };

  // アクションを優先度順にソート
  const sortedActions = sortActionsByPriority(actions);

  // 各アクションの効果を適用
  for (const action of sortedActions) {
    applyActionEffect(currentDistribution, action);
  }

  return currentDistribution;
}

/**
 * アクションの効果を適用する（ミュータブルに更新）
 */
function applyActionEffect(
  distribution: Record<string, Role>,
  action: GameAction
): void {
  switch (action.type) {
    case "ROBBER_SWAP": {
      // 怪盗: 自分と対象のカードを交換
      const targetId = action.targetIds[0];
      const actorRole = distribution[action.actorId];
      const targetRole = distribution[targetId];
      distribution[action.actorId] = targetRole;
      distribution[targetId] = actorRole;
      break;
    }

    case "TROUBLEMAKER_SWAP": {
      // トラブルメーカー: 2人のカードを交換
      const [target1, target2] = action.targetIds;
      const role1 = distribution[target1];
      const role2 = distribution[target2];
      distribution[target1] = role2;
      distribution[target2] = role1;
      break;
    }

    // 以下のアクションは役職変更を伴わない
    case "WEREWOLF_LOOK":
    case "SEER_LOOK_PLAYER":
    case "SEER_LOOK_CENTER":
    case "SKIP":
      // 何もしない
      break;
  }
}

/**
 * アクション実行時に見える役職を計算する
 * （アクション実行時点での役職を返す）
 *
 * @param initialDistribution - 初期の役職配置
 * @param actions - これまでに実行されたアクション
 * @param newAction - 新しく実行するアクション
 * @returns 見える役職の配列
 */
export function getActionResult(
  initialDistribution: Record<string, Role>,
  actions: readonly GameAction[],
  newAction: GameAction
): readonly Role[] {
  // 新しいアクションより前のアクションのみを適用した状態を計算
  const priorActions = actions.filter((a) => {
    const aPriority = getActionPriority(a.type);
    const newPriority = getActionPriority(newAction.type);
    return aPriority < newPriority;
  });

  const currentDistribution = resolveFinalRoles(
    initialDistribution,
    priorActions
  );

  // アクションタイプに応じて見える役職を返す
  switch (newAction.type) {
    case "WEREWOLF_LOOK": {
      // 中央カード1枚を見る
      const targetId = newAction.targetIds[0];
      return [currentDistribution[targetId]];
    }

    case "SEER_LOOK_PLAYER": {
      // プレイヤー1人のカードを見る
      const targetId = newAction.targetIds[0];
      return [currentDistribution[targetId]];
    }

    case "SEER_LOOK_CENTER": {
      // 中央カード2枚を見る
      return newAction.targetIds.map((id) => currentDistribution[id]);
    }

    case "ROBBER_SWAP": {
      // 交換後の自分のカード（＝相手のカード）を見る
      const targetId = newAction.targetIds[0];
      return [currentDistribution[targetId]];
    }

    case "TROUBLEMAKER_SWAP":
    case "SKIP":
    case "HUNTER_REVENGE":
      // 見える役職はない
      return [];
  }
}

/**
 * 人狼が複数いるかチェック
 */
export function hasMultipleWerewolves(
  distribution: Record<string, Role>,
  playerIds: readonly string[]
): boolean {
  const werewolfCount = playerIds.filter(
    (id) => ROLE_IS_WEREWOLF_ALLY[distribution[id]]
  ).length;
  return werewolfCount >= 2;
}

/**
 * 人狼プレイヤーのIDを取得
 */
export function getWerewolfPlayerIds(
  distribution: Record<string, Role>,
  playerIds: readonly string[]
): readonly string[] {
  return playerIds.filter((id) => ROLE_IS_WEREWOLF_ALLY[distribution[id]]);
}
