"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientGameState, Role } from "@/lib/game";
import { SKIP_VOTE } from "@/lib/game";
import { PlayerCard } from "../common/PlayerCard";
import { PlayerRoleDisplay } from "../common/PlayerRoleDisplay";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { RoleConfigModal } from "../common/RoleConfigModal";
import { ConfirmModal } from "../common/ConfirmModal";
import { SkipLink } from "../common/SkipLink";

interface VotingScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onSubmitVote: (targetId: string) => Promise<{ success: boolean; error?: string }>;
  onAutoVote: () => Promise<{ success: boolean; error?: string }>;
}

export function VotingScreen({ gameState, playerId, roomId, onSubmitVote, onAutoVote }: VotingScreenProps) {
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | "skip" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [showRoleConfig, setShowRoleConfig] = useState(false);

  const votedCount = gameState.votedPlayers?.length ?? 0;
  const totalPlayers = gameState.players.length;
  const hasVoted = gameState.votedPlayers?.includes(playerId) ?? false;

  const votingDuration = gameState.config.votingDuration;
  const phaseStartedAt = gameState.phaseStartedAt;

  const calculateTimeLeft = useCallback(() => {
    if (!phaseStartedAt) return votingDuration;
    const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000);
    return Math.max(0, votingDuration - elapsed);
  }, [phaseStartedAt, votingDuration]);

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
    if (timeLeft <= 0 && !hasVoted) {
      onAutoVote().catch(console.error);
    }
  }, [timeLeft, hasVoted, onAutoVote]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;

    const targetId = confirmTarget === "skip" ? SKIP_VOTE : confirmTarget.id;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onSubmitVote(targetId);
      if (!result.success) {
        setError(result.error ?? "投票に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
      setConfirmTarget(null);
    }
  };

  const isTimeLow = timeLeft <= 10 && timeLeft > 0;

  const sortedPlayers = [...gameState.players].sort((a, b) =>
    a.id === playerId ? -1 : b.id === playerId ? 1 : 0
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
            投票フェーズ
          </h1>
          <div className={`text-5xl font-bold mb-4 ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "gold-text"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {hasVoted ? "投票済み — 他のプレイヤーの投票を待っています" : "処刑したいプレイヤーを選択してください"}
          </p>
          <div className="mt-2 text-sm text-[var(--color-text-muted)]">
            投票済み: {votedCount} / {totalPlayers}
          </div>
        </div>

        {error && (
          <div className="mx-4 mb-4 px-4 py-3 bg-[var(--color-error)]/20 border border-[var(--color-error)]/40 rounded-xl text-[var(--color-error)] text-center text-sm">
            {error}
          </div>
        )}

        {/* Player list (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
          {sortedPlayers.map((player) => {
            const isCurrentPlayer = player.id === playerId;
            const playerHasVoted = gameState.votedPlayers?.includes(player.id) ?? false;

            const cardOnClick = (!isCurrentPlayer && !hasVoted)
              ? () => setConfirmTarget({ id: player.id, name: player.name })
              : undefined;

            return (
              <PlayerCard
                key={player.id}
                playerName={player.name}
                isCurrentPlayer={isCurrentPlayer}
                onClick={cardOnClick}
                statusBadges={playerHasVoted ? (
                  <div className="text-xs">
                    <span className="text-[var(--color-ready)] font-bold">
                      <span className="material-icons text-sm align-middle">check</span>
                      {" "}投票済み
                    </span>
                  </div>
                ) : undefined}
              >
                <PlayerRoleDisplay
                  playerId={player.id}
                  currentPlayerId={playerId}
                  gameState={gameState}
                  tappable={!isCurrentPlayer && !hasVoted}
                  onRoleClick={setDetailRole}
                />
              </PlayerCard>
            );
          })}
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent z-20 max-w-md mx-auto">
          {hasVoted ? (
            <div className="text-center py-3">
              <div className="w-full bg-black/30 rounded-full h-2 mb-2">
                <div
                  className="bg-[var(--color-primary)] rounded-full h-2 transition-all duration-500"
                  style={{ width: `${(votedCount / totalPlayers) * 100}%` }}
                />
              </div>
              <p className="text-[var(--color-text-muted)] text-sm">
                他のプレイヤーの投票を待っています...
              </p>
            </div>
          ) : (
            <SkipLink label="投票スキップ" onClick={() => setConfirmTarget("skip")} />
          )}
        </div>
      </div>

      {detailRole && (
        <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />
      )}

      {/* Confirm Modal */}
      {confirmTarget && (
        <ConfirmModal
          title={confirmTarget === "skip" ? "投票をスキップしますか？" : `${confirmTarget.name}に投票しますか？`}
          targets={confirmTarget === "skip" ? [] : [{ name: confirmTarget.name }]}
          confirmLabel={confirmTarget === "skip" ? "スキップ" : "投票する"}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
          isSubmitting={isSubmitting}
        />
      )}

      {showRoleConfig && (
        <RoleConfigModal roles={[...gameState.config.roles]} onClose={() => setShowRoleConfig(false)} />
      )}
    </div>
  );
}
