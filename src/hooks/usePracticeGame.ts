"use client";

import { useState, useMemo, useCallback } from "react";
import {
  startGame as startGameReducer,
  executeNightAction,
  maskGameState,
  maskGameStateForWerewolf,
  ROLES,
  type GameState,
  type ClientGameState,
  type GameConfig,
  type Role,
  type ActionType,
  type GameAction,
  type Player,
} from "@/lib/game";
import type { ClientRoomState } from "@/lib/room";

type PracticePhase = "LOBBY" | "NIGHT" | "DAY";

const DEFAULT_PRACTICE_ROLES: Role[] = [
  "WEREWOLF", "WEREWOLF", "SEER", "ROBBER", "VILLAGER", "VILLAGER",
];

function generatePlayers(count: number): Player[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `practice-player-${i + 1}`,
    name: `Player ${i + 1}`,
    isHost: i === 0,
    isConnected: true,
  }));
}

function getMaskedState(state: GameState, playerId: string): ClientGameState {
  const role = state.initialDistribution[playerId];
  if (role && ROLES[role].isWerewolfNightAlly) {
    return maskGameStateForWerewolf(state, playerId);
  }
  return maskGameState(state, playerId);
}

export function usePracticeGame() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_PRACTICE_ROLES);
  const [phase, setPhase] = useState<PracticePhase>("LOBBY");
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [currentActorIndex, setCurrentActorIndex] = useState(0);
  const [viewPlayerId, setViewPlayerId] = useState<string | null>(null);

  const playerCount = Math.max(0, roles.length - 2);
  const players = useMemo(() => generatePlayers(playerCount), [playerCount]);

  // Night action holders
  const nightActors = useMemo(() => {
    if (!gameState) return [];
    return players.filter((p) => {
      const role = gameState.initialDistribution[p.id];
      return role && ROLES[role].hasNightAction;
    });
  }, [gameState, players]);

  const currentActor = phase === "NIGHT" ? (nightActors[currentActorIndex] ?? null) : null;

  const config: GameConfig = useMemo(() => ({
    roles,
    nightDuration: 0,
    dayDuration: 0,
    votingDuration: 0,
    updatedAt: Date.now(),
  }), [roles]);

  const startGame = useCallback(() => {
    if (playerCount < 3) return;

    const state = startGameReducer(players, config);
    setGameState(state);

    // startGame may auto-advance to DAY if no night actions exist
    if (state.phase === "DAY") {
      setPhase("DAY");
      setViewPlayerId(null);
    } else {
      setPhase("NIGHT");
      setCurrentActorIndex(0);
    }
  }, [playerCount, players, config]);

  const submitNightAction = useCallback(
    async (
      actionType: ActionType,
      targets: string[]
    ): Promise<{ success: boolean; error?: string }> => {
      if (!gameState || !currentActor) {
        return { success: false, error: "Invalid state" };
      }

      try {
        const action: GameAction = {
          actorId: currentActor.id,
          type: actionType,
          targetIds: targets,
          timestamp: Date.now(),
        };

        const newState = executeNightAction(gameState, action);
        setGameState(newState);

        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "アクション実行に失敗",
        };
      }
    },
    [gameState, currentActor]
  );

  const advanceNightActor = useCallback(() => {
    const nextIndex = currentActorIndex + 1;
    if (nextIndex >= nightActors.length) {
      setPhase("DAY");
      setViewPlayerId(null);
    } else {
      setCurrentActorIndex(nextIndex);
    }
  }, [currentActorIndex, nightActors.length]);

  const returnToLobby = useCallback(() => {
    setPhase("LOBBY");
    setGameState(null);
    setCurrentActorIndex(0);
    setViewPlayerId(null);
  }, []);

  // Generate ClientGameState for current view
  const currentClientState = useMemo((): ClientGameState | null => {
    if (!gameState) return null;

    const pid = phase === "NIGHT" ? currentActor?.id : viewPlayerId;
    if (!pid) return null;

    return getMaskedState(gameState, pid);
  }, [gameState, phase, currentActor, viewPlayerId]);

  // ClientRoomState wrapper for phase screen components
  const currentRoomState = useMemo((): ClientRoomState | null => {
    if (!currentClientState) return null;
    return {
      roomId: "practice",
      members: players,
      config,
      game: currentClientState,
    };
  }, [currentClientState, players, config]);

  return {
    // State
    phase,
    roles,
    players,
    playerCount,
    gameState,

    // Lobby
    setRoles,
    startGame,

    // Night
    currentActor,
    currentActorIndex,
    nightActors,
    currentClientState,
    currentRoomState,
    submitNightAction,
    advanceNightActor,

    // Day
    viewPlayerId,
    setViewPlayerId,
    returnToLobby,
  };
}
