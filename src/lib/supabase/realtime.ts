import { RealtimeChannel, SupabaseClient } from "@supabase/supabase-js";

export function subscribeToRoom(
  supabase: SupabaseClient,
  roomId: string,
  onUpdate: () => void
): RealtimeChannel {
  return supabase
    .channel(`room:${roomId}`)
    .on(
      "postgres_changes",
      {
        event: "UPDATE",
        schema: "public",
        table: "rooms",
        filter: `id=eq.${roomId}`,
      },
      () => {
        onUpdate();
      }
    )
    .subscribe();
}

export function unsubscribeFromRoom(channel: RealtimeChannel): void {
  channel.unsubscribe();
}
