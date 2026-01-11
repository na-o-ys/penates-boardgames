"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToRoom, unsubscribeFromRoom } from "@/lib/supabase/realtime";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Supabase Realtimeで部屋の更新を購読するフック
 * モックモードではポーリングを使用
 */
export function useRealtime(roomId: string, onUpdate: () => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const handleUpdate = useCallback(() => {
    onUpdate();
  }, [onUpdate]);

  useEffect(() => {
    if (!roomId) return;

    const supabase = supabaseRef.current;

    // モックモード: ポーリングを使用
    if (!supabase) {
      // 1秒ごとにポーリング
      pollingRef.current = setInterval(() => {
        handleUpdate();
      }, 1000);

      return () => {
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      };
    }

    // 通常モード: Supabase Realtimeを使用
    // 既存のチャンネルを解除
    if (channelRef.current) {
      unsubscribeFromRoom(channelRef.current);
    }

    // 新しいチャンネルを購読
    channelRef.current = subscribeToRoom(
      supabase,
      roomId,
      handleUpdate
    );

    return () => {
      if (channelRef.current) {
        unsubscribeFromRoom(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [roomId, handleUpdate]);
}
