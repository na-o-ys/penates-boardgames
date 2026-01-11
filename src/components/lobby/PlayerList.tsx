"use client";

import type { Player } from "@/lib/game";

interface PlayerListProps {
  players: readonly Player[];
  currentPlayerId: string;
  isHost?: boolean;
  onKickPlayer?: (playerId: string) => void;
}

export function PlayerList({
  players,
  currentPlayerId,
  isHost = false,
  onKickPlayer,
}: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.id}
          className={`flex items-center justify-between px-4 py-3 rounded-lg ${
            player.id === currentPlayerId
              ? "bg-slate-700 border border-slate-500"
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
              <span className="text-xs text-gray-400">(あなた)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {player.isHost && (
              <span className="px-2 py-1 bg-slate-600 text-slate-200 text-xs rounded">
                ホスト
              </span>
            )}
            {isHost && !player.isHost && player.id !== currentPlayerId && onKickPlayer && (
              <button
                onClick={() => onKickPlayer(player.id)}
                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white text-xs rounded transition-colors"
                title={`${player.name}を退室させる`}
              >
                退室
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
