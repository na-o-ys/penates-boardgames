"use client";

import type { Player } from "@/lib/game";

interface PlayerListProps {
  players: readonly Player[];
  currentPlayerId: string;
}

export function PlayerList({ players, currentPlayerId }: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.id}
          className={`flex items-center justify-between px-4 py-3 rounded-lg ${
            player.id === currentPlayerId
              ? "bg-blue-900/30 border border-blue-500"
              : "bg-gray-800"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-3 h-3 rounded-full ${
                player.isConnected ? "bg-green-500" : "bg-gray-500"
              }`}
            />
            <span className="text-white font-medium">{player.name}</span>
            {player.id === currentPlayerId && (
              <span className="text-xs text-blue-400">(あなた)</span>
            )}
          </div>
          {player.isHost && (
            <span className="px-2 py-1 bg-yellow-600/30 text-yellow-400 text-xs rounded">
              ホスト
            </span>
          )}
        </div>
      ))}
    </div>
  );
}
