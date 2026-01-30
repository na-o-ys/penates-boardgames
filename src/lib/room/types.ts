import type {
  ClientGameState,
  GameConfig,
  GameState,
  Player,
  PlayerId,
  PlayerStat,
  RoomStats,
} from "../game/types";

/** ルーム状態（DB game_state カラムに保存） */
export interface RoomState {
  readonly roomId: string;
  readonly members: readonly Player[]; // ルームメンバー（いつでも参加可能）
  readonly config: GameConfig;
  readonly playerStats: Record<PlayerId, PlayerStat>;
  readonly roomStats: RoomStats;
  readonly game: GameState | null; // null = ロビー
}

/** クライアント用ルーム状態 */
export interface ClientRoomState {
  readonly roomId: string;
  readonly members: readonly Player[];
  readonly config: GameConfig;
  readonly playerStats?: Record<PlayerId, PlayerStat>;
  readonly roomStats?: RoomStats;
  readonly game: ClientGameState | null; // null = ロビー
}

/** Rooms テーブルの行型 */
export interface RoomRow {
  id: string;
  version: number;
  game_state: RoomState;
  created_at: string;
  updated_at: string;
}
