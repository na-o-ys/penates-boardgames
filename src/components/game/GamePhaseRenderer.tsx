"use client";

import type { ClientGameState } from "@/lib/game";
import { LobbyScreen } from "@/components/lobby/LobbyScreen";
import { NightScreen } from "@/components/night/NightScreen";
import { DayScreen } from "@/components/day/DayScreen";
import { VotingScreen } from "@/components/voting/VotingScreen";
import { HunterRevengeScreen } from "@/components/hunter/HunterRevengeScreen";
import { ResultScreen } from "@/components/result/ResultScreen";

interface GamePhaseRendererProps {
  roomId: string;
  playerId: string;
  gameState: ClientGameState;
  onRefresh: () => void;
}

export function GamePhaseRenderer({
  roomId,
  playerId,
  gameState,
  onRefresh,
}: GamePhaseRendererProps) {
  const props = { roomId, playerId, gameState, onRefresh };

  switch (gameState.phase) {
    case "LOBBY":
      return <LobbyScreen {...props} />;
    case "NIGHT":
      return <NightScreen {...props} />;
    case "DAY":
      return <DayScreen {...props} />;
    case "VOTING":
      return <VotingScreen {...props} />;
    case "HUNTER_REVENGE":
      return <HunterRevengeScreen {...props} />;
    case "RESULT":
      return <ResultScreen {...props} />;
    default:
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-white">不明なフェーズ</h1>
          <p className="text-gray-400">フェーズ: {gameState.phase}</p>
        </div>
      );
  }
}
