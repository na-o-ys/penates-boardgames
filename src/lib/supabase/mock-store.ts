/**
 * テスト用インメモリストア
 * Supabaseの環境変数がない場合に使用
 */

import type { GameState } from "@/lib/game/types";

interface RoomData {
  id: string;
  game_state: GameState;
  version: number;
  created_at: string;
  updated_at: string;
}

// グローバルストア（サーバーサイドで共有）
const globalStore = globalThis as unknown as {
  __mockRooms?: Map<string, RoomData>;
};

function getStore(): Map<string, RoomData> {
  if (!globalStore.__mockRooms) {
    globalStore.__mockRooms = new Map();
  }
  return globalStore.__mockRooms;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}

export const mockRooms = {
  create(gameState: GameState): string {
    const store = getStore();
    const id = generateId();
    const now = new Date().toISOString();
    store.set(id, {
      id,
      game_state: gameState,
      version: 1,
      created_at: now,
      updated_at: now,
    });
    return id;
  },

  get(roomId: string): RoomData | null {
    const store = getStore();
    return store.get(roomId) ?? null;
  },

  update(roomId: string, currentVersion: number, newGameState: GameState): number | null {
    const store = getStore();
    const room = store.get(roomId);
    if (!room || room.version !== currentVersion) {
      return null;
    }
    const newVersion = currentVersion + 1;
    store.set(roomId, {
      ...room,
      game_state: newGameState,
      version: newVersion,
      updated_at: new Date().toISOString(),
    });
    return newVersion;
  },

  delete(roomId: string): void {
    const store = getStore();
    store.delete(roomId);
  },

  exists(roomId: string): boolean {
    const store = getStore();
    return store.has(roomId);
  },

  clear(): void {
    const store = getStore();
    store.clear();
  },
};
