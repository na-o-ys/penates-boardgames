"use client";

import { useState, useEffect } from "react";
import type { ClientRoomState } from "@/lib/room";
import { PhaseInterstitial } from "@/components/common/PhaseInterstitial";
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
  roomState: ClientRoomState;
}

export function GamePhaseRenderer({
  roomId,
  playerId,
  roomState,
}: GamePhaseRendererProps) {
  const game = roomState.game;
  const [returnedToLobby, setReturnedToLobby] = useState(false);
  const [shownForPhase, setShownForPhase] = useState<string | null>(game?.phase ?? null);

  // フェーズが FINISHED 以外に変わったらリセット
  useEffect(() => {
    if (game?.phase !== "FINISHED") {
      setReturnedToLobby(false);
    }
  }, [game?.phase]);

  // ロビー（ゲーム未開始）または途中参加者（ゲーム参加者でない）
  if (!game || game.myRole === null) {
    return (
      <LobbyScreen
        roomId={roomId}
        playerId={playerId}
        roomState={roomState}
        onStartGame={() => startGameAction(roomId, playerId)}
        onSaveConfig={(config) => updateGameConfigAction(roomId, playerId, config)}
        onKickPlayer={(targetId) => kickPlayerAction(roomId, playerId, targetId)}
      />
    );
  }

  if (game.phase !== shownForPhase) {
    return (
      <PhaseInterstitial
        phase={game.phase}
        onComplete={() => setShownForPhase(game.phase)}
      />
    );
  }

  switch (game.phase) {
    case "NIGHT":
      return (
        <NightScreen
          roomId={roomId}
          playerId={playerId}
          roomState={roomState}
          onSubmitAction={(actionType, targets) => submitNightActionAction(roomId, playerId, actionType, targets)}
          onAutoSkip={() => autoSkipNightActionAction(roomId, playerId)}
        />
      );
    case "DAY":
      return (
        <DayScreen
          roomId={roomId}
          playerId={playerId}
          roomState={roomState}
          onAdvancePhase={() => advancePhaseAction(roomId, playerId)}
        />
      );
    case "VOTING":
      return (
        <VotingScreen
          roomId={roomId}
          playerId={playerId}
          roomState={roomState}
          onSubmitVote={(targetId) => submitVoteAction(roomId, playerId, targetId)}
          onAutoVote={() => autoVoteAction(roomId, playerId)}
        />
      );
    case "HUNTER_REVENGE":
      return (
        <HunterRevengeScreen
          roomId={roomId}
          playerId={playerId}
          roomState={roomState}
          onSubmitRevenge={(targetId) => submitHunterRevengeAction(roomId, playerId, targetId)}
          onAutoRevenge={() => autoHunterRevengeAction(roomId, playerId)}
        />
      );
    case "FINISHED":
      if (returnedToLobby) {
        return (
          <LobbyScreen
            roomId={roomId}
            playerId={playerId}
            roomState={roomState}
            onStartGame={() => startGameAction(roomId, playerId)}
            onSaveConfig={(config) => updateGameConfigAction(roomId, playerId, config)}
            onKickPlayer={(targetId) => kickPlayerAction(roomId, playerId, targetId)}
          />
        );
      }
      return (
        <ResultScreen
          roomId={roomId}
          playerId={playerId}
          roomState={roomState}
          onReturnToLobby={() => setReturnedToLobby(true)}
        />
      );
    default:
      return (
        <div className="flex min-h-screen flex-col items-center justify-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-white">不明なフェーズ</h1>
          <p className="text-gray-400">フェーズ: {game.phase}</p>
        </div>
      );
  }
}
