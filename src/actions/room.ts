"use server";

import { v4 as uuidv4 } from "uuid";
import { createClient } from "@/lib/supabase/server";
import {
  createRoom as dbCreateRoom,
  getGameState,
  updateRoomWithRetry,
  RoomNotFoundError,
} from "@/lib/supabase/rooms";
import {
  createInitialGameState,
  addPlayer,
  removePlayer,
  type Player,
  type GameConfig,
} from "@/lib/game";
import { getOrCreatePlayerId, setPlayerName } from "@/lib/session";
import { authorizePlayer } from "@/lib/auth";

export interface ActionResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * 新規部屋を作成
 */
export async function createRoomAction(
  playerName: string
): Promise<ActionResult<{ roomId: string }>> {
  try {
    const supabase = await createClient();
    const playerId = await getOrCreatePlayerId();
    await setPlayerName(playerName);

    // 初期ゲーム状態を作成
    const initialState = createInitialGameState("");

    // ホストプレイヤーを追加
    const player: Player = {
      id: playerId,
      name: playerName,
      isHost: true,
      isConnected: true,
    };

    const stateWithPlayer = addPlayer(initialState, player);

    // DBに保存
    const roomId = await dbCreateRoom(supabase, {
      ...stateWithPlayer,
      roomId: "", // roomIdはDB側で生成される
    });

    // roomIdを更新
    await updateRoomWithRetry(supabase, roomId, (state) => ({
      ...state,
      roomId,
    }));

    return { success: true, data: { roomId } };
  } catch (error) {
    console.error("部屋の作成に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "部屋の作成に失敗しました",
    };
  }
}

/**
 * 部屋に参加
 */
export async function joinRoomAction(
  roomId: string,
  playerName: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();
    const playerId = await getOrCreatePlayerId();
    await setPlayerName(playerName);

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // 既に参加済みの場合は名前を更新
      const existingPlayer = state.players.find((p) => p.id === playerId);
      if (existingPlayer) {
        return {
          ...state,
          players: state.players.map((p) =>
            p.id === playerId ? { ...p, name: playerName, isConnected: true } : p
          ),
        };
      }

      // 新規参加
      const player: Player = {
        id: playerId,
        name: playerName,
        isHost: false,
        isConnected: true,
      };

      return addPlayer(state, player);
    });

    return { success: true };
  } catch (error) {
    console.error("部屋への参加に失敗:", error);
    if (error instanceof RoomNotFoundError) {
      return { success: false, error: "部屋が見つかりません" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "部屋への参加に失敗しました",
    };
  }
}

/**
 * 部屋から退出
 */
export async function leaveRoomAction(
  roomId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      return removePlayer(state, playerId);
    });

    return { success: true };
  } catch (error) {
    console.error("部屋からの退出に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "部屋からの退出に失敗しました",
    };
  }
}

/**
 * プレイヤーを退室させる（ホストのみ）
 */
export async function kickPlayerAction(
  roomId: string,
  playerId: string,
  targetPlayerId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // ホストチェック
      const player = state.players.find((p) => p.id === playerId);
      if (!player?.isHost) {
        throw new Error("ホストのみがプレイヤーを退室させられます");
      }

      // 自分自身は退室させられない
      if (targetPlayerId === playerId) {
        throw new Error("自分自身を退室させることはできません");
      }

      // 対象プレイヤーが存在するか確認
      const targetPlayer = state.players.find((p) => p.id === targetPlayerId);
      if (!targetPlayer) {
        throw new Error("対象プレイヤーが見つかりません");
      }

      return removePlayer(state, targetPlayerId);
    });

    return { success: true };
  } catch (error) {
    console.error("プレイヤーの退室に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "プレイヤーの退室に失敗しました",
    };
  }
}

/**
 * ゲーム設定を更新（ホストのみ）
 */
export async function updateGameConfigAction(
  roomId: string,
  playerId: string,
  config: GameConfig
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // ホストチェック
      const player = state.players.find((p) => p.id === playerId);
      if (!player?.isHost) {
        throw new Error("ホストのみがゲーム設定を変更できます");
      }

      return { ...state, config };
    });

    return { success: true };
  } catch (error) {
    console.error("ゲーム設定の更新に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ゲーム設定の更新に失敗しました",
    };
  }
}

/**
 * 部屋が存在するかチェック
 */
export async function checkRoomExistsAction(
  roomId: string
): Promise<ActionResult<{ exists: boolean }>> {
  try {
    const supabase = await createClient();
    const room = await getGameState(supabase, roomId);

    return { success: true, data: { exists: room !== null } };
  } catch (error) {
    console.error("部屋の確認に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "部屋の確認に失敗しました",
    };
  }
}

/**
 * テスト用ルームを作成（開発モードのみ）
 */
export async function createTestRoomAction(): Promise<
  ActionResult<{
    roomId: string;
    playerIds: string[];
    playerNames: string[];
  }>
> {
  if (process.env.NODE_ENV !== "development") {
    return { success: false, error: "本番環境では使用できません" };
  }

  try {
    const supabase = await createClient();

    // 4人のプレイヤーを生成
    const playerIds = [uuidv4(), uuidv4(), uuidv4(), uuidv4()];
    const playerNames = ["Player1", "Player2", "Player3", "Player4"];

    // 初期ゲーム状態を作成
    let state = createInitialGameState("");

    // 4人のプレイヤーを追加
    playerIds.forEach((id, index) => {
      const player: Player = {
        id,
        name: playerNames[index],
        isHost: index === 0,
        isConnected: true,
      };
      state = addPlayer(state, player);
    });

    // 4人用のデフォルト役職を設定（4人 + 中央2枚 = 6役職）
    state = {
      ...state,
      config: {
        ...state.config,
        roles: ["WEREWOLF", "SEER", "ROBBER", "HUNTER", "VILLAGER", "VILLAGER"],
      },
    };

    // DBに保存
    const roomId = await dbCreateRoom(supabase, {
      ...state,
      roomId: "",
    });

    // roomIdを更新
    await updateRoomWithRetry(supabase, roomId, (s) => ({
      ...s,
      roomId,
    }));

    return {
      success: true,
      data: { roomId, playerIds, playerNames },
    };
  } catch (error) {
    console.error("テストルームの作成に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "テストルームの作成に失敗しました",
    };
  }
}
