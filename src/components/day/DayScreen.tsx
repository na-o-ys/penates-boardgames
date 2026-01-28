"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientGameState, Player } from "@/lib/game";
import { buildRevealedInfo, getSwapReason } from "@/lib/game";
import { RoleMiniCard, UnknownMiniCard } from "../common/RoleMiniCard";
import { PlayerCard } from "../common/PlayerCard";
import { CemeterySection } from "../common/CemeterySection";

interface DayScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onAdvancePhase: () => Promise<{ success: boolean; error?: string }>;
}

export function DayScreen({ gameState, playerId, roomId, onAdvancePhase }: DayScreenProps) {
  const currentPlayerId = playerId;
  const [isAdvancing, setIsAdvancing] = useState(false);

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

  const robberSwap = gameState.actionResults.find((r) => r.type === "ROBBER_SWAP");
  const hasSwapped = robberSwap && robberSwap.revealedRoles?.[0];

  const robberTargetId = robberSwap?.targetIds[0];

  const renderRoleDisplay = (player: Player) => {
    const isCurrentPlayer = player.id === currentPlayerId;

    // 自分が怪盗で交換した場合: ROBBER(薄) → 新役職
    if (isCurrentPlayer && hasSwapped && gameState.myRole) {
      return (
        <>
          <div className="opacity-50 grayscale scale-90">
            <RoleMiniCard role={gameState.myRole} size="small" />
          </div>
          <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
          <RoleMiniCard role={robberSwap.revealedRoles![0]} size="medium" />
        </>
      );
    }

    // 怪盗の交換先プレイヤー: 元役職(薄) → ROBBER
    if (hasSwapped && player.id === robberTargetId && gameState.myRole) {
      return (
        <>
          <div className="opacity-50 grayscale scale-90">
            <RoleMiniCard role={robberSwap.revealedRoles![0]} size="small" />
          </div>
          <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
          <RoleMiniCard role={gameState.myRole} size="medium" />
        </>
      );
    }

    // 自分のカード: 自分の役職を表示
    if (isCurrentPlayer && gameState.myRole) {
      return <RoleMiniCard role={gameState.myRole} size="medium" />;
    }

    // 他プレイヤー: 判明済みなら表示、不明なら不明カード
    const revealedRole = revealedInfo.players[player.id];
    if (revealedRole) {
      return <RoleMiniCard role={revealedRole} size="medium" />;
    }

    return <UnknownMiniCard />;
  };

  return (
    <div className="min-h-screen game-overlay p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 pt-4">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-2">
            議論フェーズ
          </h1>
          <div className={`text-5xl font-bold mb-4 ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "gold-text"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[var(--color-text-secondary)]">
            誰が人狼か話し合いましょう
          </p>
        </div>

        {/* プレイヤー一覧 */}
        <div className="space-y-3 mb-6">
          {sortedPlayers.map((player: Player) => {
            const swapReason = getSwapReason(player.id, gameState.myActions, gameState.players);
            return (
              <PlayerCard
                key={player.id}
                playerName={player.name}
                isCurrentPlayer={player.id === currentPlayerId}
                statusBadges={swapReason ? (
                  <div className="text-xs">
                    <span className="text-yellow-500">
                      <span className="material-icons text-sm align-middle animate-pulse">sync_alt</span>
                      {" "}{swapReason}
                    </span>
                  </div>
                ) : undefined}
              >
                {renderRoleDisplay(player)}
              </PlayerCard>
            );
          })}

          <CemeterySection centerRoles={revealedInfo.centers} />
        </div>

        {/* 投票へ進むボタン（ホストのみ） */}
        {isHost && (
          <button
            onClick={handleAdvanceToVoting}
            disabled={isAdvancing}
            className="w-full py-4 btn-primary rounded-xl text-lg font-[family-name:var(--font-display)] tracking-wider"
          >
            {isAdvancing ? "移行中..." : "投票フェーズへ進む"}
          </button>
        )}

        {!isHost && (
          <p className="text-center text-[var(--color-text-muted)]">
            ホストが投票フェーズへ進めるのを待っています...
          </p>
        )}
      </div>
    </div>
  );
}
