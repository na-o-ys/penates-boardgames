"use client";

import type { ClientGameState, Player, Role, Team } from "@/lib/game";
import { ROLE_NAMES, getSwapReason } from "@/lib/game";
import { useState } from "react";
import { RoleMiniCard, UnknownMiniCard } from "../common/RoleMiniCard";
import { PlayerCard } from "../common/PlayerCard";
import { CemeterySection } from "../common/CemeterySection";

interface ResultScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onPlayAgain: () => Promise<{ success: boolean; error?: string }>;
}

const TEAM_NAMES: Record<Team, string> = {
  VILLAGE: "村人陣営",
  WEREWOLF: "人狼陣営",
  TANNER: "吊人",
};

export function ResultScreen({ gameState, playerId, roomId, onPlayAgain }: ResultScreenProps) {
  const currentPlayerId = playerId;
  const [isResetting, setIsResetting] = useState(false);

  const isHost = gameState.players[0]?.id === currentPlayerId;

  const winningTeam = gameState.winningTeam;
  const winners = gameState.winners ?? [];
  const executedPlayerIds = gameState.executedPlayerIds ?? [];
  const initialRoles = gameState.initialRoles ?? {};
  const finalRoles = gameState.finalRoles ?? {};
  const allActions = gameState.allActions ?? [];

  const isWinner = winners.includes(currentPlayerId);

  const sortedPlayers = [...gameState.players].sort((a, b) =>
    a.id === currentPlayerId ? -1 : b.id === currentPlayerId ? 1 : 0
  );

  const centerRoles: Record<string, Role | undefined> = {
    CENTER_0: finalRoles["CENTER_0"] as Role | undefined,
    CENTER_1: finalRoles["CENTER_1"] as Role | undefined,
  };

  const handlePlayAgain = async () => {
    setIsResetting(true);
    try {
      const result = await onPlayAgain();
      if (!result.success) {
        console.error("Failed to reset game:", result.error);
      }
    } catch (error) {
      console.error("Error resetting game:", error);
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* ヘッダー */}
        <div className="pt-8 pb-4 text-center">
          <h1
            className={`font-[family-name:var(--font-display)] font-black tracking-wider mb-2 ${
              isWinner ? "text-4xl gold-text" : "text-3xl text-[var(--color-text-secondary)]"
            }`}
          >
            {isWinner ? "WIN!" : "LOSE..."}
          </h1>
          {winningTeam ? (
            <p className="text-sm text-[var(--color-text-secondary)]">
              {TEAM_NAMES[winningTeam]}の勝利
            </p>
          ) : (
            <p className="text-sm text-[var(--color-text-secondary)]">
              引き分け（勝者なし）
            </p>
          )}
        </div>

        {/* プレイヤーカード (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
          {sortedPlayers.map((player: Player) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isPlayerWinner = winners.includes(player.id);
            const isExecuted = executedPlayerIds.includes(player.id);
            const isHunterVictim = Object.values(
              gameState.hunterRevengeTargets ?? {}
            ).includes(player.id);

            const initRole = initialRoles[player.id];
            const finalRole = finalRoles[player.id];
            const roleChanged = initRole && finalRole && initRole !== finalRole;
            const swapReason = roleChanged
              ? getSwapReason(player.id, allActions, gameState.players)
              : null;

            return (
              <PlayerCard
                key={player.id}
                playerName={player.name}
                isCurrentPlayer={isCurrentPlayer}
                highlight={isPlayerWinner}
                leftIndicator={
                  isExecuted ? (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-error)] rounded-l-xl" />
                  ) : undefined
                }
                statusBadges={
                  <div className="text-xs space-x-2">
                    {isExecuted && (
                      <span className="text-[var(--color-error)] font-bold">処刑</span>
                    )}
                    {isHunterVictim && (
                      <span className="text-[var(--color-error)] font-bold">道連れ</span>
                    )}
                    {isPlayerWinner && (
                      <span className="text-[var(--color-ready)] font-bold">勝者</span>
                    )}
                    {roleChanged && swapReason && (
                      <span className="text-yellow-500">
                        <span className="material-icons text-sm align-middle animate-pulse">sync_alt</span>
                        {" "}{swapReason}
                      </span>
                    )}
                  </div>
                }
              >
                {roleChanged && initRole ? (
                  <>
                    <div className="opacity-50 grayscale scale-90">
                      <RoleMiniCard role={initRole} size="small" />
                    </div>
                    <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
                  </>
                ) : null}
                {finalRole ? (
                  <RoleMiniCard role={finalRole} size="medium" />
                ) : (
                  <UnknownMiniCard />
                )}
              </PlayerCard>
            );
          })}

          <CemeterySection centerRoles={centerRoles} />
        </div>

        {/* 固定フッター */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent z-20 max-w-md mx-auto">
          {isHost ? (
            <button
              onClick={handlePlayAgain}
              disabled={isResetting}
              className="w-full py-3 btn-primary rounded-lg text-lg font-[family-name:var(--font-display)] tracking-wider flex items-center justify-center gap-1"
            >
              <span className="material-icons text-sm">replay</span>
              {isResetting ? "準備中..." : "もう一度遊ぶ"}
            </button>
          ) : (
            <p className="text-center text-[var(--color-text-muted)] py-3">
              ホストが次のゲームを開始するのを待っています...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
