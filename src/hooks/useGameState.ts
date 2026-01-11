"use client";

import { useState, useCallback, useEffect } from "react";
import { getClientGameStateAction, getCurrentPlayerIdAction } from "@/actions";
import { useRealtime } from "./useRealtime";
import type { ClientGameState } from "@/lib/game";

interface UseGameStateResult {
  gameState: ClientGameState | null;
  playerId: string | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * ゲーム状態を管理するフック
 * Realtimeで更新を受信し、自動的に最新状態を取得する
 */
export function useGameState(roomId: string): UseGameStateResult {
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGameState = useCallback(async () => {
    if (!roomId) return;

    try {
      const result = await getClientGameStateAction(roomId);
      if (result.success && result.data) {
        setGameState(result.data);
        setError(null);
      } else {
        setError(result.error ?? "ゲーム状態の取得に失敗しました");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [roomId]);

  const fetchPlayerId = useCallback(async () => {
    try {
      const result = await getCurrentPlayerIdAction();
      if (result.success && result.data) {
        setPlayerId(result.data.playerId);
      }
    } catch (e) {
      console.error("プレイヤーID取得エラー:", e);
    }
  }, []);

  // 初期ロード
  useEffect(() => {
    setIsLoading(true);
    fetchPlayerId();
    fetchGameState();
  }, [fetchGameState, fetchPlayerId]);

  // Realtimeで更新を購読
  useRealtime(roomId, fetchGameState);

  return {
    gameState,
    playerId,
    isLoading,
    error,
    refresh: fetchGameState,
  };
}
