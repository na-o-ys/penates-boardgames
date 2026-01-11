import { cookies } from "next/headers";
import { v4 as uuidv4 } from "uuid";

const PLAYER_ID_COOKIE = "player_id";
const PLAYER_NAME_COOKIE = "player_name";

/**
 * プレイヤーIDを取得（なければ生成）
 */
export async function getOrCreatePlayerId(): Promise<string> {
  const cookieStore = await cookies();
  const existingId = cookieStore.get(PLAYER_ID_COOKIE)?.value;

  if (existingId) {
    return existingId;
  }

  const newId = uuidv4();
  cookieStore.set(PLAYER_ID_COOKIE, newId, {
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
