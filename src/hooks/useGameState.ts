"use client";

import { useState, useCallback, useEffect } from "react";
import { getClientGameStateAction } from "@/actions";
import { useRealtime } from "./useRealtime";
import type { ClientRoomState } from "@/lib/room";

interface UseGameStateResult {
  roomState: ClientRoomState | null;
  isInRoom: boolean;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

/**
 * ルーム状態を管理するフック
 * Realtimeで更新を受信し、自動的に最新状態を取得する
 */
export function useGameState(roomId: string, playerId: string): UseGameStateResult {
  const [roomState, setRoomState] = useState<ClientRoomState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRoomState = useCallback(async () => {
    if (!roomId || !playerId) return;

    try {
      const result = await getClientGameStateAction(roomId, playerId);
      if (result.success && result.data) {
        setRoomState(result.data);
        setError(null);
      } else {
        setError(result.error ?? "ゲーム状態の取得に失敗しました");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  }, [roomId, playerId]);

  // 初期ロード
  useEffect(() => {
    setIsLoading(true);
    fetchRoomState();
  }, [fetchRoomState]);

  // Realtimeで更新を購読
  useRealtime(roomId, fetchRoomState);

  // プレイヤーがルームに入室しているかチェック
  const isInRoom = Boolean(
    roomState && playerId && roomState.members.some((p) => p.id === playerId)
  );

  return {
    roomState,
    isInRoom,
    isLoading,
    error,
    refresh: fetchRoomState,
  };
}
