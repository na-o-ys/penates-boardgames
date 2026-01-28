"use client";

import type { Player } from "@/lib/game";

interface PlayerListProps {
  players: readonly Player[];
  currentPlayerId: string;
  isHost?: boolean;
  onKickPlayer?: (playerId: string) => void;
  readyForNextGame?: Record<string, boolean>;
}

export function PlayerList({
  players,
  currentPlayerId,
  isHost = false,
  onKickPlayer,
  readyForNextGame,
}: PlayerListProps) {
  return (
    <div className="space-y-2">
      {players.map((player) => (
        <div
          key={player.id}
          className={`flex items-center justify-between px-4 py-3 rounded-xl ${
            player.id === currentPlayerId
              ? "glass-card card-highlight"
              : "glass-card"
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`w-2.5 h-2.5 rounded-full ${
                player.isConnected ? "bg-[var(--color-ready)]" : "bg-[var(--color-text-muted)]"
              }`}
            />
            <span className="text-white font-medium">{player.name}</span>
            {player.id === currentPlayerId && (
              <span className="text-xs text-[var(--color-text-muted)]">(あなた)</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {readyForNextGame !== undefined && readyForNextGame[player.id] && (
              <span className="px-2 py-1 bg-[var(--color-ready)]/20 text-[var(--color-ready)] text-xs rounded-lg font-semibold">
                準備完了
              </span>
            )}
            {player.isHost && (
              <span className="px-2 py-1 bg-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs rounded-lg font-semibold">
                ホスト
              </span>
            )}
            {isHost && !player.isHost && player.id !== currentPlayerId && onKickPlayer && (
              <button
                onClick={() => onKickPlayer(player.id)}
                className="px-2 py-1 bg-[var(--color-error)]/20 hover:bg-[var(--color-error)]/40 text-[var(--color-error)] text-xs rounded-lg transition-colors font-semibold"
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
