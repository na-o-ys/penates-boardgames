"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientGameState, Player, PlayerId } from "@/lib/game";
import { submitHunterRevengeAction, autoHunterRevengeAction } from "@/actions";

const HUNTER_REVENGE_DURATION = 30;

interface HunterRevengeScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onRefresh: () => void;
}

export function HunterRevengeScreen({
  gameState,
  playerId,
  roomId,
}: HunterRevengeScreenProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isExecutedHunter = gameState.isExecutedHunter ?? false;
  const hasChosen = gameState.hunterRevengeChosen?.[playerId] ?? false;
  const executedHunterIds = gameState.executedHunterIds ?? [];

  const chosenCount = Object.values(gameState.hunterRevengeChosen ?? {}).filter(
    Boolean
  ).length;
  const totalHunters = executedHunterIds.length;

  const phaseStartedAt = gameState.phaseStartedAt;

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
      autoHunterRevengeAction(roomId, playerId).catch(console.error);
    }
  }, [timeLeft, isExecutedHunter, hasChosen, roomId, playerId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleConfirm = async () => {
    if (!selectedTarget) return;

    setIsSubmitting(true);
    try {
      const result = await submitHunterRevengeAction(
        roomId,
        playerId,
        selectedTarget
      );
      if (!result.success) {
        console.error("Failed to submit hunter revenge:", result.error);
      }
    } catch (error) {
      console.error("Error submitting hunter revenge:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getExecutedHunterNames = () => {
    return executedHunterIds
      .map((id: PlayerId) => gameState.players.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join("、");
  };

  const isTimeLow = timeLeft <= 10 && timeLeft > 0;

  if (!isExecutedHunter || hasChosen) {
    return (
      <div className="min-h-screen game-overlay p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center mb-8 pt-4">
            <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl text-[var(--color-error)] mb-2">
              狩人の道連れ
            </h1>
            <div className={`text-5xl font-bold mb-4 ${
              isTimeLow ? "text-[var(--color-error)] animate-pulse" : "text-white"
            }`}>
              {formatTime(timeLeft)}
            </div>
            <p className="text-[var(--color-text-secondary)]">
              処刑された狩人が道連れを選択中です...
            </p>
          </div>

          <div className="glass-card rounded-xl p-8 text-center">
            <div className="text-4xl mb-4 text-[var(--color-text-muted)]">...</div>
            <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold text-white mb-2">
              {hasChosen ? "選択完了" : "待機中"}
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              {getExecutedHunterNames()} が道連れを選んでいます
            </p>
            <div className="mt-6">
              <div className="w-full bg-black/30 rounded-full h-3">
                <div
                  className="bg-[var(--color-error)] rounded-full h-3 transition-all duration-500"
                  style={{
                    width: `${(chosenCount / Math.max(totalHunters, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="text-[var(--color-text-muted)] mt-2 text-sm">
                選択済み: {chosenCount} / {totalHunters}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const otherPlayers = gameState.players.filter((p) => p.id !== playerId);

  return (
    <div className="min-h-screen game-overlay p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 pt-4">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl text-[var(--color-error)] mb-2">
            道連れを選択
          </h1>
          <div className={`text-5xl font-bold mb-4 ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "text-[var(--color-error)]"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[var(--color-text-secondary)]">
            あなたは処刑されました。誰かを道連れにしてください。
          </p>
        </div>

        {/* 道連れ選択UI */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">
            誰を道連れにしますか？
          </h2>
          <div className="space-y-3">
            {otherPlayers.map((player: Player) => (
              <button
                key={player.id}
                onClick={() => setSelectedTarget(player.id)}
                className={`w-full p-4 rounded-xl text-left transition-all ${
                  selectedTarget === player.id
                    ? "glass-card border-2 border-[var(--color-error)] shadow-[0_0_15px_rgba(239,68,68,0.3)]"
                    : "glass-panel hover:border-[var(--color-text-muted)]"
                }`}
              >
                <span className="text-white font-medium text-lg">
                  {player.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleConfirm}
          disabled={!selectedTarget || isSubmitting}
          className="w-full py-4 bg-[var(--color-error)] hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl text-white font-bold text-lg transition-colors"
        >
          {isSubmitting ? "送信中..." : "道連れにする"}
        </button>

        <p className="text-center text-[var(--color-text-muted)] mt-4 text-xs">
          ※ 必ず誰かを選択してください（時間切れでランダム選択）
        </p>
      </div>
    </div>
  );
}
