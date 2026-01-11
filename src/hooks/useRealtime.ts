"use client";

import { useEffect, useRef, useCallback, useId } from "react";
import { createClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Supabase Realtimeで部屋の更新を購読するフック
 */
export function useRealtime(roomId: string, onUpdate: () => void) {
  const channelRef = useRef<RealtimeChannel | null>(null);
  const supabase = createClient();
  const uniqueId = useId();

  const handleUpdate = useCallback(() => {
    onUpdate();
  }, [onUpdate]);

  useEffect(() => {
    if (!roomId) return;

    // 既存のチャンネルを解除
    if (channelRef.current) {
      channelRef.current.unsubscribe();
    }

    // ユニークなチャンネル名で購読（同じroomIdでも競合しない）
    const channelName = `room:${roomId}:${uniqueId.replace(/:/g, "_")}`;
    channelRef.current = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "rooms",
          filter: `id=eq.${roomId}`,
        },
        () => {
          handleUpdate();
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    };
  }, [roomId, handleUpdate, supabase, uniqueId]);
}
