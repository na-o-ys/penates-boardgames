import { getOrCreatePlayerId } from "./session";

/**
 * playerIdの認可を検証
 * - 本番: cookie.playerId === providedPlayerId を検証
 *   （cookieは署名付きなので改ざん不可）
 * - 開発: スキップ（test-room用）
 */
export async function authorizePlayer(providedPlayerId: string): Promise<void> {
  if (process.env.NODE_ENV === "development") {
    return; // 開発モードではスキップ
  }

  const cookiePlayerId = await getOrCreatePlayerId();
  if (cookiePlayerId !== providedPlayerId) {
    throw new Error("認可エラー: 不正なプレイヤーIDです");
  }
}
