"use client";

import { useState } from "react";
import type { ClientGameState, Player } from "@/lib/game";
import { submitVoteAction } from "@/actions";

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
  const [hasVoted, setHasVoted] = useState(false);

  const otherPlayers = gameState.players.filter((p) => p.id !== currentPlayerId);
  const votedCount = gameState.votedPlayers?.length ?? 0;
  const totalPlayers = gameState.players.length;

  const handleVote = async () => {
    if (!selectedTarget) return;

    setIsSubmitting(true);
    try {
      const result = await submitVoteAction(roomId, selectedTarget);
      if (result.success) {
        setHasVoted(true);
      } else {
        console.error("Failed to submit vote:", result.error);
      }
    } catch (error) {
      console.error("Error submitting vote:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-red-600 p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">投票フェーズ</h1>
          <p className="text-orange-100">
            処刑したいプレイヤーに投票してください
          </p>
          <div className="mt-4 text-white">
            投票済み: {votedCount} / {totalPlayers}
          </div>
        </div>

        {hasVoted ? (
          /* 投票済み表示 */
          <div className="bg-white/20 backdrop-blur rounded-xl p-8 text-center">
            <div className="text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-white mb-2">投票完了</h2>
            <p className="text-orange-100">
              他のプレイヤーの投票を待っています...
            </p>
            <div className="mt-6">
              <div className="w-full bg-white/20 rounded-full h-3">
                <div
                  className="bg-white rounded-full h-3 transition-all duration-500"
                  style={{ width: `${(votedCount / totalPlayers) * 100}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          /* 投票UI */
          <>
            <div className="bg-white/20 backdrop-blur rounded-xl p-6 mb-6">
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
                        ? "bg-red-500 border-2 border-white"
                        : "bg-white/10 hover:bg-white/20 border-2 border-transparent"
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
              className="w-full py-4 bg-red-700 hover:bg-red-800 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white font-bold text-lg transition-colors"
            >
              {isSubmitting ? "投票中..." : "投票する"}
            </button>

            <p className="text-center text-orange-100 mt-4 text-sm">
              ※ 投票は取り消せません
            </p>
          </>
        )}

        {/* 投票状況 */}
        <div className="mt-8 bg-white/20 backdrop-blur rounded-xl p-6">
          <h2 className="text-lg font-semibold text-white mb-4">投票状況</h2>
          <div className="grid grid-cols-2 gap-3">
            {gameState.players.map((player: Player) => {
              const voted = gameState.votedPlayers?.includes(player.id);
              return (
                <div
                  key={player.id}
                  className={`p-3 rounded-lg flex items-center justify-between ${
                    player.id === currentPlayerId
                      ? "bg-orange-500/50"
                      : "bg-white/10"
                  }`}
                >
                  <span className="text-white">{player.name}</span>
                  {voted ? (
                    <span className="text-green-300">✓</span>
                  ) : (
                    <span className="text-orange-200">...</span>
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
