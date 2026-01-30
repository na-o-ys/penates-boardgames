"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import type { Player, Role } from "@/lib/game";
import { buildRevealedInfo, getSwapReason } from "@/lib/game";
import type { ClientRoomState } from "@/lib/room";
import { PlayerCard } from "../common/PlayerCard";
import { PlayerRoleDisplay } from "../common/PlayerRoleDisplay";
import { CemeterySection } from "../common/CemeterySection";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { RoleConfigModal } from "../common/RoleConfigModal";
import { OtherPlayersDivider } from "../common/OtherPlayersDivider";
import { SkipLink } from "../common/SkipLink";
import { PhaseProgressBar } from "../common/PhaseProgressBar";


interface DayScreenProps {
  roomState: ClientRoomState;
  playerId: string;
  roomId: string;
  onAdvancePhase: () => Promise<{ success: boolean; error?: string }>;
}

export function DayScreen({ roomState, playerId, roomId, onAdvancePhase }: DayScreenProps) {
  const currentPlayerId = playerId;
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [showRoleConfig, setShowRoleConfig] = useState(false);

  const game = roomState.game!;
  const isHost = game.players[0]?.id === currentPlayerId;
  const dayDuration = roomState.config.dayDuration;
  const phaseStartedAt = game.phaseStartedAt;

  const calculateTimeLeft = useCallback(() => {
    if (!phaseStartedAt) return dayDuration;
    const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000);
    return Math.max(0, dayDuration - elapsed);
  }, [phaseStartedAt, dayDuration]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
  }, [calculateTimeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, calculateTimeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onAdvancePhase().catch(console.error);
    }
  }, [timeLeft, onAdvancePhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAdvanceToVoting = async () => {
    setIsAdvancing(true);
    try {
      const result = await onAdvancePhase();
      if (!result.success) {
        console.error("Failed to advance phase:", result.error);
      }
    } catch (error) {
      console.error("Error advancing phase:", error);
    } finally {
      setIsAdvancing(false);
    }
  };

  const isTimeLow = timeLeft <= 10 && timeLeft > 0;
  const revealedInfo = buildRevealedInfo(game.actionResults);

  const sortedPlayers = [...game.players].sort((a, b) =>
    a.id === currentPlayerId ? -1 : b.id === currentPlayerId ? 1 : 0
  );

  return (
    <div className="flex flex-col h-dvh overflow-hidden game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="pt-8 pb-4 px-4 text-center relative">
          <PhaseProgressBar currentPhase="DAY" />
          <button
            onClick={() => setShowRoleConfig(true)}
            className="absolute top-8 right-4 w-9 h-9 rounded-full glass-panel flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            aria-label="役職構成"
          >
            <span className="material-icons text-xl">groups</span>
          </button>
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-2">
            DISCUSSION PHASE
          </h1>
          <div className={`text-5xl font-bold mb-4 font-[family-name:var(--font-display)] ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "gold-text"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm">
            誰が人狼か話し合いましょう
          </p>
        </div>

        {/* Player list + Cemetery (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4 ">
          {sortedPlayers.map((player: Player, index: number) => {
            const swapReason = getSwapReason(player.id, game.myActions, game.players);
            return (
              <Fragment key={player.id}>
                {index === 1 && <OtherPlayersDivider />}
                <PlayerCard
                  playerName={player.name}
                  isCurrentPlayer={player.id === currentPlayerId}
                  statusBadges={
                    (player.id === currentPlayerId && (game.receivedBread || game.receivedNotice)) || swapReason ? (
                      <div className="text-xs space-y-1">
                        {player.id === currentPlayerId && game.receivedBread && (
                          <div className="flex items-center gap-1 text-amber-400">
                            <span className="material-icons text-sm">bakery_dining</span>
                            <span>パン屋からパンが届きました</span>
                          </div>
                        )}
                        {player.id === currentPlayerId && game.receivedNotice && (
                          <div className="flex items-center gap-1 text-white">
                            <span className="material-icons text-sm">mail</span>
                            <span>白怪盗から予告状が届きました</span>
                          </div>
                        )}
                        {swapReason && (
                          <span className="text-yellow-500">
                            <span className="material-icons text-sm align-middle animate-pulse">sync_alt</span>
                            {" "}{swapReason}
                          </span>
                        )}
                      </div>
                    ) : undefined
                  }
                >
                  <PlayerRoleDisplay
                    playerId={player.id}
                    currentPlayerId={currentPlayerId}
                    gameState={game}
                    onRoleClick={setDetailRole}
                  />
                </PlayerCard>
              </Fragment>
            );
          })}

          <CemeterySection centerRoles={revealedInfo.centers} />
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 pb-4 pt-8 -mt-8 relative z-10 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent">
          {isHost && (
            <SkipLink
              label={isAdvancing ? "移行中..." : "議論フェーズをスキップ"}
              onClick={handleAdvanceToVoting}
              disabled={isAdvancing}
            />
          )}
        </div>
      </div>

      {detailRole && (
        <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />
      )}

      {showRoleConfig && (
        <RoleConfigModal roles={[...roomState.config.roles]} onClose={() => setShowRoleConfig(false)} />
      )}
    </div>
  );
}
