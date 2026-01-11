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

  // 選択済みの狩人数をカウント
  const chosenCount = Object.values(gameState.hunterRevengeChosen ?? {}).filter(
    Boolean
  ).length;
  const totalHunters = executedHunterIds.length;

  const phaseStartedAt = gameState.phaseStartedAt;

  // phaseStartedAtから残り時間を計算
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

  // タイマー終了時の自動道連れ（処刑された狩人のみ）
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

  // 処刑された狩人の名前リストを取得
  const getExecutedHunterNames = () => {
    return executedHunterIds
      .map((id: PlayerId) => gameState.players.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join("、");
  };

  // 自分が処刑された狩人でない、または既に選択済みの場合は待機画面
  if (!isExecutedHunter || hasChosen) {
    return (
      <div className="min-h-screen game-overlay p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 pt-4">
            <h1 className="text-3xl font-bold text-red-400 mb-2">
              狩人の道連れ
            </h1>
            <div className="text-5xl font-bold text-white mb-4">
              {formatTime(timeLeft)}
            </div>
            <p className="text-gray-400">
              処刑された狩人が道連れを選択中です...
            </p>
          </div>

          <div className="glass-card rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">...</div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {hasChosen ? "選択完了" : "待機中"}
            </h2>
            <p className="text-gray-400">
              {getExecutedHunterNames()} が道連れを選んでいます
            </p>
            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-red-500 rounded-full h-3 transition-all duration-500"
                  style={{
                    width: `${(chosenCount / Math.max(totalHunters, 1)) * 100}%`,
                  }}
                />
              </div>
              <div className="text-white mt-2">
                選択済み: {chosenCount} / {totalHunters}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 狩人の道連れ選択UI
  const otherPlayers = gameState.players.filter((p) => p.id !== playerId);

  return (
    <div className="min-h-screen game-overlay p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-bold text-red-500 mb-2">
            道連れを選択
          </h1>
          <div className="text-5xl font-bold text-red-400 mb-4">
            {formatTime(timeLeft)}
          </div>
          <p className="text-gray-300">
            あなたは処刑されました。誰かを道連れにしてください。
          </p>
        </div>

        {/* 道連れ選択UI */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">
            誰を道連れにしますか？
          </h2>
          <div className="space-y-3">
            {otherPlayers.map((player: Player) => (
              <button
                key={player.id}
                onClick={() => setSelectedTarget(player.id)}
                className={`w-full p-4 rounded-lg text-left transition-all ${
                  selectedTarget === player.id
                    ? "bg-red-600 border-2 border-red-400"
                    : "bg-gray-700 hover:bg-gray-600 border-2 border-transparent"
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
          className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold text-lg transition-colors"
        >
          {isSubmitting ? "送信中..." : "道連れにする"}
        </button>

        <p className="text-center text-gray-400 mt-4 text-sm">
          ※ 必ず誰かを選択してください（時間切れでランダム選択）
        </p>
      </div>
    </div>
  );
}
