"use client";

import type { ClientGameState } from "@/lib/game";
import {
  startGameAction,
  updateGameConfigAction,
  kickPlayerAction,
  submitNightActionAction,
  autoSkipNightActionAction,
  advancePhaseAction,
  submitVoteAction,
  autoVoteAction,
  submitHunterRevengeAction,
  autoHunterRevengeAction,
  resetGameAction,
} from "@/actions";
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
}

export function GamePhaseRenderer({
  roomId,
  playerId,
  gameState,
}: GamePhaseRendererProps) {
  switch (gameState.phase) {
    case "LOBBY":
      return (
        <LobbyScreen
          roomId={roomId}
          playerId={playerId}
          gameState={gameState}
          onStartGame={() => startGameAction(roomId, playerId)}
          onSaveConfig={(config) => updateGameConfigAction(roomId, playerId, config)}
          onKickPlayer={(targetId) => kickPlayerAction(roomId, playerId, targetId)}
        />
      );
    case "NIGHT":
      return (
        <NightScreen
          roomId={roomId}
          playerId={playerId}
          gameState={gameState}
          onSubmitAction={(actionType, targets) => submitNightActionAction(roomId, playerId, actionType, targets)}
          onAutoSkip={() => autoSkipNightActionAction(roomId, playerId)}
        />
      );
    case "DAY":
      return (
        <DayScreen
          roomId={roomId}
          playerId={playerId}
          gameState={gameState}
          onAdvancePhase={() => advancePhaseAction(roomId, playerId)}
        />
      );
    case "VOTING":
      return (
        <VotingScreen
          roomId={roomId}
          playerId={playerId}
          gameState={gameState}
          onSubmitVote={(targetId) => submitVoteAction(roomId, playerId, targetId)}
          onAutoVote={() => autoVoteAction(roomId, playerId)}
        />
      );
    case "HUNTER_REVENGE":
      return (
        <HunterRevengeScreen
          roomId={roomId}
          playerId={playerId}
          gameState={gameState}
          onSubmitRevenge={(targetId) => submitHunterRevengeAction(roomId, playerId, targetId)}
          onAutoRevenge={() => autoHunterRevengeAction(roomId, playerId)}
        />
      );
    case "RESULT":
      return (
        <ResultScreen
          roomId={roomId}
          playerId={playerId}
          gameState={gameState}
          onPlayAgain={() => resetGameAction(roomId, playerId)}
        />
      );
    default:
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-white">不明なフェーズ</h1>
          <p className="text-gray-400">フェーズ: {gameState.phase}</p>
        </div>
      );
  }
}
