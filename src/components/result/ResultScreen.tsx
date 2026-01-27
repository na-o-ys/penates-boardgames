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

export function ResultScreen({ gameState, playerId, roomId }: ResultScreenProps) {
  const currentPlayerId = playerId;
  const [isResetting, setIsResetting] = useState(false);

  const isHost = gameState.players[0]?.id === currentPlayerId;

  const winningTeam = gameState.winningTeam;
  const winners = gameState.winners ?? [];
  const executedPlayerIds = gameState.executedPlayerIds ?? [];

  const isWinner = winners.includes(currentPlayerId);

  const handlePlayAgain = async () => {
    setIsResetting(true);
    try {
      const resetResult = await resetGameAction(roomId, playerId);
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
    <div className="min-h-screen game-overlay p-4">
      <div className="max-w-md mx-auto">
        {/* 勝敗表示 */}
        <div className="text-center mb-8 pt-8">
          <h1 className={`font-[family-name:var(--font-display)] font-black tracking-wider mb-2 ${
            isWinner ? "text-5xl gold-text" : "text-4xl text-[var(--color-text-secondary)]"
          }`}>
            {isWinner ? "勝利！" : "敗北..."}
          </h1>
          {winningTeam ? (
            <p className="text-lg text-[var(--color-text-secondary)]">
              {TEAM_NAMES[winningTeam]}の勝利
            </p>
          ) : (
            <p className="text-lg text-[var(--color-text-secondary)]">
              引き分け（勝者なし）
            </p>
          )}
        </div>

        {/* 処刑されたプレイヤー */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">処刑結果</h2>
          {executedPlayerIds.length === 0 ? (
            <p className="text-[var(--color-text-muted)] text-center">誰も処刑されませんでした</p>
          ) : (
            <div className="space-y-2">
              {executedPlayerIds.map((execPlayerId: PlayerId) => {
                const player = gameState.players.find((p) => p.id === execPlayerId);
                const role = gameState.finalRoles?.[execPlayerId];
                const isHunterVictim = Object.values(
                  gameState.hunterRevengeTargets ?? {}
                ).includes(execPlayerId);

                return (
                  <div
                    key={execPlayerId}
                    className="flex items-center justify-between bg-[var(--color-error)]/20 border border-[var(--color-error)]/30 p-3 rounded-xl"
                  >
                    <span className="text-white font-medium flex items-center gap-2">
                      {player?.name ?? "不明"}
                      {isHunterVictim && (
                        <span className="text-xs bg-[var(--color-error)]/40 px-2 py-0.5 rounded-lg text-[var(--color-error)] font-semibold">
                          道連れ
                        </span>
                      )}
                    </span>
                    <span className="text-[var(--color-error)]">
                      {role ? ROLE_NAMES[role] : "不明"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 全員の役職公開 */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">最終役職</h2>
          <div className="space-y-4">
            {gameState.players.map((player: Player) => {
              const finalRole = gameState.finalRoles?.[player.id];
              const isCurrentPlayer = player.id === currentPlayerId;
              const isPlayerWinner = winners.includes(player.id);

              return (
                <div
                  key={player.id}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    isCurrentPlayer
                      ? "glass-card card-highlight"
                      : "glass-panel"
                  }`}
                >
                  <RoleCard role={finalRole ?? null} small />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-medium text-lg">
                        {player.name}
                      </span>
                      {isCurrentPlayer && (
                        <span className="text-xs bg-[var(--color-primary)]/20 px-2 py-0.5 rounded-lg text-[var(--color-primary)] font-semibold">
                          あなた
                        </span>
                      )}
                      {isPlayerWinner && (
                        <span className="text-xs bg-[var(--color-ready)]/20 px-2 py-0.5 rounded-lg text-[var(--color-ready)] font-semibold">
                          勝者
                        </span>
                      )}
                    </div>
                    <div className="text-[var(--color-text-secondary)] text-sm">
                      {finalRole ? ROLE_NAMES[finalRole] : "不明"}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 中央カード */}
        {gameState.finalRoles && (
          <div className="glass-card rounded-xl p-6 mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">中央カード</h2>
            <div className="flex justify-center gap-4">
              {["CENTER_0", "CENTER_1"].map((centerId, index) => {
                const role = gameState.finalRoles?.[centerId] as Role | undefined;
                return (
                  <div key={centerId} className="text-center">
                    <RoleCard role={role ?? null} small />
                    <p className="text-[var(--color-text-muted)] text-sm mt-2">
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
            className="w-full py-4 btn-primary rounded-xl text-lg font-[family-name:var(--font-display)] tracking-wider"
          >
            {isResetting ? "準備中..." : "もう一度遊ぶ"}
          </button>
        ) : (
          <p className="text-center text-[var(--color-text-muted)]">
            ホストが次のゲームを開始するのを待っています...
          </p>
        )}
      </div>
    </div>
  );
}
