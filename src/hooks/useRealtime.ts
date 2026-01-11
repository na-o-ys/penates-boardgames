"use client";

import { useEffect, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeToRoom, unsubscribeFromRoom } from "@/lib/supabase/realtime";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Supabase Realtimeで部屋の更新を購読するフック
 */
export function useRealtime(roomId: string, onUpdate: () => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabaseRef = useRef(createClient());

  const handleUpdate = useCallback(() => {
    onUpdate();
  }, [onUpdate]);

  useEffect(() => {
    if (!roomId) return;

    // 既存のチャンネルを解除
    if (channelRef.current) {
      unsubscribeFromRoom(channelRef.current);
    }

    // 新しいチャンネルを購読
    channelRef.current = subscribeToRoom(
      supabaseRef.current,
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
