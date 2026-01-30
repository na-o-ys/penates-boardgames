import type {
  ActionResult,
  ClientGameState,
  GameState,
  PlayerId,
} from "./types";
import { ROLES } from "./types";
import { resolveFinalRoles } from "./resolver";
import { calculateExecutedPlayers, calculateGameResult } from "./judge";

/**
 * サーバー側の GameState をクライアント用にマスキングする
 */
export function maskGameState(
  state: GameState,
  playerId: PlayerId
): ClientGameState {
  const myRole = state.initialDistribution[playerId] ?? null;

  // 自分のアクションのみ取得
  const myActions = state.actions.filter(
    (action) => action.actorId === playerId
  );

  // アクション結果を整形
  const actionResults: ActionResult[] = myActions.map((action) => ({
    type: action.type,
    targetIds: action.targetIds,
    revealedRoles: action.result,
  }));

  // 自分がアクション済みかチェック
  const hasActed = myActions.length > 0;

  // 全員がアクション済みかチェック（アクション持ち役職のみ）
  const playersWithActions = state.players.filter((player) => {
    const role = state.initialDistribution[player.id];
    return role && ROLES[role].hasNightAction;
  });
  const allActed = playersWithActions.every((player) =>
    state.actions.some((action) => action.actorId === player.id)
  );

  // 投票済みプレイヤー一覧
  const votedPlayers = Object.keys(state.votes);

  // 自分の投票先
  const myVote = state.votes[playerId] ?? null;

  // パンを受け取ったか
  const receivedBread = state.breadRecipientId === playerId;

  // 予告状を受け取ったか
  const receivedNotice = state.noticeRecipientId === playerId;

  // 基本のマスク済み状態
  const baseClientState: ClientGameState = {
    phase: state.phase,
    players: state.players,
    myRole,
    myActions,
    actionResults,
    hasActed,
    allActed,
    votedPlayers,
    myVote,
    receivedBread,
    receivedNotice,
    phaseStartedAt: state.phaseStartedAt,
  };

  // HUNTER_REVENGEフェーズの場合
  if (state.phase === "HUNTER_REVENGE") {
    const executedIds = calculateExecutedPlayers(state.votes, state.initialDistribution);
    const finalRoles = resolveFinalRoles(state.initialDistribution, state.actions);
    const executedHunterIds = executedIds.filter(
      (id) => finalRoles[id] === "HUNTER"
    );

    const hunterRevengeChosen: Record<PlayerId, boolean> = {};
    for (const hunterId of executedHunterIds) {
      hunterRevengeChosen[hunterId] =
        state.hunterRevengeTarget[hunterId] !== undefined;
    }

    return {
      ...baseClientState,
      executedHunterIds,
      isExecutedHunter: executedHunterIds.includes(playerId),
      hunterRevengeChosen,
      allVotes: state.votes,
    };
  }

  // FINISHEDフェーズの場合は全情報を開示
  if (state.phase === "FINISHED") {
    const playerIds = state.players.map((p) => p.id);
    const finalRoles = resolveFinalRoles(state.initialDistribution, state.actions);
    const gameResult = calculateGameResult(
      state.votes,
      state.initialDistribution,
      finalRoles,
      playerIds,
      state.hunterRevengeTarget
    );

    return {
      ...baseClientState,
      initialRoles: state.initialDistribution,
      finalRoles,
      allActions: state.actions,
      allVotes: state.votes,
      executedPlayerIds: gameResult.executedPlayerIds,
      hunterRevengeTargets: state.hunterRevengeTarget,
      winners: gameResult.winners,
      winningTeam: gameResult.winningTeam,
    };
  }

  return baseClientState;
}

/**
 * 人狼プレイヤー向けに仲間の人狼情報を追加したマスキング
 */
export function maskGameStateForWerewolf(
  state: GameState,
  playerId: PlayerId
): ClientGameState {
  const baseState = maskGameState(state, playerId);

  if (!baseState.myRole || !ROLES[baseState.myRole].isWerewolfNightAlly) {
    return baseState;
  }

  const playerIds = state.players.map((p) => p.id);
  const fellowWerewolves = playerIds.filter(
    (id) => id !== playerId && ROLES[state.initialDistribution[id]].isWerewolfNightAlly
  );

  const result: ClientGameState = { ...baseState, fellowWerewolves };

  if (ROLES[baseState.myRole].revealsCenter) {
    return {
      ...result,
      revealedCenterRoles: {
        CENTER_0: state.initialDistribution["CENTER_0"],
        CENTER_1: state.initialDistribution["CENTER_1"],
      },
    };
  }

  return result;
}
