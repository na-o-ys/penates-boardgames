import type { GameAction, GameConfig, GameState, Phase, Player, PlayerId, Role } from "./types";
import { ROLES } from "./types";
import { distributeRoles } from "./distribution";
import { getActionResult } from "./resolver";
import { resolveFinalRoles } from "./resolver";
import { calculateExecutedPlayers } from "./judge";
import { validateAction, validateVote, validateHunterRevenge, haveAllPlayersVoted, haveAllExecutedHuntersChosen } from "./validator";

/**
 * プレイヤー人数に応じたデフォルト役職構成を返す
 */
function getDefaultRoles(playerCount: number): Role[] {
  switch (playerCount) {
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

/**
 * 初期ゲーム状態を作成
 */
export function createInitialGameState(roomId: string): GameState {
  return {
    roomId,
    phase: "LOBBY",
    players: [],
    config: {
      roles: getDefaultRoles(3),
      nightDuration: 30,
      dayDuration: 120,
      votingDuration: 30,
      updatedAt: 0,
    },
    initialDistribution: {},
    actions: [],
    votes: {},
    hunterRevengeTarget: {},
    breadRecipientId: null,
    noticeRecipientId: null,
    phaseStartedAt: null,
  };
}

/** 議論フェーズのデフォルト時間を算出（(人数-1)分、最低1分） */
function defaultDayDuration(playerCount: number): number {
  return Math.max(60, (playerCount - 1) * 60);
}

/**
 * プレイヤーを追加
 */
export function addPlayer(
  state: GameState,
  player: Player
): GameState {
  if (state.phase !== "LOBBY") {
    throw new Error("ロビーフェーズでのみプレイヤーを追加できます");
  }

  if (state.players.some((p) => p.id === player.id)) {
    throw new Error("既に参加済みのプレイヤーです");
  }

  const newPlayers = [...state.players, player];
  return {
    ...state,
    players: newPlayers,
    config: {
      ...state.config,
      roles: getDefaultRoles(newPlayers.length),
      dayDuration: defaultDayDuration(newPlayers.length),
    },
  };
}

/**
 * プレイヤーを削除
 */
export function removePlayer(
  state: GameState,
  playerId: PlayerId
): GameState {
  if (state.phase !== "LOBBY") {
    throw new Error("ロビーフェーズでのみプレイヤーを削除できます");
  }

  const newPlayers = state.players.filter((p) => p.id !== playerId);
  return {
    ...state,
    players: newPlayers,
    config: {
      ...state.config,
      roles: getDefaultRoles(newPlayers.length),
      dayDuration: defaultDayDuration(newPlayers.length),
    },
  };
}

/**
 * ゲーム設定を更新
 */
export function updateConfig(
  state: GameState,
  config: GameConfig
): GameState {
  if (state.phase !== "LOBBY") {
    throw new Error("ロビーフェーズでのみ設定を変更できます");
  }

  return {
    ...state,
    config,
  };
}

/**
 * ゲームを開始（ロビー → 夜フェーズ）
 */
export function startGame(state: GameState): GameState {
  if (state.phase !== "LOBBY") {
    throw new Error("ロビーフェーズからのみゲームを開始できます");
  }

  if (state.players.length < 3) {
    throw new Error("最低3人のプレイヤーが必要です");
  }

  const requiredRoles = state.players.length + 2;
  if (state.config.roles.length !== requiredRoles) {
    throw new Error(
      `役職数が不正です。必要: ${requiredRoles}, 設定: ${state.config.roles.length}`
    );
  }

  // 役職を配布
  const distribution = distributeRoles(state.players, state.config.roles);

  // パン屋がいればランダムな他プレイヤーにパンを配達
  const bakerEntry = Object.entries(distribution).find(
    ([id, role]) => role === "BAKER" && !id.startsWith("CENTER")
  );
  let breadRecipientId: PlayerId | null = null;
  if (bakerEntry) {
    const bakerId = bakerEntry[0];
    const otherPlayerIds = state.players
      .filter((p) => p.id !== bakerId)
      .map((p) => p.id);
    if (otherPlayerIds.length > 0) {
      breadRecipientId = otherPlayerIds[Math.floor(Math.random() * otherPlayerIds.length)];
    }
  }

  // 白怪盗がいればランダムな他プレイヤーに予告状を配達
  const whiteRobberEntry = Object.entries(distribution).find(
    ([id, role]) => role === "WHITE_ROBBER" && !id.startsWith("CENTER")
  );
  let noticeRecipientId: PlayerId | null = null;
  if (whiteRobberEntry) {
    const whiteRobberId = whiteRobberEntry[0];
    const otherPlayerIds = state.players
      .filter((p) => p.id !== whiteRobberId)
      .map((p) => p.id);
    if (otherPlayerIds.length > 0) {
      noticeRecipientId = otherPlayerIds[Math.floor(Math.random() * otherPlayerIds.length)];
    }
  }

  const nightState: GameState = {
    ...state,
    phase: "NIGHT",
    initialDistribution: distribution,
    breadRecipientId,
    noticeRecipientId,
    phaseStartedAt: Date.now(),
  };

  // 夜アクションを持つプレイヤーがいない場合は即座に昼フェーズへ
  if (shouldAutoAdvanceFromNight(nightState)) {
    return advancePhase(nightState);
  }

  return nightState;
}

/**
 * 固定配置でゲームを開始（テスト用）
 */
export function startGameWithDistribution(
  state: GameState,
  distribution: Record<string, Role>
): GameState {
  if (state.phase !== "LOBBY") {
    throw new Error("ロビーフェーズからのみゲームを開始できます");
  }

  if (state.players.length < 3) {
    throw new Error("最低3人のプレイヤーが必要です");
  }

  // パン屋がいればランダムな他プレイヤーにパンを配達（テスト用固定配置）
  const bakerEntryTest = Object.entries(distribution).find(
    ([id, role]) => role === "BAKER" && !id.startsWith("CENTER")
  );
  let breadRecipientIdTest: PlayerId | null = null;
  if (bakerEntryTest) {
    const bakerId = bakerEntryTest[0];
    const otherPlayerIds = state.players
      .filter((p) => p.id !== bakerId)
      .map((p) => p.id);
    if (otherPlayerIds.length > 0) {
      breadRecipientIdTest = otherPlayerIds[Math.floor(Math.random() * otherPlayerIds.length)];
    }
  }

  // 白怪盗がいればランダムな他プレイヤーに予告状を配達（テスト用固定配置）
  const whiteRobberEntryTest = Object.entries(distribution).find(
    ([id, role]) => role === "WHITE_ROBBER" && !id.startsWith("CENTER")
  );
  let noticeRecipientIdTest: PlayerId | null = null;
  if (whiteRobberEntryTest) {
    const whiteRobberId = whiteRobberEntryTest[0];
    const otherPlayerIds = state.players
      .filter((p) => p.id !== whiteRobberId)
      .map((p) => p.id);
    if (otherPlayerIds.length > 0) {
      noticeRecipientIdTest = otherPlayerIds[Math.floor(Math.random() * otherPlayerIds.length)];
    }
  }

  const nightState: GameState = {
    ...state,
    phase: "NIGHT",
    initialDistribution: distribution,
    breadRecipientId: breadRecipientIdTest,
    noticeRecipientId: noticeRecipientIdTest,
    phaseStartedAt: Date.now(),
  };

  // 夜アクションを持つプレイヤーがいない場合は即座に昼フェーズへ
  if (shouldAutoAdvanceFromNight(nightState)) {
    return advancePhase(nightState);
  }

  return nightState;
}

/**
 * 夜アクションを実行
 */
export function executeNightAction(
  state: GameState,
  action: GameAction
): GameState {
  // バリデーション
  const validation = validateAction(state, action);
  if (!validation.valid) {
    throw new Error(validation.error.message);
  }

  // アクション結果を計算
  const result = getActionResult(
    state.initialDistribution,
    state.actions,
    action
  );

  // 結果を含むアクションを作成
  const actionWithResult: GameAction = {
    ...action,
    result,
  };

  const newState: GameState = {
    ...state,
    actions: [...state.actions, actionWithResult],
  };

  // 全員のアクションが完了したかチェック
  if (shouldAutoAdvanceFromNight(newState)) {
    return advancePhase(newState);
  }

  return newState;
}

/**
 * 夜フェーズから自動進行すべきかチェック
 */
function shouldAutoAdvanceFromNight(state: GameState): boolean {
  // アクション持ちの役職を持つプレイヤーを取得
  const playersWithActions = state.players.filter((player) => {
    const role = state.initialDistribution[player.id];
    return ROLES[role].hasNightAction;
  });

  // 全員がアクションを実行したかチェック
  return playersWithActions.every((player) =>
    state.actions.some((action) => action.actorId === player.id)
  );
}

/**
 * 投票を実行
 */
export function executeVote(
  state: GameState,
  voterId: PlayerId,
  targetId: PlayerId
): GameState {
  // バリデーション
  const validation = validateVote(state, voterId, targetId);
  if (!validation.valid) {
    throw new Error(validation.error.message);
  }

  const newState: GameState = {
    ...state,
    votes: {
      ...state.votes,
      [voterId]: targetId,
    },
  };

  // 全員の投票が完了したかチェック
  if (haveAllPlayersVoted(newState)) {
    return advancePhase(newState);
  }

  return newState;
}

/**
 * フェーズを進行
 */
export function advancePhase(state: GameState): GameState {
  const nextPhase = getNextPhase(state.phase, state);

  if (nextPhase === null) {
    throw new Error("これ以上フェーズを進行できません");
  }

  return {
    ...state,
    phase: nextPhase,
    phaseStartedAt: Date.now(),
  };
}

/**
 * 次のフェーズを取得
 */
function getNextPhase(currentPhase: Phase, state?: GameState): Phase | null {
  switch (currentPhase) {
    case "LOBBY":
      return "NIGHT";
    case "NIGHT":
      return "DAY";
    case "DAY":
      return "VOTING";
    case "VOTING":
      // 投票完了時に狩人が処刑されるかチェック
      if (state) {
        const executedIds = calculateExecutedPlayers(state.votes, state.initialDistribution);
        const finalRoles = resolveFinalRoles(state.initialDistribution, state.actions);
        const hasExecutedHunter = executedIds.some((id) => finalRoles[id] === "HUNTER");
        if (hasExecutedHunter) {
          return "HUNTER_REVENGE";
        }
      }
      return "RESULT";
    case "HUNTER_REVENGE":
      return "RESULT";
    case "RESULT":
      return null;
  }
}

/**
 * 狩人の道連れアクションを実行
 */
export function executeHunterRevenge(
  state: GameState,
  hunterId: PlayerId,
  targetId: PlayerId
): GameState {
  // バリデーション
  const validation = validateHunterRevenge(state, hunterId, targetId);
  if (!validation.valid) {
    throw new Error(validation.error.message);
  }

  // 処刑された狩人のIDリストを取得
  const executedIds = calculateExecutedPlayers(state.votes, state.initialDistribution);
  const finalRoles = resolveFinalRoles(state.initialDistribution, state.actions);
  const executedHunterIds = executedIds.filter((id) => finalRoles[id] === "HUNTER");

  const newState: GameState = {
    ...state,
    hunterRevengeTarget: {
      ...state.hunterRevengeTarget,
      [hunterId]: targetId,
    },
  };

  // 全ての処刑された狩人が道連れを選択したかチェック
  if (haveAllExecutedHuntersChosen(newState, executedHunterIds)) {
    return advancePhase(newState);
  }

  return newState;
}

/**
 * ゲームをリセット（結果 → ロビー）
 */
export function resetGame(state: GameState): GameState {
  return {
    ...state,
    phase: "LOBBY",
    initialDistribution: {},
    actions: [],
    votes: {},
    hunterRevengeTarget: {},
    breadRecipientId: null,
    noticeRecipientId: null,
    phaseStartedAt: null,
  };
}

/**
 * ゲーム全体のReducer
 */
export type GameActionType =
  | { type: "ADD_PLAYER"; player: Player }
  | { type: "REMOVE_PLAYER"; playerId: PlayerId }
  | { type: "UPDATE_CONFIG"; config: GameConfig }
  | { type: "START_GAME" }
  | { type: "START_GAME_WITH_DISTRIBUTION"; distribution: Record<string, Role> }
  | { type: "EXECUTE_NIGHT_ACTION"; action: GameAction }
  | { type: "EXECUTE_VOTE"; voterId: PlayerId; targetId: PlayerId }
  | { type: "ADVANCE_PHASE" }
  | { type: "RESET_GAME" };

export function gameReducer(
  state: GameState,
  action: GameActionType
): GameState {
  switch (action.type) {
    case "ADD_PLAYER":
      return addPlayer(state, action.player);
    case "REMOVE_PLAYER":
      return removePlayer(state, action.playerId);
    case "UPDATE_CONFIG":
      return updateConfig(state, action.config);
    case "START_GAME":
      return startGame(state);
    case "START_GAME_WITH_DISTRIBUTION":
      return startGameWithDistribution(state, action.distribution);
    case "EXECUTE_NIGHT_ACTION":
      return executeNightAction(state, action.action);
    case "EXECUTE_VOTE":
      return executeVote(state, action.voterId, action.targetId);
    case "ADVANCE_PHASE":
      return advancePhase(state);
    case "RESET_GAME":
      return resetGame(state);
  }
}
