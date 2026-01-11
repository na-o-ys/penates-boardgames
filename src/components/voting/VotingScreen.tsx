"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientGameState, Player } from "@/lib/game";
import { submitVoteAction, autoVoteAction } from "@/actions";

interface VotingScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onRefresh: () => void;
}

export function VotingScreen({ gameState, playerId, roomId }: VotingScreenProps) {
  const currentPlayerId = playerId;
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const otherPlayers = gameState.players.filter((p) => p.id !== currentPlayerId);
  const votedCount = gameState.votedPlayers?.length ?? 0;
  const totalPlayers = gameState.players.length;
  const hasVoted = gameState.votedPlayers?.includes(playerId) ?? false;

  const votingDuration = gameState.config.votingDuration;
  const phaseStartedAt = gameState.phaseStartedAt;

  // phaseStartedAtから残り時間を計算
  const calculateTimeLeft = useCallback(() => {
    if (!phaseStartedAt) return votingDuration;
    const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000);
    return Math.max(0, votingDuration - elapsed);
  }, [phaseStartedAt, votingDuration]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    // phaseStartedAtが変わったら再計算
    setTimeLeft(calculateTimeLeft());
  }, [calculateTimeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, calculateTimeLeft]);

  // タイマー終了時の自動投票
  useEffect(() => {
    if (timeLeft <= 0 && !hasVoted) {
      autoVoteAction(roomId, playerId).catch(console.error);
    }
  }, [timeLeft, hasVoted, roomId, playerId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleVote = async () => {
    if (!selectedTarget) return;

    setIsSubmitting(true);
    try {
      const result = await submitVoteAction(roomId, playerId, selectedTarget);
      if (!result.success) {
        console.error("Failed to submit vote:", result.error);
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-bold text-white mb-2">🗳️ 投票フェーズ</h1>
          <div className="text-5xl font-bold text-white mb-4">
            {formatTime(timeLeft)}
          </div>
          <p className="text-gray-400">
            処刑したいプレイヤーに投票してください
          </p>
          <div className="mt-4 text-white">
            投票済み: {votedCount} / {totalPlayers}
          </div>
        </div>

        {hasVoted ? (
          /* 投票済み表示 */
          <div className="bg-gray-800 rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-2">投票済み</h2>
            <p className="text-gray-400">
              他のプレイヤーの投票を待っています...
            </p>
            <div className="mt-6">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div
                  className="bg-slate-500 rounded-full h-3 transition-all duration-500"
                  style={{ width: `${(votedCount / totalPlayers) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 投票UI */
          <>
            <div className="bg-gray-800 rounded-xl p-6 mb-6">
              <h2 className="text-lg font-semibold text-white mb-4">
                誰を処刑しますか？
              </h2>
              <div className="space-y-3">
                {otherPlayers.map((player: Player) => (
                  <button
                    key={player.id}
                    onClick={() => setSelectedTarget(player.id)}
                    className={`w-full p-4 rounded-lg text-left transition-all ${
                      selectedTarget === player.id
                        ? "bg-slate-600 border-2 border-slate-400"
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
              onClick={handleVote}
              disabled={!selectedTarget || isSubmitting}
              className="w-full py-4 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold text-lg transition-colors"
            >
              {isSubmitting ? "投票中..." : "投票する"}
            </button>

            <p className="text-center text-gray-400 mt-4 text-sm">
              ※ 投票は取り消せません
            </p>
          </>
        )}

        {/* 投票状況 */}
        <div className="mt-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">投票状況</h2>
          <div className="grid grid-cols-2 gap-3">
            {gameState.players.map((player: Player) => {
              const voted = gameState.votedPlayers?.includes(player.id);
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    player.id === currentPlayerId
                      ? "bg-slate-700 border border-slate-500"
                      : "bg-gray-700"
                  }`}
                >
                  <span className="text-white">{player.name}</span>
                  {voted ? (
                    <span className="text-green-400">✓</span>
                  ) : (
                    <span className="text-gray-500">...</span>
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
