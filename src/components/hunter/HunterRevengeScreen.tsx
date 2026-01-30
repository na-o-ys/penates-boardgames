"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import type { PlayerId, Role } from "@/lib/game";
import { SKIP_VOTE } from "@/lib/game";
import type { ClientRoomState } from "@/lib/room";
import { PlayerCard } from "../common/PlayerCard";
import { OtherPlayersDivider } from "../common/OtherPlayersDivider";
import { PlayerRoleDisplay } from "../common/PlayerRoleDisplay";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { RoleConfigModal } from "../common/RoleConfigModal";
import { ConfirmModal } from "../common/ConfirmModal";
import { VoteTargetBadge } from "../common/VoteTargetBadge";

const HUNTER_REVENGE_DURATION = 30;

interface HunterRevengeScreenProps {
  roomState: ClientRoomState;
  playerId: string;
  roomId: string;
  onSubmitRevenge: (targetId: string) => Promise<{ success: boolean; error?: string }>;
  onAutoRevenge: () => Promise<{ success: boolean; error?: string }>;
}

export function HunterRevengeScreen({
  roomState,
  playerId,
  roomId,
  onSubmitRevenge,
  onAutoRevenge,
}: HunterRevengeScreenProps) {
  const [confirmTarget, setConfirmTarget] = useState<{ id: string; name: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [showRoleConfig, setShowRoleConfig] = useState(false);

  const game = roomState.game!;
  const isExecutedHunter = game.isExecutedHunter ?? false;
  const hasChosen = game.hunterRevengeChosen?.[playerId] ?? false;
  const executedHunterIds = game.executedHunterIds ?? [];

  const chosenCount = Object.values(game.hunterRevengeChosen ?? {}).filter(
    Boolean
  ).length;
  const totalHunters = executedHunterIds.length;

  const phaseStartedAt = game.phaseStartedAt;

  const calculateTimeLeft = useCallback(() => {
    if (!phaseStartedAt) return HUNTER_REVENGE_DURATION;
    const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000);
    return Math.max(0, HUNTER_REVENGE_DURATION - elapsed);
  }, [phaseStartedAt]);

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
    if (timeLeft <= 0 && isExecutedHunter && !hasChosen) {
      onAutoRevenge().catch(console.error);
    }
  }, [timeLeft, isExecutedHunter, hasChosen, onAutoRevenge]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleConfirm = async () => {
    if (!confirmTarget) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onSubmitRevenge(confirmTarget.id);
      if (!result.success) {
        setError(result.error ?? "道連れの送信に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
      setConfirmTarget(null);
    }
  };

  const getExecutedHunterNames = () => {
    return executedHunterIds
      .map((id: PlayerId) => game.players.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join("、");
  };

  const isTimeLow = timeLeft <= 10 && timeLeft > 0;
  const canSelect = isExecutedHunter && !hasChosen;

  const sortedPlayers = [...game.players].sort((a, b) =>
    a.id === playerId ? -1 : b.id === playerId ? 1 : 0
  );

  const getInstructionText = (): string => {
    if (canSelect) {
      return "あなたは処刑されました。道連れにするプレイヤーを選択してください。";
    }
    return "処刑された狩人が道連れを選択中です...";
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="pt-8 pb-4 px-4 text-center relative">
          <button
            onClick={() => setShowRoleConfig(true)}
            className="absolute top-8 right-4 w-9 h-9 rounded-full glass-panel flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            aria-label="役職構成"
          >
            <span className="material-icons text-xl">groups</span>
          </button>
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl text-[var(--color-error)] mb-2">
            狩人の道連れ
          </h1>
          <div className={`text-5xl font-bold mb-4 font-[family-name:var(--font-display)] ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "text-white"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[var(--color-text-secondary)] text-sm">
            {getInstructionText()}
          </p>
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

            const cardOnClick = (!isCurrentPlayer && canSelect)
              ? () => setConfirmTarget({ id: player.id, name: player.name })
              : undefined;

            const voteTarget = game.allVotes?.[player.id];
            const voteTargetPlayer = voteTarget && voteTarget !== SKIP_VOTE
              ? game.players.find(p => p.id === voteTarget)
              : null;

            return (
              <Fragment key={player.id}>
                {index === 1 && <OtherPlayersDivider />}
                <PlayerCard
                  playerName={player.name}
                  isCurrentPlayer={isCurrentPlayer}
                  onClick={cardOnClick}
                  statusBadges={voteTarget ? (
                    <div className="text-xs">
                      <VoteTargetBadge targetName={voteTargetPlayer?.name ?? null} />
                    </div>
                  ) : undefined}
                >
                  <PlayerRoleDisplay
                    playerId={player.id}
                    currentPlayerId={playerId}
                    gameState={game}
                    tappable={canSelect && !isCurrentPlayer}
                    onRoleClick={setDetailRole}
                  />
                </PlayerCard>
              </Fragment>
            );
          })}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 pb-4 pt-8 -mt-8 relative z-10 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent">
          {canSelect ? (
            <p className="text-center text-[var(--color-text-muted)] py-3 text-xs">
              ※ 必ず誰かを選択してください（時間切れでランダム選択）
            </p>
          ) : (
            <div className="text-center py-3">
              <div className="w-full bg-black/30 rounded-full h-2 mb-2">
                <div
                  className="bg-[var(--color-error)] rounded-full h-2 transition-all duration-500"
                  style={{ width: `${(chosenCount / Math.max(totalHunters, 1)) * 100}%` }}
                />
              </div>
              <p className="text-[var(--color-text-muted)] text-sm">
                {hasChosen ? "選択完了" : `${getExecutedHunterNames()} が道連れを選んでいます`}
                {" "}({chosenCount} / {totalHunters})
              </p>
            </div>
          )}
        </div>
      </div>

      {detailRole && (
        <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />
      )}

      {/* Confirm Modal */}
      {confirmTarget && (
        <ConfirmModal
          title={`${confirmTarget.name}を道連れにしますか？`}
          targets={[{ name: confirmTarget.name }]}
          confirmLabel="道連れにする"
          onConfirm={handleConfirm}
          onCancel={() => setConfirmTarget(null)}
          isSubmitting={isSubmitting}
          variant="danger"
        />
      )}

      {showRoleConfig && (
        <RoleConfigModal roles={[...roomState.config.roles]} onClose={() => setShowRoleConfig(false)} />
      )}
    </div>
  );
}
