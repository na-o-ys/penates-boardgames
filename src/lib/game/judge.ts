import type { PlayerId, Role, WinResult } from "./types";
import { ROLE_TEAM } from "./types";
import { SKIP_VOTE } from "./validator";

/**
 * 投票結果から処刑されるプレイヤーを計算
 *
 * @param votes - 投票結果 (voterId -> targetId)
 * @returns 最多得票者のID配列（同票の場合は複数）
 */
export function calculateExecutedPlayers(
  votes: Record<PlayerId, PlayerId>
): readonly PlayerId[] {
  // 得票数をカウント（SKIP_VOTEは無視）
  const voteCount: Record<PlayerId, number> = {};

  for (const targetId of Object.values(votes)) {
    if (targetId === SKIP_VOTE) continue; // スキップ投票は無視
    voteCount[targetId] = (voteCount[targetId] || 0) + 1;
  }

  // 最多得票数を取得
  const maxVotes = Math.max(...Object.values(voteCount), 0);

  if (maxVotes === 0) {
    return [];
  }

  // 最多得票者を取得（同票は全員処刑）
  const executedPlayers = Object.entries(voteCount)
    .filter(([, count]) => count === maxVotes)
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
    team: ROLE_TEAM[finalRoles[id]],
  }));

  // 人狼プレイヤーを取得
  const werewolfPlayers = playerRoles.filter((p) => p.role === "WEREWOLF");
  const hasWerewolf = werewolfPlayers.length > 0;

  // 吊人が処刑されたかチェック
  const executedTanners = executedPlayerIds.filter(
    (id) => finalRoles[id] === "TANNER"
  );
  const tannerExecuted = executedTanners.length > 0;

  // 人狼が処刑されたかチェック
  const executedWerewolves = executedPlayerIds.filter(
    (id) => finalRoles[id] === "WEREWOLF"
  );
  const werewolfExecuted = executedWerewolves.length > 0;

  // --- 勝敗判定 ---

  // 1. 吊人が処刑された場合：吊人の単独勝利
  if (tannerExecuted) {
    const tannerWinners = executedTanners;
    return {
      winningTeam: "TANNER",
      winners: tannerWinners,
      executedPlayerIds,
    };
  }

  // 2. 平和村（人狼なし）の場合
  if (!hasWerewolf) {
    // 誰も処刑されなかった場合：村人陣営の勝利
    if (executedPlayerIds.length === 0) {
      const villageWinners = playerRoles
        .filter((p) => p.team === "VILLAGE")
        .map((p) => p.id);
      return {
        winningTeam: "VILLAGE",
        winners: villageWinners,
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
 */
export function calculateGameResult(
  votes: Record<PlayerId, PlayerId>,
  finalRoles: Record<string, Role>,
  allPlayerIds: readonly PlayerId[]
): WinResult {
  const executedPlayerIds = calculateExecutedPlayers(votes);
  return determineWinner(executedPlayerIds, finalRoles, allPlayerIds);
}
