"use client";

import type { ClientGameState, Player, Role, Team } from "@/lib/game";
import { getSwapReason, SKIP_VOTE } from "@/lib/game";
import { useState, Fragment } from "react";
import { RoleMiniCard, UnknownMiniCard } from "../common/RoleMiniCard";
import { PlayerCard } from "../common/PlayerCard";
import { CemeterySection } from "../common/CemeterySection";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { PlayerStatsModal } from "../common/PlayerStatsModal";
import { OtherPlayersDivider } from "../common/OtherPlayersDivider";
import { VoteTargetBadge } from "../common/VoteTargetBadge";

interface ResultScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onMarkReady: () => Promise<{ success: boolean; error?: string }>;
}

const TEAM_NAMES: Record<Team, string> = {
  VILLAGE: "村人陣営",
  WEREWOLF: "人狼陣営",
  MINORITY: "吊人",
};

export function ResultScreen({ gameState, playerId, roomId, onMarkReady }: ResultScreenProps) {
  const currentPlayerId = playerId;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [showStats, setShowStats] = useState(false);

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

  const handleMarkReady = async () => {
    setIsSubmitting(true);
    try {
      const result = await onMarkReady();
      if (!result.success) {
        console.error("Failed to mark ready:", result.error);
      }
    } catch (error) {
      console.error("Error marking ready:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* ヘッダー */}
        <div className="pt-8 pb-4 text-center relative">
          <button
            onClick={() => setShowStats(true)}
            className="absolute top-8 right-4 w-9 h-9 rounded-full glass-panel flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            aria-label="プレイヤースタッツ"
          >
            <span className="material-icons text-xl">leaderboard</span>
          </button>
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
          {sortedPlayers.map((player: Player, index: number) => {
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

            const voteTarget = gameState.allVotes?.[player.id];
            const voteTargetPlayer = voteTarget && voteTarget !== SKIP_VOTE
              ? gameState.players.find(p => p.id === voteTarget)
              : null;

            return (
              <Fragment key={player.id}>
                {index === 1 && <OtherPlayersDivider />}
                <PlayerCard
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
                    {voteTarget && (
                      <VoteTargetBadge targetName={voteTargetPlayer?.name ?? null} />
                    )}
                  </div>
                }
              >
                {roleChanged && initRole ? (
                  <>
                    <div className="opacity-50 grayscale scale-90">
                      <RoleMiniCard role={initRole} size="small" onClick={() => setDetailRole(initRole)} />
                    </div>
                    <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
                  </>
                ) : null}
                {finalRole ? (
                  <RoleMiniCard role={finalRole} size="medium" onClick={() => setDetailRole(finalRole)} />
                ) : (
                  <UnknownMiniCard />
                )}
              </PlayerCard>
              </Fragment>
            );
          })}

          <CemeterySection centerRoles={centerRoles} />
        </div>

        {/* 固定フッター */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent z-20 max-w-md mx-auto">
          <button
            onClick={handleMarkReady}
            disabled={isSubmitting}
            className="w-full py-3 btn-primary rounded-lg tracking-wider flex items-center justify-center gap-1"
          >
            {isSubmitting ? "送信中..." : "確認した"}
          </button>
        </div>
      </div>

      {detailRole && (
        <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />
      )}

      {showStats && (
        <PlayerStatsModal
          players={gameState.players}
          playerStats={gameState.playerStats ?? {}}
          roomStats={gameState.roomStats ?? { gamesPlayed: 0, villageWins: 0, werewolfWins: 0, minorityWins: 0, draws: 0 }}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}
