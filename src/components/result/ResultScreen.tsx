"use client";

import type { Player, Role, Team } from "@/lib/game";
import { getSwapReason, countVotes } from "@/lib/game";
import type { ClientRoomState } from "@/lib/room";
import { useState, Fragment } from "react";
import { RoleMiniCard, UnknownMiniCard } from "../common/RoleMiniCard";
import { PlayerCard } from "../common/PlayerCard";
import { CemeterySection } from "../common/CemeterySection";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { PlayerStatsModal } from "../common/PlayerStatsModal";
import { OtherPlayersDivider } from "../common/OtherPlayersDivider";
import { VotesReceivedBadge } from "../common/VotesReceivedBadge";

interface ResultScreenProps {
  roomState: ClientRoomState;
  playerId: string;
  roomId: string;
  onReturnToLobby: () => void;
}

const TEAM_NAMES: Record<Team, string> = {
  VILLAGE: "村人陣営",
  WEREWOLF: "人狼陣営",
  MINORITY: "吊人",
};

export function ResultScreen({ roomState, playerId, roomId, onReturnToLobby }: ResultScreenProps) {
  const currentPlayerId = playerId;
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [showStats, setShowStats] = useState(false);

  const game = roomState.game!;
  const winningTeam = game.winningTeam;
  const winners = game.winners ?? [];
  const executedPlayerIds = game.executedPlayerIds ?? [];
  const initialRoles = game.initialRoles ?? {};
  const finalRoles = game.finalRoles ?? {};
  const allActions = game.allActions ?? [];

  const isWinner = winners.includes(currentPlayerId);

  const sortedPlayers = [...game.players].sort((a, b) =>
    a.id === currentPlayerId ? -1 : b.id === currentPlayerId ? 1 : 0
  );

  const centerRoles: Record<string, Role | undefined> = {
    CENTER_0: finalRoles["CENTER_0"] as Role | undefined,
    CENTER_1: finalRoles["CENTER_1"] as Role | undefined,
  };

  const votesReceived = game.allVotes && game.initialRoles
    ? countVotes(game.allVotes, game.initialRoles)
    : {};

  const handleReturnToLobby = () => {
    onReturnToLobby();
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 min-h-0">
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
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4 ">
          {sortedPlayers.map((player: Player, index: number) => {
            const isCurrentPlayer = player.id === currentPlayerId;
            const isPlayerWinner = winners.includes(player.id);
            const isExecuted = executedPlayerIds.includes(player.id);
            const isHunterVictim = Object.values(
              game.hunterRevengeTargets ?? {}
            ).includes(player.id);

            const initRole = initialRoles[player.id];
            const finalRole = finalRoles[player.id];
            const roleChanged = initRole && finalRole && initRole !== finalRole;
            const swapReason = roleChanged
              ? getSwapReason(player.id, allActions, game.players)
              : null;

            const received = votesReceived[player.id];
            const voterNames = received
              ? received.voterIds.map((id) => game.players.find((p) => p.id === id)?.name ?? "?")
              : [];

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
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs">
                    {isExecuted && (
                      <span className="whitespace-nowrap text-[var(--color-error)] font-bold">処刑</span>
                    )}
                    {isHunterVictim && (
                      <span className="whitespace-nowrap text-[var(--color-error)] font-bold">道連れ</span>
                    )}
                    {isPlayerWinner && (
                      <span className="whitespace-nowrap text-[var(--color-ready)] font-bold">勝者</span>
                    )}
                    {roleChanged && swapReason && (
                      <span className="whitespace-nowrap text-yellow-500">
                        <span className="material-icons text-sm align-middle animate-pulse">sync_alt</span>
                        {" "}{swapReason}
                      </span>
                    )}
                    {received && (
                      <VotesReceivedBadge count={received.count} voterNames={voterNames} />
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
        <div className="shrink-0 px-4 pb-4 pt-8 -mt-8 relative z-10 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent">
          <button
            onClick={handleReturnToLobby}
            className="w-full py-3 btn-primary rounded-lg tracking-wider flex items-center justify-center gap-1"
          >
            ロビーに戻る
          </button>
        </div>
      </div>

      {detailRole && (
        <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />
      )}

      {showStats && (
        <PlayerStatsModal
          players={roomState.members}
          playerStats={roomState.playerStats ?? {}}
          roomStats={roomState.roomStats ?? { gamesPlayed: 0, villageWins: 0, werewolfWins: 0, minorityWins: 0, draws: 0 }}
          onClose={() => setShowStats(false)}
        />
      )}
    </div>
  );
}
