"use client";

import { useGameState } from "@/hooks/useGameState";
import { GamePhaseRenderer } from "@/components/game/GamePhaseRenderer";

interface PlayerColumnProps {
  roomId: string;
  playerId: string;
  playerName: string;
}

export function PlayerColumn({ roomId, playerId, playerName }: PlayerColumnProps) {
  const { gameState, isLoading, refresh } = useGameState(roomId, playerId);

  if (isLoading || !gameState) {
    return (
      <div className="h-full flex items-center justify-center text-gray-400">
        読み込み中...
      </div>
    );
  }

  const isHost = gameState.players.find((p) => p.id === playerId)?.isHost;

  return (
    <div className="border border-gray-700 h-full overflow-hidden flex flex-col">
      <header className="bg-slate-800 px-2 py-1 text-center shrink-0">
        <span className="text-white text-sm font-semibold">{playerName}</span>
        {isHost && (
          <span className="ml-1 text-xs bg-yellow-600 px-1 rounded">Host</span>
        )}
      </header>
      <div className="flex-1 overflow-y-auto">
        <GamePhaseRenderer
          roomId={roomId}
          playerId={playerId}
          gameState={gameState}
          onRefresh={refresh}
        />
      </div>
    </div>
  );
}
