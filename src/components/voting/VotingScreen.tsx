"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientGameState, Player } from "@/lib/game";
import { SKIP_VOTE } from "@/lib/game";

interface VotingScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onSubmitVote: (targetId: string) => Promise<{ success: boolean; error?: string }>;
  onAutoVote: () => Promise<{ success: boolean; error?: string }>;
}

export function VotingScreen({ gameState, playerId, roomId, onSubmitVote, onAutoVote }: VotingScreenProps) {
  const currentPlayerId = playerId;
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherPlayers = gameState.players.filter((p) => p.id !== currentPlayerId);
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

  const handleVote = async () => {
    if (!selectedTarget) return;

    setIsSubmitting(true);
    try {
      const result = await onSubmitVote(selectedTarget);
      if (!result.success) {
        console.error("Failed to submit vote:", result.error);
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isTimeLow = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="min-h-screen game-overlay p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 pt-4">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-2">
            投票フェーズ
          </h1>
          <div className={`text-5xl font-bold mb-4 ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "gold-text"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[var(--color-text-secondary)]">
            処刑したいプレイヤーに投票してください
          </p>
          <div className="mt-3 text-sm text-[var(--color-text-muted)]">
            投票済み: {votedCount} / {totalPlayers}
          </div>
        </div>

        {hasVoted ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <div className="text-4xl mb-4 text-[var(--color-ready)]">✓</div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white mb-2">投票済み</h2>
            <p className="text-[var(--color-text-secondary)]">
              他のプレイヤーの投票を待っています...
            </p>
            <div className="mt-6">
              <div className="w-full bg-black/30 rounded-full h-3">
                <div
                  className="bg-[var(--color-primary)] rounded-full h-3 transition-all duration-500"
                  style={{ width: `${(votedCount / totalPlayers) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="glass-card rounded-xl p-6 mb-6">
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">
                誰を処刑しますか？
              </h2>
              <div className="space-y-3">
                {otherPlayers.map((player: Player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedTarget(player.id)}
                    className={`w-full p-4 rounded-xl text-left transition-all ${
                      selectedTarget === player.id
                        ? "glass-card card-highlight"
                        : "glass-panel hover:border-[var(--color-text-muted)]"
                    }`}
                  >
                    <span className="text-white font-medium text-lg">
                      {player.name}
                    </span>
                  </button>
                ))}
                <button
                  onClick={() => setSelectedTarget(SKIP_VOTE)}
                  className={`w-full p-4 rounded-xl text-left transition-all ${
                    selectedTarget === SKIP_VOTE
                      ? "glass-card border-[var(--color-text-muted)]"
                      : "glass-panel hover:border-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="text-[var(--color-text-secondary)] font-medium text-lg">
                    投票しない（スキップ）
                  </span>
                </button>
              </div>
            </div>

            <button
              onClick={handleVote}
              disabled={!selectedTarget || isSubmitting}
              className="w-full py-4 btn-primary rounded-xl text-lg font-[family-name:var(--font-display)] tracking-wider"
            >
              {isSubmitting ? "投票中..." : "投票する"}
            </button>

            <p className="text-center text-[var(--color-text-muted)] mt-4 text-xs">
              ※ 投票は取り消せません
            </p>
          </>
        )}

        {/* 投票状況 */}
        <div className="mt-8 glass-card rounded-xl p-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">投票状況</h2>
          <div className="grid grid-cols-2 gap-3">
            {gameState.players.map((player: Player) => {
              const voted = gameState.votedPlayers?.includes(player.id);
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-xl flex items-center justify-between ${
                    player.id === currentPlayerId
                      ? "glass-card card-highlight"
                      : "glass-panel"
                  }`}
                >
                  <span className="text-white text-sm">{player.name}</span>
                  {voted ? (
                    <span className="text-[var(--color-ready)]">✓</span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">...</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
