"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getGameState,
  updateRoomWithRetry,
  RoomNotFoundError,
} from "@/lib/supabase/rooms";
import {
  startGame,
  executeNightAction,
  executeVote,
  executeHunterRevenge,
  advancePhase,
  markReadyForNextGame,
  resetGame,
  maskGameState,
  maskGameStateForWerewolf,
  ROLES,
  SKIP_VOTE,
  type GameAction,
  type ActionType,
  type ClientGameState,
} from "@/lib/game";
import { getOrCreatePlayerId } from "@/lib/session";
import { authorizePlayer } from "@/lib/auth";
import type { ActionResult } from "./room";

/**
 * ゲームを開始（ホストのみ）
 */
export async function startGameAction(
  roomId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // ホストチェック
      const player = state.players.find((p) => p.id === playerId);
      if (!player?.isHost) {
        throw new Error("ホストのみがゲームを開始できます");
      }

      return startGame(state);
    });

    return { success: true };
  } catch (error) {
    console.error("ゲーム開始に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ゲーム開始に失敗しました",
    };
  }
}

/**
 * 夜アクションを実行
 */
export async function submitNightActionAction(
  roomId: string,
  playerId: string,
  actionType: ActionType,
  targetIds: string[]
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      const action: GameAction = {
        actorId: playerId,
        type: actionType,
        targetIds,
        timestamp: Date.now(),
      };

      return executeNightAction(state, action);
    });

    return { success: true };
  } catch (error) {
    console.error("夜アクション実行に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "夜アクション実行に失敗しました",
    };
  }
}

/**
 * 夜フェーズのタイマー終了時に自動スキップを実行
 */
export async function autoSkipNightActionAction(
  roomId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // 夜フェーズ以外では何もしない
      if (state.phase !== "NIGHT") {
        return state;
      }

      // 既にアクション済みなら何もしない
      if (state.actions.some((action) => action.actorId === playerId)) {
        return state;
      }

      const action: GameAction = {
        actorId: playerId,
        type: "SKIP",
        targetIds: [],
        timestamp: Date.now(),
      };

      return executeNightAction(state, action);
    });

    return { success: true };
  } catch (error) {
    console.error("自動スキップに失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "自動スキップに失敗しました",
    };
  }
}

/**
 * 投票を実行
 */
export async function submitVoteAction(
  roomId: string,
  playerId: string,
  targetId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      return executeVote(state, playerId, targetId);
    });

    return { success: true };
  } catch (error) {
    console.error("投票に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "投票に失敗しました",
    };
  }
}

/**
 * 投票フェーズのタイマー終了時に自動スキップ投票を実行
 */
export async function autoVoteAction(
  roomId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // 投票フェーズ以外では何もしない
      if (state.phase !== "VOTING") {
        return state;
      }

      // 既に投票済みなら何もしない
      if (state.votes[playerId]) {
        return state;
      }

      // タイムアウト時はスキップ投票
      return executeVote(state, playerId, SKIP_VOTE);
    });

    return { success: true };
  } catch (error) {
    console.error("自動投票に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "自動投票に失敗しました",
    };
  }
}

/**
 * 狩人の道連れアクションを実行
 */
export async function submitHunterRevengeAction(
  roomId: string,
  playerId: string,
  targetId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      return executeHunterRevenge(state, playerId, targetId);
    });

    return { success: true };
  } catch (error) {
    console.error("狩人道連れに失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "道連れ選択に失敗しました",
    };
  }
}

/**
 * 狩人の自動道連れ（タイマー終了時）
 */
export async function autoHunterRevengeAction(
  roomId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // HUNTER_REVENGEフェーズ以外では何もしない
      if (state.phase !== "HUNTER_REVENGE") {
        return state;
      }

      // 既に選択済みなら何もしない
      if (state.hunterRevengeTarget[playerId]) {
        return state;
      }

      // 自分以外のプレイヤーからランダムに1人選択
      const otherPlayers = state.players.filter((p) => p.id !== playerId);
      const randomIndex = Math.floor(Math.random() * otherPlayers.length);
      const targetId = otherPlayers[randomIndex].id;

      return executeHunterRevenge(state, playerId, targetId);
    });

    return { success: true };
  } catch (error) {
    console.error("自動道連れに失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "自動道連れに失敗しました",
    };
  }
}

/**
 * フェーズを進行（タイマー終了時など）
 */
export async function advancePhaseAction(
  roomId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // DAYフェーズ以外では何もしない（複数プレイヤーからの同時呼び出し対策）
      if (state.phase !== "DAY") {
        return state;
      }
      return advancePhase(state);
    });

    return { success: true };
  } catch (error) {
    console.error("フェーズ進行に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "フェーズ進行に失敗しました",
    };
  }
}

/**
 * ゲームをリセット（結果画面から再戦）
 */
export async function resetGameAction(
  roomId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // ホストチェック
      const player = state.players.find((p) => p.id === playerId);
      if (!player?.isHost) {
        throw new Error("ホストのみがゲームをリセットできます");
      }

      return resetGame(state);
    });

    return { success: true };
  } catch (error) {
    console.error("ゲームリセットに失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "ゲームリセットに失敗しました",
    };
  }
}

/**
 * 次ゲームへの準備完了をマーク
 */
export async function markReadyForNextGameAction(
  roomId: string,
  playerId: string
): Promise<ActionResult> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    await updateRoomWithRetry(supabase, roomId, (state) => {
      // FINISHEDフェーズ以外では何もしない
      if (state.phase !== "FINISHED") {
        return state;
      }
      // 既に準備完了なら何もしない
      if (state.readyForNextGame[playerId]) {
        return state;
      }
      return markReadyForNextGame(state, playerId);
    });

    return { success: true };
  } catch (error) {
    console.error("準備完了マークに失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "準備完了に失敗しました",
    };
  }
}

/**
 * マスク済みゲーム状態を取得
 */
export async function getClientGameStateAction(
  roomId: string,
  playerId: string
): Promise<ActionResult<ClientGameState>> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    const result = await getGameState(supabase, roomId);
    if (!result) {
      throw new RoomNotFoundError(roomId);
    }

    // プレイヤーの役職に応じてマスキング
    const myRole = result.gameState.initialDistribution[playerId];
    let clientState: ClientGameState;

    if (myRole && ROLES[myRole].isWerewolfNightAlly) {
      clientState = maskGameStateForWerewolf(result.gameState, playerId);
    } else {
      clientState = maskGameState(result.gameState, playerId);
    }

    return { success: true, data: clientState };
  } catch (error) {
    console.error("ゲーム状態の取得に失敗:", error);
    if (error instanceof RoomNotFoundError) {
      return { success: false, error: "部屋が見つかりません" };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "ゲーム状態の取得に失敗しました",
    };
  }
}

/**
 * 現在のプレイヤーIDを取得
 */
export async function getCurrentPlayerIdAction(): Promise<
  ActionResult<{ playerId: string }>
> {
  try {
    const playerId = await getOrCreatePlayerId();
    return { success: true, data: { playerId } };
  } catch (error) {
    console.error("プレイヤーID取得に失敗:", error);
    return {
      success: false,
      error: "プレイヤーIDの取得に失敗しました",
    };
  }
}
