"use client";

import { useGameState } from "@/hooks/useGameState";
import { LobbyScreen } from "@/components/lobby/LobbyScreen";
import { NightScreen } from "@/components/night/NightScreen";
import { DayScreen } from "@/components/day/DayScreen";
import { VotingScreen } from "@/components/voting/VotingScreen";
import { ResultScreen } from "@/components/result/ResultScreen";

interface PlayerColumnProps {
  roomId: string;
  playerId: string;
  playerName: string;
}

export function PlayerColumn({ roomId, playerId, playerName }: PlayerColumnProps) {
  const { gameState, isLoading, refresh } = useGameState(roomId, playerId);

  if (isLoading || !gameState) {
    return (
      <div className="bg-gray-900 h-full flex items-center justify-center text-gray-400">
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
        {gameState.phase === "LOBBY" && (
          <LobbyScreen
            roomId={roomId}
            gameState={gameState}
            playerId={playerId}
            onRefresh={refresh}
          />
        )}
        {gameState.phase === "NIGHT" && (
          <NightScreen
            roomId={roomId}
            gameState={gameState}
            playerId={playerId}
            onRefresh={refresh}
          />
        )}
        {gameState.phase === "DAY" && (
          <DayScreen
            roomId={roomId}
            gameState={gameState}
            playerId={playerId}
            onRefresh={refresh}
          />
        )}
        {gameState.phase === "VOTING" && (
          <VotingScreen
            roomId={roomId}
            gameState={gameState}
            playerId={playerId}
            onRefresh={refresh}
          />
        )}
        {gameState.phase === "RESULT" && (
          <ResultScreen
            roomId={roomId}
            gameState={gameState}
            playerId={playerId}
            onRefresh={refresh}
          />
        )}
      </div>
    </div>
  );
}
