"use client";

import type { ClientGameState, Player, Role, Team, PlayerId } from "@/lib/game";
import { ROLE_NAMES } from "@/lib/game";
import { resetGameAction } from "@/actions";
import { useState } from "react";
import { RoleCard } from "../night/RoleCard";

interface ResultScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onRefresh: () => void;
}

const TEAM_NAMES: Record<Team, string> = {
  VILLAGE: "村人陣営",
  WEREWOLF: "人狼陣営",
  TANNER: "吊人",
};

const TEAM_COLORS: Record<Team, string> = {
  VILLAGE: "from-green-500 to-green-700",
  WEREWOLF: "from-red-600 to-red-800",
  TANNER: "from-amber-600 to-amber-800",
};

export function ResultScreen({ gameState, playerId, roomId }: ResultScreenProps) {
  const currentPlayerId = playerId;
  const [isResetting, setIsResetting] = useState(false);

  const isHost = gameState.players[0]?.id === currentPlayerId;

  // ClientGameStateから結果情報を取得
  const winningTeam = gameState.winningTeam;
  const winners = gameState.winners ?? [];
  const executedPlayerIds = gameState.executedPlayerIds ?? [];

  const isWinner = winners.includes(currentPlayerId);

  const handlePlayAgain = async () => {
    setIsResetting(true);
    try {
      const resetResult = await resetGameAction(roomId);
      if (!resetResult.success) {
        console.error("Failed to reset game:", resetResult.error);
      }
    } catch (error) {
      console.error("Error resetting game:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-b ${
      winningTeam ? TEAM_COLORS[winningTeam] : "from-gray-600 to-gray-800"
    } p-4`}>
      <div className="max-w-2xl mx-auto">
        {/* 勝敗表示 */}
        <div className="text-center mb-8 pt-8">
          <div className="text-6xl mb-4">
            {isWinner ? "🎉" : "😢"}
          </div>
          <h1 className="text-4xl font-bold text-white mb-2">
            {isWinner ? "勝利！" : "敗北..."}
          </h1>
          {winningTeam ? (
            <p className="text-2xl text-white/90">
              {TEAM_NAMES[winningTeam]}の勝利
            </p>
          ) : (
            <p className="text-2xl text-white/90">
              引き分け（勝者なし）
            </p>
          )}
        </div>

        {/* 処刑されたプレイヤー */}
        <div className="bg-white/20 backdrop-blur rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">処刑結果</h2>
          {executedPlayerIds.length === 0 ? (
            <p className="text-white text-center">誰も処刑されませんでした</p>
          ) : (
            <div className="space-y-2">
              {executedPlayerIds.map((execPlayerId: PlayerId) => {
                const player = gameState.players.find((p) => p.id === execPlayerId);
                const role = gameState.finalRoles?.[execPlayerId];
                return (
                  <div
                    key={execPlayerId}
                    className="flex items-center justify-between bg-red-900/50 p-3 rounded-lg"
                  >
                    <span className="text-white font-medium">
                      {player?.name ?? "不明"}
                    </span>
                    <span className="text-red-200">
                      {role ? ROLE_NAMES[role] : "不明"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 全員の役職公開 */}
        <div className="bg-white/20 backdrop-blur rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">最終役職</h2>
          <div className="space-y-4">
            {gameState.players.map((player: Player) => {
              const finalRole = gameState.finalRoles?.[player.id];
              const isCurrentPlayer = player.id === currentPlayerId;
              const isPlayerWinner = winners.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-lg ${
                    isCurrentPlayer
                      ? "bg-white/30 border-2 border-white"
                      : "bg-white/10"
                  }`}
                >
                  <RoleCard role={finalRole ?? null} small />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-lg">
                        {player.name}
                      </span>
                      {isCurrentPlayer && (
                        <span className="text-xs bg-white/30 px-2 py-0.5 rounded text-white">
                          あなた
                        </span>
                      )}
                      {isPlayerWinner && (
                        <span className="text-xs bg-yellow-500 px-2 py-0.5 rounded text-white">
                          勝者
                        </span>
                      )}
                    </div>
                    <div className="text-white/80 text-sm">
                      {finalRole ? ROLE_NAMES[finalRole] : "不明"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 中央カードは最終役職から取得 */}
        {gameState.finalRoles && (
          <div className="bg-white/20 backdrop-blur rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">中央カード</h2>
            <div className="flex justify-center gap-4">
              {["CENTER_0", "CENTER_1"].map((centerId, index) => {
                const role = gameState.finalRoles?.[centerId] as Role | undefined;
                return (
                  <div key={centerId} className="text-center">
                    <RoleCard role={role ?? null} small />
                    <p className="text-white/80 text-sm mt-2">
                      中央{index + 1}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* もう一度遊ぶボタン */}
        {isHost ? (
          <button
            onClick={handlePlayAgain}
            disabled={isResetting}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-500 disabled:cursor-not-allowed rounded-lg text-white font-bold text-lg transition-colors"
          >
            {isResetting ? "準備中..." : "もう一度遊ぶ"}
          </button>
        ) : (
          <p className="text-center text-white/80">
            ホストが次のゲームを開始するのを待っています...
          </p>
        )}
      </div>
    </div>
  );
}
