import type { SupabaseClient } from "@supabase/supabase-js";
import type { GameState } from "@/lib/game/types";
import type { Database, RoomRow } from "./database.types";
import { mockRooms } from "./mock-store";

export type TypedSupabaseClient = SupabaseClient<Database>;

/** 楽観的ロック失敗時のエラー */
export class OptimisticLockError extends Error {
  constructor(message: string = "楽観的ロックに失敗しました。データが更新されています。") {
    super(message);
    this.name = "OptimisticLockError";
  }
}

/** 部屋が見つからない時のエラー */
export class RoomNotFoundError extends Error {
  constructor(roomId: string) {
    super(`部屋が見つかりません: ${roomId}`);
    this.name = "RoomNotFoundError";
  }
}

/** モックモードかどうかをチェック */
function isMockMode(): boolean {
  return !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

/**
 * 新規部屋を作成
 */
export async function createRoom(
  supabase: TypedSupabaseClient | null,
  gameState: GameState
): Promise<string> {
  if (isMockMode() || !supabase) {
    return mockRooms.create(gameState);
  }

  const { data, error } = await supabase
    .from("rooms")
    .insert({
      game_state: gameState,
      version: 1,
    })
    .select("id")
    .single();

  if (error) {
    throw new Error(`部屋の作成に失敗しました: ${error.message}`);
  }

  return data.id;
}

/**
 * 部屋を取得
 */
export async function getRoom(
  supabase: TypedSupabaseClient | null,
  roomId: string
): Promise<RoomRow | null> {
  if (isMockMode() || !supabase) {
    const room = mockRooms.get(roomId);
    if (!room) return null;
    return room as RoomRow;
  }

  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows returned
      return null;
    }
    throw new Error(`部屋の取得に失敗しました: ${error.message}`);
  }

  return data as RoomRow;
}

/**
 * 部屋のゲーム状態を取得
 */
export async function getGameState(
  supabase: TypedSupabaseClient | null,
  roomId: string
): Promise<{ gameState: GameState; version: number } | null> {
  const room = await getRoom(supabase, roomId);
  if (!room) {
    return null;
  }
  return {
    gameState: room.game_state,
    version: room.version,
  };
}

/**
 * 部屋を楽観的ロック付きで更新
 *
 * @param supabase - Supabaseクライアント
 * @param roomId - 部屋ID
 * @param currentVersion - 現在のバージョン（楽観的ロック用）
 * @param newGameState - 新しいゲーム状態
 * @returns 成功した場合は新しいバージョン番号
 * @throws OptimisticLockError - バージョンが一致しない場合
 */
export async function updateRoom(
  supabase: TypedSupabaseClient | null,
  roomId: string,
  currentVersion: number,
  newGameState: GameState
): Promise<number> {
  if (isMockMode() || !supabase) {
    const newVersion = mockRooms.update(roomId, currentVersion, newGameState);
    if (newVersion === null) {
      throw new OptimisticLockError();
    }
    return newVersion;
  }

  const { data, error } = await supabase
    .from("rooms")
    .update({
      game_state: newGameState,
      version: currentVersion + 1,
    })
    .eq("id", roomId)
    .eq("version", currentVersion)
    .select("version")
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      // No rows updated - version mismatch (optimistic lock failure)
      throw new OptimisticLockError();
    }
    throw new Error(`部屋の更新に失敗しました: ${error.message}`);
  }

  return data.version;
}

/**
 * リトライ付きで部屋を更新
 *
 * @param supabase - Supabaseクライアント
 * @param roomId - 部屋ID
 * @param updateFn - 現在の状態を受け取り、新しい状態を返す関数
 * @param maxRetries - 最大リトライ回数
 */
export async function updateRoomWithRetry(
  supabase: TypedSupabaseClient | null,
  roomId: string,
  updateFn: (currentState: GameState) => GameState,
  maxRetries: number = 3
): Promise<{ gameState: GameState; version: number }> {
  let retries = 0;

  while (retries < maxRetries) {
    const current = await getGameState(supabase, roomId);
    if (!current) {
      throw new RoomNotFoundError(roomId);
    }

    const newState = updateFn(current.gameState);

    try {
      const newVersion = await updateRoom(
        supabase,
        roomId,
        current.version,
        newState
      );
      return { gameState: newState, version: newVersion };
    } catch (e) {
      if (e instanceof OptimisticLockError) {
        retries++;
        if (retries >= maxRetries) {
          throw e;
        }
        // 少し待ってからリトライ
        await new Promise((resolve) => setTimeout(resolve, 100 * retries));
      } else {
        throw e;
      }
    }
  }

  throw new OptimisticLockError();
}

/**
 * 部屋を削除
 */
export async function deleteRoom(
  supabase: TypedSupabaseClient | null,
  roomId: string
): Promise<void> {
  if (isMockMode() || !supabase) {
    mockRooms.delete(roomId);
    return;
  }

  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", roomId);

  if (error) {
    throw new Error(`部屋の削除に失敗しました: ${error.message}`);
  }
}

/**
 * 部屋が存在するかチェック
 */
export async function roomExists(
  supabase: TypedSupabaseClient | null,
  roomId: string
): Promise<boolean> {
  if (isMockMode() || !supabase) {
    return mockRooms.exists(roomId);
  }

  const { data, error } = await supabase
    .from("rooms")
    .select("id")
    .eq("id", roomId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return false;
    }
    throw new Error(`部屋の確認に失敗しました: ${error.message}`);
  }

  return !!data;
}
