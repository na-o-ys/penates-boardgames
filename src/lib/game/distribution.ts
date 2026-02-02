import type { Player, Role } from "./types";
import { ROLES } from "./types";

/**
 * Fisher-Yatesシャッフルで配列をランダムに並び替える
 */
function shuffle<T>(array: readonly T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * 役職をプレイヤーと中央カードに配布する
 *
 * @param players - プレイヤー一覧
 * @param roles - 使用する役職リスト（プレイヤー数 + 2枚必要）
 * @returns 配布結果 (Key: PlayerId | 'CENTER_0' | 'CENTER_1')
 * @throws 役職数が不足している場合
 */
export function distributeRoles(
  players: readonly Player[],
  roles: readonly Role[],
  options?: { noPeaceVillage?: boolean }
): Record<string, Role> {
  const requiredCount = players.length + 2; // プレイヤー数 + 中央2枚

  if (roles.length !== requiredCount) {
    throw new Error(
      `役職数が不正です。必要: ${requiredCount}, 実際: ${roles.length}`
    );
  }

  const maxAttempts = options?.noPeaceVillage ? 100 : 1;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const shuffledRoles = shuffle(roles);

    if (options?.noPeaceVillage && attempt < maxAttempts - 1) {
      const playerRoles = shuffledRoles.slice(0, players.length);
      const hasWerewolf = playerRoles.some((r) => ROLES[r].team === "WEREWOLF" && ROLES[r].isWerewolfExecution);
      const hasVillage = playerRoles.some((r) => ROLES[r].team === "VILLAGE");
      if (!hasWerewolf || !hasVillage) continue;
    }

    const distribution: Record<string, Role> = {};
    players.forEach((player, index) => {
      distribution[player.id] = shuffledRoles[index];
    });
    distribution["CENTER_0"] = shuffledRoles[players.length];
    distribution["CENTER_1"] = shuffledRoles[players.length + 1];
    return distribution;
  }

  // unreachable but TypeScript needs it
  throw new Error("配布に失敗しました");
}

/**
 * テスト用: シード付きシャッフルで役職を配布する
 *
 * @param players - プレイヤー一覧
 * @param roles - 使用する役職リスト
 * @param seed - 乱数シード（同じシードで同じ結果を保証）
 */
export function distributeRolesWithSeed(
  players: readonly Player[],
  roles: readonly Role[],
  seed: number
): Record<string, Role> {
  const requiredCount = players.length + 2;

  if (roles.length !== requiredCount) {
    throw new Error(
      `役職数が不正です。必要: ${requiredCount}, 実際: ${roles.length}`
    );
  }

  // シード付き疑似乱数生成器 (Mulberry32)
  const mulberry32 = (a: number) => {
    return () => {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  const random = mulberry32(seed);
  const result = [...roles];

  // Fisher-Yates with seeded random
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  const distribution: Record<string, Role> = {};

  players.forEach((player, index) => {
    distribution[player.id] = result[index];
  });

  distribution["CENTER_0"] = result[players.length];
  distribution["CENTER_1"] = result[players.length + 1];

  return distribution;
}

/**
 * 固定配置で役職を配布する（テスト用）
 *
 * @param players - プレイヤー一覧
 * @param roles - 使用する役職リスト（順番通りに配布される）
 */
export function distributeRolesFixed(
  players: readonly Player[],
  roles: readonly Role[]
): Record<string, Role> {
  const requiredCount = players.length + 2;

  if (roles.length !== requiredCount) {
    throw new Error(
      `役職数が不正です。必要: ${requiredCount}, 実際: ${roles.length}`
    );
  }

  const distribution: Record<string, Role> = {};

  players.forEach((player, index) => {
    distribution[player.id] = roles[index];
  });

  distribution["CENTER_0"] = roles[players.length];
  distribution["CENTER_1"] = roles[players.length + 1];

  return distribution;
}
