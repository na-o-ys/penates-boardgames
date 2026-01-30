import type { SupabaseClient } from "@supabase/supabase-js";
import type { RoomState } from "@/lib/room/types";
import { calculateStats, type GameState } from "@/lib/game";
import type { Database, RoomRow } from "./database.types";

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

/**
 * 新規部屋を作成
 */
export async function createRoom(
  supabase: TypedSupabaseClient,
  roomState: RoomState
): Promise<string> {
  const { data, error } = await supabase
    .from("rooms")
    .insert({
      game_state: roomState,
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
  supabase: TypedSupabaseClient,
  roomId: string
): Promise<RoomRow | null> {
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
    // 無効なUUID形式の場合も部屋が見つからないとして扱う
    if (error.message.includes("invalid input syntax for type uuid")) {
      return null;
    }
    throw new Error(`部屋の取得に失敗しました: ${error.message}`);
  }

  return data as RoomRow;
}

/**
 * 部屋のゲーム状態を取得
 */
export async function getRoomState(
  supabase: TypedSupabaseClient,
  roomId: string
): Promise<{ roomState: RoomState; version: number } | null> {
  const room = await getRoom(supabase, roomId);
  if (!room) {
    return null;
  }
  return {
    roomState: room.game_state,
    version: room.version,
  };
}

/**
 * 部屋を楽観的ロック付きで更新
 *
 * @param supabase - Supabaseクライアント
 * @param roomId - 部屋ID
 * @param currentVersion - 現在のバージョン（楽観的ロック用）
 * @param newRoomState - 新しいゲーム状態
 * @returns 成功した場合は新しいバージョン番号
 * @throws OptimisticLockError - バージョンが一致しない場合
 */
export async function updateRoom(
  supabase: TypedSupabaseClient,
  roomId: string,
  currentVersion: number,
  newRoomState: RoomState
): Promise<number> {
  const { data, error } = await supabase
    .from("rooms")
    .update({
      game_state: newRoomState,
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
  supabase: TypedSupabaseClient,
  roomId: string,
  updateFn: (currentState: RoomState) => RoomState,
  maxRetries: number = 3
): Promise<{ roomState: RoomState; version: number }> {
  let retries = 0;

  while (retries < maxRetries) {
    const current = await getRoomState(supabase, roomId);
    if (!current) {
      throw new RoomNotFoundError(roomId);
    }

    const newState = updateFn(current.roomState);

    try {
      const newVersion = await updateRoom(
        supabase,
        roomId,
        current.version,
        newState
      );
      return { roomState: newState, version: newVersion };
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
 * リトライ付きでゲーム状態を更新
 *
 * @param supabase - Supabaseクライアント
 * @param roomId - 部屋ID
 * @param transform - ゲーム状態を変換する純粋関数
 * @param maxRetries - 最大リトライ回数
 */
export async function updateGame(
  supabase: TypedSupabaseClient,
  roomId: string,
  transform: (game: GameState) => GameState,
  maxRetries: number = 3
): Promise<{ roomState: RoomState; version: number }> {
  return updateRoomWithRetry(
    supabase,
    roomId,
    (roomState) => {
      if (!roomState.game) {
        throw new Error("ゲームが開始されていません");
      }
      const newGame = transform(roomState.game);
      if (newGame.phase === "FINISHED" && roomState.game.phase !== "FINISHED") {
        const stats = calculateStats(newGame, roomState.playerStats, roomState.roomStats);
        return { ...roomState, game: newGame, playerStats: stats.playerStats, roomStats: stats.roomStats };
      }
      return { ...roomState, game: newGame };
    },
    maxRetries
  );
}

/**
 * 部屋を削除
 */
export async function deleteRoom(
  supabase: TypedSupabaseClient,
  roomId: string
): Promise<void> {
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
  supabase: TypedSupabaseClient,
  roomId: string
): Promise<boolean> {
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
