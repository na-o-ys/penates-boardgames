// Client
export { createClient as createBrowserClient } from "./client";
export { createClient as createServerClient } from "./server";

// Database types
export type { Database, RoomRow, RoomInsert, RoomUpdate } from "./database.types";

// Room operations
export {
  createRoom,
  getRoom,
  getRoomState,
  updateRoom,
  updateRoomWithRetry,
  deleteRoom,
  roomExists,
  OptimisticLockError,
  RoomNotFoundError,
  type TypedSupabaseClient,
} from "./rooms";

// Realtime
export { subscribeToRoom, unsubscribeFromRoom } from "./realtime";
