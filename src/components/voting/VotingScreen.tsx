"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import type { Role } from "@/lib/game";
import { SKIP_VOTE, buildRevealedInfo } from "@/lib/game";
import type { ClientRoomState } from "@/lib/room";
import { PlayerCard } from "../common/PlayerCard";
import { PlayerRoleDisplay } from "../common/PlayerRoleDisplay";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { RoleConfigModal } from "../common/RoleConfigModal";
import { OtherPlayersDivider } from "../common/OtherPlayersDivider";
import { ConfirmModal } from "../common/ConfirmModal";
import { SkipLink } from "../common/SkipLink";
import { VoteTargetBadge } from "../common/VoteTargetBadge";
import { PhaseProgressBar } from "../common/PhaseProgressBar";


interface VotingScreenProps {
  roomState: ClientRoomState;
  playerId: string;
  roomId: string;
  onSubmitVote: (targetId: string) => Promise<{ success: boolean; error?: string }>;
  onAutoVote: () => Promise<{ success: boolean; error?: string }>;
}

export function VotingScreen({ roomState, playerId, roomId, onSubmitVote, onAutoVote }: VotingScreenProps) {
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string; role?: Role } | "skip" | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [showRoleConfig, setShowRoleConfig] = useState(false);

  const game = roomState.game!;
  const votedCount = game.votedPlayers?.length ?? 0;
  const totalPlayers = game.players.length;
  const hasVoted = game.votedPlayers?.includes(playerId) ?? false;

  const votingDuration = roomState.config.votingDuration;
  const phaseStartedAt = game.phaseStartedAt;

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
  const revealedInfo = buildRevealedInfo(game.actionResults);

  const sortedPlayers = [...game.players].sort((a, b) =>
    a.id === playerId ? -1 : b.id === playerId ? 1 : 0
  );

  return (
    <div className="flex flex-col h-dvh overflow-hidden game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="pt-8 pb-4 px-4 text-center relative">
          <PhaseProgressBar currentPhase="VOTING" />
          <button
            onClick={() => setShowRoleConfig(true)}
            className="absolute top-8 right-4 w-9 h-9 rounded-full glass-panel flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            aria-label="役職構成"
          >
            <span className="material-icons text-xl">groups</span>
          </button>
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-2">
            VOTING PHASE
          </h1>
          <div key={isTimeLow ? "low" : "normal"} className={`text-5xl font-bold mb-4 font-[family-name:var(--font-display)] ${
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
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4 ">
          {sortedPlayers.map((player, index) => {
            const isCurrentPlayer = player.id === playerId;
            const playerHasVoted = game.votedPlayers?.includes(player.id) ?? false;

            const cardOnClick = (!isCurrentPlayer && !hasVoted)
              ? () => setConfirmTarget({ id: player.id, name: player.name, role: revealedInfo.players[player.id] })
              : undefined;

            // 自分の投票先を表示（自分のカードのみ）
            const myVoteTarget = isCurrentPlayer && game.myVote
              ? (game.myVote !== SKIP_VOTE
                  ? game.players.find(p => p.id === game.myVote)
                  : null)
              : undefined;

            return (
              <Fragment key={player.id}>
                {index === 1 && <OtherPlayersDivider />}
                <PlayerCard
                  playerName={player.name}
                  isCurrentPlayer={isCurrentPlayer}
                  onClick={cardOnClick}
                  statusBadges={playerHasVoted ? (
                    <div className="text-xs space-x-2">
                      <span className="text-[var(--color-ready)] font-bold">
                        <span className="material-icons text-sm align-middle">check</span>
                        {" "}投票済み
                      </span>
                      {isCurrentPlayer && game.myVote && (
                        <VoteTargetBadge targetName={myVoteTarget?.name ?? null} />
                      )}
                    </div>
                  ) : undefined}
                >
                  <PlayerRoleDisplay
                    playerId={player.id}
                    currentPlayerId={playerId}
                    gameState={game}
                    tappable={!isCurrentPlayer && !hasVoted}
                    onRoleClick={setDetailRole}
                  />
                </PlayerCard>
              </Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 pb-4 pt-8 -mt-8 relative z-10 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent">
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
          targets={confirmTarget === "skip" ? [] : [{ name: confirmTarget.name, role: confirmTarget.role }]}
          confirmLabel={confirmTarget === "skip" ? "スキップ" : "投票する"}
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
          isSubmitting={isSubmitting}
        />
      )}

      {showRoleConfig && (
        <RoleConfigModal config={roomState.config} onClose={() => setShowRoleConfig(false)} />
      )}
    </div>
  );
}
