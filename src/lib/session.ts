import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";
import { createHmac } from "crypto";

const PLAYER_ID_COOKIE = "player_id";
const PLAYER_NAME_COOKIE = "player_name";

const SESSION_SECRET = process.env.SESSION_SECRET || "dev-secret-key";

/**
 * playerIdにHMAC署名を付与
 */
function signPlayerId(playerId: string): string {
  const signature = createHmac("sha256", SESSION_SECRET)
    .update(playerId)
    .digest("hex")
    .slice(0, 16);
  return `${playerId}:${signature}`;
}

/**
 * 署名を検証してplayerIdを抽出
 * 検証失敗時はnullを返す
 */
function verifyAndExtractPlayerId(signedValue: string): string | null {
  const [playerId, signature] = signedValue.split(":");
  if (!playerId || !signature) return null;

  const expectedSig = createHmac("sha256", SESSION_SECRET)
    .update(playerId)
    .digest("hex")
    .slice(0, 16);

  if (signature !== expectedSig) return null;

  return playerId;
}

/**
 * プレイヤーIDを取得（なければ生成）
 * Cookie改ざん時は新規生成
 */
export async function getOrCreatePlayerId(): Promise<string> {
  const cookieStore = await cookies();
  const signedValue = cookieStore.get(PLAYER_ID_COOKIE)?.value;

  if (signedValue) {
    const playerId = verifyAndExtractPlayerId(signedValue);
    if (playerId) return playerId;
    // 署名検証失敗 = 改ざん → 新規生成
  }

  const newId = uuidv4();
  cookieStore.set(PLAYER_ID_COOKIE, signPlayerId(newId), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });

  return newId;
}

/**
 * プレイヤー名を取得
 */
export async function getPlayerName(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(PLAYER_NAME_COOKIE)?.value ?? null;
}

/**
 * プレイヤー名を設定
 */
export async function setPlayerName(name: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(PLAYER_NAME_COOKIE, name, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}
