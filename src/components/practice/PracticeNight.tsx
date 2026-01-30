"use client";

import { useState, useCallback } from "react";
import type { ActionType, Player, GameState } from "@/lib/game";
import type { ClientRoomState } from "@/lib/room";
import { NightScreen } from "../night/NightScreen";
import { GodViewPanel } from "./GodViewPanel";

const RESULT_ACTIONS: ActionType[] = ["SEER_LOOK_PLAYER", "SEER_LOOK_CENTER", "ROBBER_SWAP"];

interface PracticeNightProps {
  currentActor: Player | null;
  currentActorIndex: number;
  nightActors: Player[];
  currentRoomState: ClientRoomState | null;
  gameState: GameState;
  onSubmitAction: (type: ActionType, targets: string[]) => Promise<{ success: boolean; error?: string }>;
  onAdvanceActor: () => void;
}

const noOp = async () => ({ success: true as const });

export function PracticeNight({
  currentActor,
  currentActorIndex,
  nightActors,
  currentRoomState,
  gameState,
  onSubmitAction,
  onAdvanceActor,
}: PracticeNightProps) {
  const [showGodView, setShowGodView] = useState(false);

  const handleSubmitAction = useCallback(
    async (type: ActionType, targets: string[]) => {
      const result = await onSubmitAction(type, targets);
      if (result.success && !RESULT_ACTIONS.includes(type)) {
        onAdvanceActor();
      }
      return result;
    },
    [onSubmitAction, onAdvanceActor]
  );

  if (!currentActor || !currentRoomState) {
    return (
      <div className="flex min-h-screen items-center justify-center game-overlay">
        <div className="text-white animate-pulse">夜フェーズ準備中...</div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* プレイヤー進行バー */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-slate-900/90 backdrop-blur-sm border-b border-white/10 px-4 py-2">
        <div className="max-w-md mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-icons text-amber-400 text-sm">person</span>
            <span className="text-white font-semibold text-sm">
              {currentActor.name}
            </span>
          </div>
          <div className="flex items-center gap-1">
            {nightActors.map((actor, i) => (
              <div
                key={actor.id}
                className={`w-2 h-2 rounded-full ${
                  i < currentActorIndex
                    ? "bg-emerald-400"
                    : i === currentActorIndex
                    ? "bg-amber-400"
                    : "bg-slate-600"
                }`}
              />
            ))}
            <span className="text-[var(--color-text-muted)] text-xs ml-2">
              {currentActorIndex + 1}/{nightActors.length}
            </span>
            <button
              onClick={() => setShowGodView((v) => !v)}
              className={`ml-2 p-1 rounded transition-colors ${
                showGodView
                  ? "bg-amber-500 text-[var(--color-bg-deep)]"
                  : "text-amber-400/60 hover:text-amber-400"
              }`}
            >
              <span className="material-icons text-sm">visibility</span>
            </button>
          </div>
        </div>
      </div>

      {/* コンテンツ */}
      <div className="pt-10">
        {showGodView ? (
          <div className="flex flex-col min-h-screen game-overlay">
            <div className="max-w-md mx-auto w-full px-4 py-6">
              <h2 className="text-center text-amber-400 text-sm font-semibold uppercase tracking-widest mb-4">
                God View
              </h2>
              <GodViewPanel gameState={gameState} />
            </div>
          </div>
        ) : (
          <NightScreen
            key={currentActor.id}
            roomId="practice"
            roomState={currentRoomState}
            playerId={currentActor.id}
            onSubmitAction={handleSubmitAction}
            onAutoSkip={noOp}
            onResultConfirmed={onAdvanceActor}
          />
        )}
      </div>

    </div>
  );
}
