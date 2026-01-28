"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import type { ClientGameState, Player, Role } from "@/lib/game";
import { buildRevealedInfo, getSwapReason } from "@/lib/game";
import { PlayerCard } from "../common/PlayerCard";
import { PlayerRoleDisplay } from "../common/PlayerRoleDisplay";
import { CemeterySection } from "../common/CemeterySection";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { RoleConfigModal } from "../common/RoleConfigModal";
import { OtherPlayersDivider } from "../common/OtherPlayersDivider";
import { SkipLink } from "../common/SkipLink";

interface DayScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onAdvancePhase: () => Promise<{ success: boolean; error?: string }>;
}

export function DayScreen({ gameState, playerId, roomId, onAdvancePhase }: DayScreenProps) {
  const currentPlayerId = playerId;
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [showRoleConfig, setShowRoleConfig] = useState(false);

  const isHost = gameState.players[0]?.id === currentPlayerId;
  const dayDuration = gameState.config.dayDuration;
  const phaseStartedAt = gameState.phaseStartedAt;

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
  const revealedInfo = buildRevealedInfo(gameState.actionResults);

  const sortedPlayers = [...gameState.players].sort((a, b) =>
    a.id === currentPlayerId ? -1 : b.id === currentPlayerId ? 1 : 0
  );

  return (
    <div className="flex flex-col min-h-screen game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="pt-8 pb-4 px-4 text-center relative">
          <button
            onClick={() => setShowRoleConfig(true)}
            className="absolute top-8 right-4 w-9 h-9 rounded-full glass-panel flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            aria-label="役職構成"
          >
            <span className="material-icons text-xl">groups</span>
          </button>
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-2">
            議論フェーズ
          </h1>
          <div className={`text-5xl font-bold mb-4 ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "gold-text"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm">
            誰が人狼か話し合いましょう
          </p>
        </div>

        {/* Player list + Cemetery (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
          {sortedPlayers.map((player: Player, index: number) => {
            const swapReason = getSwapReason(player.id, gameState.myActions, gameState.players);
            return (
              <Fragment key={player.id}>
                {index === 1 && <OtherPlayersDivider />}
                <PlayerCard
                  playerName={player.name}
                  isCurrentPlayer={player.id === currentPlayerId}
                  statusBadges={
                    (player.id === currentPlayerId && gameState.receivedBread) || swapReason ? (
                      <div className="text-xs space-y-1">
                        {player.id === currentPlayerId && gameState.receivedBread && (
                          <div className="flex items-center gap-1 text-amber-400">
                            <span className="material-icons text-sm">bakery_dining</span>
                            <span>パン屋からパンが届きました</span>
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
                    gameState={gameState}
                    onRoleClick={setDetailRole}
                  />
                </PlayerCard>
              </Fragment>
            );
          })}

          <CemeterySection centerRoles={revealedInfo.centers} />
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent z-20 max-w-md mx-auto">
          {isHost ? (
            <SkipLink
              label={isAdvancing ? "移行中..." : "議論フェーズをスキップ"}
              onClick={handleAdvanceToVoting}
              disabled={isAdvancing}
            />
          ) : (
            <p className="text-center text-[var(--color-text-muted)] py-3">
              ホストが投票フェーズへ進めるのを待っています...
            </p>
          )}
        </div>
      </div>

      {detailRole && (
        <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />
      )}

      {showRoleConfig && (
        <RoleConfigModal roles={[...gameState.config.roles]} onClose={() => setShowRoleConfig(false)} />
      )}
    </div>
  );
}
