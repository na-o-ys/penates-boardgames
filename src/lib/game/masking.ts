import type {
  ActionResult,
  ClientGameState,
  GameState,
  PlayerId,
} from "./types";
import { resolveFinalRoles } from "./resolver";
import { calculateGameResult } from "./judge";

/**
 * サーバー側のGameStateをクライアント用にマスキングする
 *
 * @param state - サーバー側の完全なGameState
 * @param playerId - クライアントのプレイヤーID
 * @returns マスキングされたClientGameState
 */
export function maskGameState(
  state: GameState,
  playerId: PlayerId
): ClientGameState {
  const myRole =
    state.phase === "LOBBY" ? null : state.initialDistribution[playerId] ?? null;

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
    return role && ["WEREWOLF", "SEER", "ROBBER", "TROUBLEMAKER"].includes(role);
  });
  const allActed = playersWithActions.every((player) =>
    state.actions.some((action) => action.actorId === player.id)
  );

  // 投票済みプレイヤー一覧
  const votedPlayers = Object.keys(state.votes);

  // 自分の投票先
  const myVote = state.votes[playerId] ?? null;

  // 基本のマスク済み状態
  const baseClientState: ClientGameState = {
    roomId: state.roomId,
    phase: state.phase,
    players: state.players,
    config: state.config,
    myRole,
    myActions,
    actionResults,
    hasActed,
    allActed,
    votedPlayers,
    myVote,
    phaseStartedAt: state.phaseStartedAt,
  };

  // RESULTフェーズの場合は全情報を開示
  if (state.phase === "RESULT") {
    const playerIds = state.players.map((p) => p.id);
    const finalRoles = resolveFinalRoles(state.initialDistribution, state.actions);
    const gameResult = calculateGameResult(state.votes, finalRoles, playerIds);

    return {
      ...baseClientState,
      finalRoles,
      allActions: state.actions,
      allVotes: state.votes,
      executedPlayerIds: gameResult.executedPlayerIds,
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
): ClientGameState & { fellowWerewolves?: readonly PlayerId[] } {
  const baseState = maskGameState(state, playerId);

  // 自分が人狼でない場合は通常のマスキング
  if (baseState.myRole !== "WEREWOLF") {
    return baseState;
  }

  // 夜フェーズ以降で人狼の場合、仲間の人狼を教える
  if (state.phase !== "LOBBY") {
    const playerIds = state.players.map((p) => p.id);
    const fellowWerewolves = playerIds.filter(
      (id) => id !== playerId && state.initialDistribution[id] === "WEREWOLF"
    );

    return {
      ...baseState,
      fellowWerewolves,
    };
  }

  return baseState;
}
