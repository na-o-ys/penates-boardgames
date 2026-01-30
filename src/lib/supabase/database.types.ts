import type { RoomState } from "@/lib/room/types";

export interface Database {
  public: {
    Tables: {
      rooms: {
        Row: {
          id: string;
          version: number;
          game_state: RoomState;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          version?: number;
          game_state: RoomState;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          version?: number;
          game_state?: RoomState;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type RoomRow = Database["public"]["Tables"]["rooms"]["Row"];
export type RoomInsert = Database["public"]["Tables"]["rooms"]["Insert"];
export type RoomUpdate = Database["public"]["Tables"]["rooms"]["Update"];
