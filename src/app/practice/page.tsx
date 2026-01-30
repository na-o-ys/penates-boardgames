"use client";

import { usePracticeGame } from "@/hooks/usePracticeGame";
import { PracticeLobby } from "@/components/practice/PracticeLobby";
import { PracticeNight } from "@/components/practice/PracticeNight";
import { PracticeDay } from "@/components/practice/PracticeDay";

export default function PracticePage() {
  const practice = usePracticeGame();

  switch (practice.phase) {
    case "LOBBY":
      return (
        <PracticeLobby
          roles={practice.roles}
          players={practice.players}
          playerCount={practice.playerCount}
          setRoles={practice.setRoles}
          startGame={practice.startGame}
        />
      );
    case "NIGHT":
      return (
        <PracticeNight
          currentActor={practice.currentActor}
          currentActorIndex={practice.currentActorIndex}
          nightActors={practice.nightActors}
          currentRoomState={practice.currentRoomState}
          gameState={practice.gameState!}
          onSubmitAction={practice.submitNightAction}
          onAdvanceActor={practice.advanceNightActor}
        />
      );
    case "DAY":
      return (
        <PracticeDay
          gameState={practice.gameState!}
          players={practice.players}
          viewPlayerId={practice.viewPlayerId}
          setViewPlayerId={practice.setViewPlayerId}
          returnToLobby={practice.returnToLobby}
        />
      );
  }
}
