import type { GameAction, GameConfig, GamePhase, GameState, Player, PlayerId, PlayerStat, Role, RoomStats } from "./types";
import { ROLES } from "./types";
import { distributeRoles } from "./distribution";
import { getActionResult } from "./resolver";
import { resolveFinalRoles } from "./resolver";
import { calculateExecutedPlayers, calculateGameResult } from "./judge";
import { validateAction, validateVote, validateHunterRevenge, haveAllPlayersVoted, haveAllExecutedHuntersChosen } from "./validator";

/**
 * ゲームを開始（members + config からゲーム状態を生成）
 */
export function startGame(
  members: readonly Player[],
  config: GameConfig
): GameState {
  if (members.length < 3) {
    throw new Error("最低3人のプレイヤーが必要です");
  }

  const requiredRoles = members.length + 2;
  if (config.roles.length !== requiredRoles) {
    throw new Error(
      `役職数が不正です。必要: ${requiredRoles}, 設定: ${config.roles.length}`
    );
  }

  // 役職を配布
  const distribution = distributeRoles(members, config.roles, {
    noPeaceVillage: config.options?.noPeaceVillage,
  });

  // パン屋がいればランダムな他プレイヤーにパンを配達
  const breadRecipientId = findRandomRecipient(distribution, members, "BAKER");

  // 白怪盗がいればランダムな他プレイヤーに予告状を配達
  const noticeRecipientId = findRandomRecipient(distribution, members, "WHITE_ROBBER");

  const nightState: GameState = {
    phase: "NIGHT",
    players: [...members],
    initialDistribution: distribution,
    actions: [],
    votes: {},
    hunterRevengeTarget: {},
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
  members: readonly Player[],
  config: GameConfig,
  distribution: Record<string, Role>
): GameState {
  if (members.length < 3) {
    throw new Error("最低3人のプレイヤーが必要です");
  }

  const breadRecipientId = findRandomRecipient(distribution, members, "BAKER");
  const noticeRecipientId = findRandomRecipient(distribution, members, "WHITE_ROBBER");

  const nightState: GameState = {
    phase: "NIGHT",
    players: [...members],
    initialDistribution: distribution,
    actions: [],
    votes: {},
    hunterRevengeTarget: {},
    breadRecipientId,
    noticeRecipientId,
    phaseStartedAt: Date.now(),
  };

  if (shouldAutoAdvanceFromNight(nightState)) {
    return advancePhase(nightState);
  }

  return nightState;
}

/**
 * 特定の役職のプレイヤーから、ランダムな他プレイヤーを選ぶ
 */
function findRandomRecipient(
  distribution: Record<string, Role>,
  members: readonly Player[],
  role: Role
): PlayerId | null {
  const entry = Object.entries(distribution).find(
    ([id, r]) => r === role && !id.startsWith("CENTER")
  );
  if (!entry) return null;

  const sourceId = entry[0];
  const otherIds = members.filter((p) => p.id !== sourceId).map((p) => p.id);
  if (otherIds.length === 0) return null;

  return otherIds[Math.floor(Math.random() * otherIds.length)];
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
  const playersWithActions = state.players.filter((player) => {
    const role = state.initialDistribution[player.id];
    return ROLES[role].hasNightAction;
  });

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
function getNextPhase(currentPhase: GamePhase, state?: GameState): GamePhase | null {
  switch (currentPhase) {
    case "NIGHT":
      return "DAY";
    case "DAY":
      return "VOTING";
    case "VOTING":
      if (state) {
        const executedIds = calculateExecutedPlayers(state.votes, state.initialDistribution);
        const finalRoles = resolveFinalRoles(state.initialDistribution, state.actions);
        const hasExecutedHunter = executedIds.some((id) => finalRoles[id] === "HUNTER");
        if (hasExecutedHunter) {
          return "HUNTER_REVENGE";
        }
      }
      return "FINISHED";
    case "HUNTER_REVENGE":
      return "FINISHED";
    case "FINISHED":
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
  const validation = validateHunterRevenge(state, hunterId, targetId);
  if (!validation.valid) {
    throw new Error(validation.error.message);
  }

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

  if (haveAllExecutedHuntersChosen(newState, executedHunterIds)) {
    return advancePhase(newState);
  }

  return newState;
}

/**
 * ゲーム終了時のスタッツを計算
 */
export function calculateStats(
  state: GameState,
  prevPlayerStats: Record<PlayerId, PlayerStat>,
  prevRoomStats: RoomStats
): { playerStats: Record<PlayerId, PlayerStat>; roomStats: RoomStats } {
  const finalRoles = resolveFinalRoles(state.initialDistribution, state.actions);
  const result = calculateGameResult(
    state.votes,
    state.initialDistribution,
    finalRoles,
    state.players.map((p) => p.id),
    state.hunterRevengeTarget
  );

  const newPlayerStats = { ...prevPlayerStats };

  for (const player of state.players) {
    const prev = newPlayerStats[player.id] ?? {
      totalGames: 0,
      totalWins: 0,
      villageGames: 0,
      villageWins: 0,
      werewolfGames: 0,
      werewolfWins: 0,
      minorityGames: 0,
      minorityWins: 0,
    };

    const finalRole = finalRoles[player.id];
    const team = ROLES[finalRole].team;
    const isWinner = result.winners.includes(player.id);

    newPlayerStats[player.id] = {
      totalGames: prev.totalGames + 1,
      totalWins: prev.totalWins + (isWinner ? 1 : 0),
      villageGames: prev.villageGames + (team === "VILLAGE" ? 1 : 0),
      villageWins: prev.villageWins + (team === "VILLAGE" && isWinner ? 1 : 0),
      werewolfGames: prev.werewolfGames + (team === "WEREWOLF" ? 1 : 0),
      werewolfWins: prev.werewolfWins + (team === "WEREWOLF" && isWinner ? 1 : 0),
      minorityGames: prev.minorityGames + (team === "MINORITY" ? 1 : 0),
      minorityWins: prev.minorityWins + (team === "MINORITY" && isWinner ? 1 : 0),
    };
  }

  const newRoomStats: RoomStats = {
    gamesPlayed: prevRoomStats.gamesPlayed + 1,
    villageWins: prevRoomStats.villageWins + (result.winningTeam === "VILLAGE" ? 1 : 0),
    werewolfWins: prevRoomStats.werewolfWins + (result.winningTeam === "WEREWOLF" ? 1 : 0),
    minorityWins: prevRoomStats.minorityWins + (result.winningTeam === "MINORITY" ? 1 : 0),
    draws: prevRoomStats.draws + (result.winningTeam === null ? 1 : 0),
  };

  return { playerStats: newPlayerStats, roomStats: newRoomStats };
}

