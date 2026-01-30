"use server";

import { createClient } from "@/lib/supabase/server";
import {
  getRoomState,
  updateRoomWithRetry,
  updateGame,
  RoomNotFoundError,
} from "@/lib/supabase/rooms";
import {
  executeNightAction,
  executeVote,
  executeHunterRevenge,
  advancePhase,
  ROLES,
  SKIP_VOTE,
  type GameAction,
  type ActionType,
} from "@/lib/game";
import {
  startGame as roomStartGame,
  maskRoomState,
  type ClientRoomState,
} from "@/lib/room";
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

    await updateRoomWithRetry(supabase, roomId, (roomState) => {
      // ホストチェック
      const player = roomState.members.find((p) => p.id === playerId);
      if (!player?.isHost) {
        throw new Error("ホストのみがゲームを開始できます");
      }

      return roomStartGame(roomState);
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

    await updateGame(supabase, roomId, (game) => {
      const action: GameAction = {
        actorId: playerId,
        type: actionType,
        targetIds,
        timestamp: Date.now(),
      };

      return executeNightAction(game, action);
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

    await updateGame(supabase, roomId, (game) => {
      // 夜フェーズ以外では何もしない
      if (game.phase !== "NIGHT") {
        return game;
      }

      // 既にアクション済みなら何もしない
      if (game.actions.some((action) => action.actorId === playerId)) {
        return game;
      }

      const action: GameAction = {
        actorId: playerId,
        type: "SKIP",
        targetIds: [],
        timestamp: Date.now(),
      };

      return executeNightAction(game, action);
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

    await updateGame(supabase, roomId, (game) => {
      return executeVote(game, playerId, targetId);
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

    await updateGame(supabase, roomId, (game) => {
      // 投票フェーズ以外では何もしない
      if (game.phase !== "VOTING") {
        return game;
      }

      // 既に投票済みなら何もしない
      if (game.votes[playerId]) {
        return game;
      }

      // タイムアウト時はスキップ投票
      return executeVote(game, playerId, SKIP_VOTE);
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

    await updateGame(supabase, roomId, (game) => {
      return executeHunterRevenge(game, playerId, targetId);
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

    await updateGame(supabase, roomId, (game) => {
      // HUNTER_REVENGEフェーズ以外では何もしない
      if (game.phase !== "HUNTER_REVENGE") {
        return game;
      }

      // 既に選択済みなら何もしない
      if (game.hunterRevengeTarget[playerId]) {
        return game;
      }

      // 自分以外のプレイヤーからランダムに1人選択
      const otherPlayers = game.players.filter((p) => p.id !== playerId);
      const randomIndex = Math.floor(Math.random() * otherPlayers.length);
      const targetId = otherPlayers[randomIndex].id;

      return executeHunterRevenge(game, playerId, targetId);
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

    await updateGame(supabase, roomId, (game) => {
      // DAYフェーズ以外では何もしない（複数プレイヤーからの同時呼び出し対策）
      if (game.phase !== "DAY") {
        return game;
      }
      return advancePhase(game);
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
 * マスク済みルーム状態を取得
 */
export async function getClientGameStateAction(
  roomId: string,
  playerId: string
): Promise<ActionResult<ClientRoomState>> {
  try {
    await authorizePlayer(playerId);
    const supabase = await createClient();

    const result = await getRoomState(supabase, roomId);
    if (!result) {
      throw new RoomNotFoundError(roomId);
    }

    const clientState = maskRoomState(result.roomState, playerId);

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

/**
 * フェーズを強制進行（dev/test-room 用）
 */
export async function forceAdvancePhaseAction(
  roomId: string
): Promise<ActionResult> {
  try {
    const supabase = await createClient();

    await updateGame(supabase, roomId, (game) => {
      switch (game.phase) {
        case "NIGHT": {
          let g = game;
          for (const player of game.players) {
            if (!g.actions.some((a) => a.actorId === player.id)) {
              const role = g.initialDistribution[player.id];
              if (ROLES[role].hasNightAction) {
                g = executeNightAction(g, {
                  actorId: player.id,
                  type: "SKIP",
                  targetIds: [],
                  timestamp: Date.now(),
                });
              }
            }
          }
          if (g.phase === "NIGHT") {
            g = advancePhase(g);
          }
          return g;
        }
        case "DAY":
          return advancePhase(game);
        case "VOTING": {
          let g = game;
          for (const player of game.players) {
            if (!g.votes[player.id]) {
              g = executeVote(g, player.id, SKIP_VOTE);
            }
          }
          if (g.phase === "VOTING") {
            g = advancePhase(g);
          }
          return g;
        }
        case "HUNTER_REVENGE": {
          let g = game;
          for (const player of game.players) {
            if (!g.hunterRevengeTarget[player.id]) {
              try {
                const others = game.players.filter((p) => p.id !== player.id);
                const target = others[Math.floor(Math.random() * others.length)];
                g = executeHunterRevenge(g, player.id, target.id);
              } catch {
                /* not an executed hunter */
              }
            }
          }
          if (g.phase === "HUNTER_REVENGE") {
            g = advancePhase(g);
          }
          return g;
        }
        case "FINISHED":
          return game;
        default:
          return game;
      }
    });

    return { success: true };
  } catch (error) {
    console.error("強制進行に失敗:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "強制進行に失敗しました",
    };
  }
}
