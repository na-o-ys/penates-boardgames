import type { PlayerId, Role, WinResult } from "./types";
import { ROLES } from "./types";
import { SKIP_VOTE } from "./validator";

export interface VoteCount {
  readonly count: number;
  readonly voterIds: readonly PlayerId[];
}

/**
 * 投票結果から各プレイヤーの得票数と投票者を集計
 *
 * @param votes - 投票結果 (voterId -> targetId)
 * @param initialDistribution - 初期役職配置（重み付き投票用）
 * @returns 各プレイヤーの得票情報 (targetId -> { count, voterIds })
 */
export function countVotes(
  votes: Record<PlayerId, PlayerId>,
  initialDistribution: Record<string, Role>
): Record<PlayerId, VoteCount> {
  const result: Record<PlayerId, { count: number; voterIds: PlayerId[] }> = {};

  for (const [voterId, targetId] of Object.entries(votes)) {
    if (targetId === SKIP_VOTE) continue;
    if (!result[targetId]) result[targetId] = { count: 0, voterIds: [] };
    const voterRole = initialDistribution[voterId];
    const weight = ROLES[voterRole].voteWeight;
    result[targetId].count += weight;
    result[targetId].voterIds.push(voterId);
  }

  return result;
}

/**
 * 投票結果から処刑されるプレイヤーを計算
 *
 * @param votes - 投票結果 (voterId -> targetId)
 * @param initialDistribution - 初期役職配置（重み付き投票用）
 * @returns 最多得票者のID配列（同票の場合は複数）
 */
export function calculateExecutedPlayers(
  votes: Record<PlayerId, PlayerId>,
  initialDistribution: Record<string, Role>
): readonly PlayerId[] {
  const voteResult = countVotes(votes, initialDistribution);

  // 最多得票数を取得
  const maxVotes = Math.max(...Object.values(voteResult).map((v) => v.count), 0);

  if (maxVotes === 0) {
    return [];
  }

  // 最多得票者を取得（同票は全員処刑）
  const executedPlayers = Object.entries(voteResult)
    .filter(([, v]) => v.count === maxVotes)
    .map(([playerId]) => playerId);

  // 全員がバラバラに投票した場合（全員1票ずつ）は処刑なし
  const totalVoters = Object.keys(votes).length;
  if (maxVotes === 1 && executedPlayers.length === totalVoters) {
    return [];
  }

  return executedPlayers;
}

/**
 * 勝敗を判定する
 *
 * @param executedPlayerIds - 処刑されたプレイヤーのID
 * @param finalRoles - 最終的な役職配置
 * @param allPlayerIds - 全プレイヤーのID
 * @returns 勝敗結果
 */
export function determineWinner(
  executedPlayerIds: readonly PlayerId[],
  finalRoles: Record<string, Role>,
  allPlayerIds: readonly PlayerId[]
): WinResult {
  // プレイヤーの最終役職を取得
  const playerRoles = allPlayerIds.map((id) => ({
    id,
    role: finalRoles[id],
    team: ROLES[finalRoles[id]].team,
  }));

  // 人狼プレイヤーを取得
  const werewolfPlayers = playerRoles.filter((p) => ROLES[p.role].isWerewolfExecution);
  const hasWerewolf = werewolfPlayers.length > 0;

  // 吊人が処刑されたかチェック
  const executedTanners = executedPlayerIds.filter(
    (id) => finalRoles[id] === "TANNER"
  );
  const tannerExecuted = executedTanners.length > 0;

  // 人狼が処刑されたかチェック
  const executedWerewolves = executedPlayerIds.filter(
    (id) => ROLES[finalRoles[id]].isWerewolfExecution
  );
  const werewolfExecuted = executedWerewolves.length > 0;

  // --- 勝敗判定 ---

  // 1. 吊人が処刑された場合：吊人の単独勝利
  if (tannerExecuted) {
    const tannerWinners = executedTanners;
    return {
      winningTeam: "MINORITY",
      winners: tannerWinners,
      executedPlayerIds,
    };
  }

  // 2. 平和村（人狼なし）の場合
  if (!hasWerewolf) {
    // 誰も処刑されなかった場合：村人陣営の勝利
    if (executedPlayerIds.length === 0) {
      const winners = playerRoles
        .filter((p) => p.team !== "MINORITY")
        .map((p) => p.id);
      return {
        winningTeam: "VILLAGE",
        winners,
        executedPlayerIds,
      };
    }
    // 誰かが処刑された場合：人狼陣営の勝利（人狼がいないが村人が失敗）
    // 注: この場合は人狼がいないので勝者なし（村人の負け）
    return {
      winningTeam: null,
      winners: [],
      executedPlayerIds,
    };
  }

  // 3. 人狼がいる場合
  if (werewolfExecuted) {
    // 人狼が処刑された：村人陣営の勝利
    const villageWinners = playerRoles
      .filter((p) => p.team === "VILLAGE")
      .map((p) => p.id);
    return {
      winningTeam: "VILLAGE",
      winners: villageWinners,
      executedPlayerIds,
    };
  } else {
    // 人狼が処刑されなかった：人狼陣営の勝利
    const werewolfWinners = playerRoles
      .filter((p) => p.team === "WEREWOLF")
      .map((p) => p.id);
    return {
      winningTeam: "WEREWOLF",
      winners: werewolfWinners,
      executedPlayerIds,
    };
  }
}

/**
 * ゲーム終了時の完全な結果を計算
 *
 * @param votes - 投票結果
 * @param initialDistribution - 初期役職配置（重み付き投票用）
 * @param finalRoles - 最終的な役職配置
 * @param allPlayerIds - 全プレイヤーのID
 * @param hunterRevengeTarget - 狩人の道連れ対象（狩人ID → 対象ID）
 */
export function calculateGameResult(
  votes: Record<PlayerId, PlayerId>,
  initialDistribution: Record<string, Role>,
  finalRoles: Record<string, Role>,
  allPlayerIds: readonly PlayerId[],
  hunterRevengeTarget?: Record<PlayerId, PlayerId>
): WinResult {
  // 投票による処刑者
  const votedExecutedIds = calculateExecutedPlayers(votes, initialDistribution);
  const executedPlayerIds: PlayerId[] = [...votedExecutedIds];

  // 狩人の道連れを追加
  if (hunterRevengeTarget) {
    for (const [hunterId, targetId] of Object.entries(hunterRevengeTarget)) {
      // 狩人が処刑された場合のみ道連れ有効
      if (
        executedPlayerIds.includes(hunterId) &&
        !executedPlayerIds.includes(targetId)
      ) {
        executedPlayerIds.push(targetId);
      }
    }
  }

  return determineWinner(executedPlayerIds, finalRoles, allPlayerIds);
}
