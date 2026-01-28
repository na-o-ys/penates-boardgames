import type { ActionType, GameAction, GameState, Role } from "./types";
import { ROLE_HAS_ACTION } from "./types";

/** バリデーションエラー */
export interface ValidationError {
  readonly code: string;
  readonly message: string;
}

/** バリデーション結果 */
export type ValidationResult =
  | { valid: true }
  | { valid: false; error: ValidationError };

/**
 * 役職に対して有効なアクションタイプを返す
 */
export function getValidActionTypes(role: Role): readonly ActionType[] {
  switch (role) {
    case "WEREWOLF":
      return ["WEREWOLF_LOOK", "SKIP"];
    case "SEER":
      return ["SEER_LOOK_PLAYER", "SEER_LOOK_CENTER", "SKIP"];
    case "ROBBER":
      return ["ROBBER_SWAP", "SKIP"];
    case "TROUBLEMAKER":
      return ["TROUBLEMAKER_SWAP", "SKIP"];
    case "ALPHA_WOLF":
    case "VILLAGER":
    case "HUNTER":
    case "TANNER":
    case "MADMAN":
      return ["SKIP"];
  }
}

/**
 * プレイヤーが既にアクションを実行済みかチェック
 */
export function hasPlayerActed(
  state: GameState,
  playerId: string
): boolean {
  return state.actions.some((action) => action.actorId === playerId);
}

/**
 * 全員がアクションを完了したかチェック
 */
export function haveAllPlayersActed(state: GameState): boolean {
  const playersWithActions = state.players.filter((player) => {
    const role = state.initialDistribution[player.id];
    return ROLE_HAS_ACTION[role];
  });

  // アクション持ち役職は全員行動済み
  return playersWithActions.every((player) =>
    hasPlayerActed(state, player.id)
  );
}

/**
 * アクションのバリデーションを行う
 */
export function validateAction(
  state: GameState,
  action: GameAction
): ValidationResult {
  // 1. フェーズチェック
  if (state.phase !== "NIGHT") {
    return {
      valid: false,
      error: {
        code: "INVALID_PHASE",
        message: "夜フェーズでのみアクションを実行できます",
      },
    };
  }

  // 2. プレイヤー存在チェック
  const player = state.players.find((p) => p.id === action.actorId);
  if (!player) {
    return {
      valid: false,
      error: {
        code: "PLAYER_NOT_FOUND",
        message: "プレイヤーが見つかりません",
      },
    };
  }

  // 3. 重複アクションチェック
  if (hasPlayerActed(state, action.actorId)) {
    return {
      valid: false,
      error: {
        code: "ALREADY_ACTED",
        message: "既にアクションを実行済みです",
      },
    };
  }

  // 4. 役職とアクションタイプの整合性チェック
  const role = state.initialDistribution[action.actorId];
  const validTypes = getValidActionTypes(role);

  if (!validTypes.includes(action.type)) {
    return {
      valid: false,
      error: {
        code: "INVALID_ACTION_TYPE",
        message: `${role}は${action.type}を実行できません`,
      },
    };
  }

  // 5. ターゲットのバリデーション
  const targetValidation = validateTargets(state, action);
  if (!targetValidation.valid) {
    return targetValidation;
  }

  return { valid: true };
}

/**
 * アクションのターゲットをバリデーション
 */
function validateTargets(
  state: GameState,
  action: GameAction
): ValidationResult {
  const playerIds = state.players.map((p) => p.id);
  const centerIds = ["CENTER_0", "CENTER_1"];

  switch (action.type) {
    case "SKIP":
      // SKIPはターゲット不要
      if (action.targetIds.length !== 0) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET_COUNT",
            message: "SKIPにはターゲットは不要です",
          },
        };
      }
      return { valid: true };

    case "WEREWOLF_LOOK":
      // 人狼: 中央カード1枚を見る（単独時のみ）
      if (action.targetIds.length !== 1) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET_COUNT",
            message: "中央カードを1枚選択してください",
          },
        };
      }
      if (!centerIds.includes(action.targetIds[0])) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET",
            message: "中央カードのみ選択できます",
          },
        };
      }
      return { valid: true };

    case "SEER_LOOK_PLAYER":
      // 占い師: 他プレイヤー1人のカードを見る
      if (action.targetIds.length !== 1) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET_COUNT",
            message: "プレイヤーを1人選択してください",
          },
        };
      }
      if (!playerIds.includes(action.targetIds[0])) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET",
            message: "プレイヤーを選択してください",
          },
        };
      }
      if (action.targetIds[0] === action.actorId) {
        return {
          valid: false,
          error: {
            code: "CANNOT_TARGET_SELF",
            message: "自分自身は選択できません",
          },
        };
      }
      return { valid: true };

    case "SEER_LOOK_CENTER":
      // 占い師: 中央カード2枚を見る
      if (action.targetIds.length !== 2) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET_COUNT",
            message: "中央カードを2枚選択してください",
          },
        };
      }
      if (!action.targetIds.every((id) => centerIds.includes(id))) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET",
            message: "中央カードのみ選択できます",
          },
        };
      }
      return { valid: true };

    case "ROBBER_SWAP":
      // 怪盗: 他プレイヤー1人とカード交換
      if (action.targetIds.length !== 1) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET_COUNT",
            message: "プレイヤーを1人選択してください",
          },
        };
      }
      if (!playerIds.includes(action.targetIds[0])) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET",
            message: "プレイヤーを選択してください",
          },
        };
      }
      if (action.targetIds[0] === action.actorId) {
        return {
          valid: false,
          error: {
            code: "CANNOT_TARGET_SELF",
            message: "自分自身は選択できません",
          },
        };
      }
      return { valid: true };

    case "TROUBLEMAKER_SWAP":
      // トラブルメーカー: 他プレイヤー2人のカードを交換
      if (action.targetIds.length !== 2) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET_COUNT",
            message: "プレイヤーを2人選択してください",
          },
        };
      }
      if (!action.targetIds.every((id) => playerIds.includes(id))) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET",
            message: "プレイヤーを選択してください",
          },
        };
      }
      if (action.targetIds.includes(action.actorId)) {
        return {
          valid: false,
          error: {
            code: "CANNOT_TARGET_SELF",
            message: "自分自身は選択できません",
          },
        };
      }
      if (action.targetIds[0] === action.targetIds[1]) {
        return {
          valid: false,
          error: {
            code: "DUPLICATE_TARGET",
            message: "同じプレイヤーを2回選択できません",
          },
        };
      }
      return { valid: true };

    case "HUNTER_REVENGE":
      // 狩人: 自分以外のプレイヤー1人を道連れにする
      if (action.targetIds.length !== 1) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET_COUNT",
            message: "プレイヤーを1人選択してください",
          },
        };
      }
      if (!playerIds.includes(action.targetIds[0])) {
        return {
          valid: false,
          error: {
            code: "INVALID_TARGET",
            message: "プレイヤーを選択してください",
          },
        };
      }
      if (action.targetIds[0] === action.actorId) {
        return {
          valid: false,
          error: {
            code: "CANNOT_TARGET_SELF",
            message: "自分自身は選択できません",
          },
        };
      }
      return { valid: true };

    default:
      return {
        valid: false,
        error: {
          code: "UNKNOWN_ACTION_TYPE",
          message: "不明なアクションタイプです",
        },
      };
  }
}

/** 投票スキップ用の特別な値 */
export const SKIP_VOTE = "SKIP_VOTE";

/**
 * 投票のバリデーションを行う
 */
export function validateVote(
  state: GameState,
  voterId: string,
  targetId: string
): ValidationResult {
  // 1. フェーズチェック
  if (state.phase !== "VOTING") {
    return {
      valid: false,
      error: {
        code: "INVALID_PHASE",
        message: "投票フェーズでのみ投票できます",
      },
    };
  }

  // 2. 投票者存在チェック
  const voter = state.players.find((p) => p.id === voterId);
  if (!voter) {
    return {
      valid: false,
      error: {
        code: "VOTER_NOT_FOUND",
        message: "投票者が見つかりません",
      },
    };
  }

  // 3. 投票先存在チェック（SKIP_VOTEは許可）
  if (targetId !== SKIP_VOTE) {
    const target = state.players.find((p) => p.id === targetId);
    if (!target) {
      return {
        valid: false,
        error: {
          code: "TARGET_NOT_FOUND",
          message: "投票先が見つかりません",
        },
      };
    }
  }

  // 4. 重複投票チェック
  if (state.votes[voterId] !== undefined) {
    return {
      valid: false,
      error: {
        code: "ALREADY_VOTED",
        message: "既に投票済みです",
      },
    };
  }

  return { valid: true };
}

/**
 * 全員が投票を完了したかチェック
 */
export function haveAllPlayersVoted(state: GameState): boolean {
  return state.players.every((player) => state.votes[player.id] !== undefined);
}

/**
 * 狩人の道連れアクションのバリデーション
 */
export function validateHunterRevenge(
  state: GameState,
  hunterId: string,
  targetId: string
): ValidationResult {
  // 1. フェーズチェック
  if (state.phase !== "HUNTER_REVENGE") {
    return {
      valid: false,
      error: {
        code: "INVALID_PHASE",
        message: "狩人の道連れフェーズでのみ実行できます",
      },
    };
  }

  // 2. 狩人存在チェック
  const hunter = state.players.find((p) => p.id === hunterId);
  if (!hunter) {
    return {
      valid: false,
      error: {
        code: "HUNTER_NOT_FOUND",
        message: "狩人が見つかりません",
      },
    };
  }

  // 3. ターゲット存在チェック
  const target = state.players.find((p) => p.id === targetId);
  if (!target) {
    return {
      valid: false,
      error: {
        code: "TARGET_NOT_FOUND",
        message: "道連れ対象が見つかりません",
      },
    };
  }

  // 4. 自分自身チェック
  if (hunterId === targetId) {
    return {
      valid: false,
      error: {
        code: "CANNOT_TARGET_SELF",
        message: "自分自身は選択できません",
      },
    };
  }

  // 5. 重複選択チェック
  if (state.hunterRevengeTarget[hunterId] !== undefined) {
    return {
      valid: false,
      error: {
        code: "ALREADY_CHOSEN",
        message: "既に道連れを選択済みです",
      },
    };
  }

  return { valid: true };
}

/**
 * 全ての処刑された狩人が道連れを選択したかチェック
 */
export function haveAllExecutedHuntersChosen(
  state: GameState,
  executedHunterIds: readonly string[]
): boolean {
  return executedHunterIds.every(
    (hunterId) => state.hunterRevengeTarget[hunterId] !== undefined
  );
}
