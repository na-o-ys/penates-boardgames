"use client";

import { Fragment, useMemo } from "react";
import type { ClientGameState, GameState, Player, Role } from "@/lib/game";
import {
  buildRevealedInfo,
  getSwapReason,
  maskGameState,
  maskGameStateForWerewolf,
  ROLES,
} from "@/lib/game";
import { PlayerCard } from "../common/PlayerCard";
import { PlayerRoleDisplay } from "../common/PlayerRoleDisplay";
import { CemeterySection } from "../common/CemeterySection";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { OtherPlayersDivider } from "../common/OtherPlayersDivider";
import { GodViewPanel } from "./GodViewPanel";
import { useState } from "react";

interface PracticeDayProps {
  gameState: GameState;
  players: Player[];
  viewPlayerId: string | null;
  setViewPlayerId: (id: string | null) => void;
  returnToLobby: () => void;
}

export function PracticeDay({
  gameState,
  players,
  viewPlayerId,
  setViewPlayerId,
  returnToLobby,
}: PracticeDayProps) {
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const isGodView = viewPlayerId === null;

  const clientState = useMemo((): ClientGameState | null => {
    if (!viewPlayerId) return null;
    const role = gameState.initialDistribution[viewPlayerId];
    if (role && ROLES[role].isWerewolfNightAlly) {
      return maskGameStateForWerewolf(gameState, viewPlayerId);
    }
    return maskGameState(gameState, viewPlayerId);
  }, [gameState, viewPlayerId]);

  return (
    <div className="flex flex-col min-h-screen game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="pt-8 pb-2 px-4 text-center">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-3">
            DISCUSSION PHASE
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            各プレイヤーの視点を確認しましょう
          </p>
        </div>

        {/* 視点切替タブ */}
        <div className="px-4 pb-3">
          <div className="glass-panel rounded-xl p-1 flex flex-wrap gap-1">
            <button
              onClick={() => setViewPlayerId(null)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold transition-all ${
                isGodView
                  ? "bg-amber-500 text-[var(--color-bg-deep)]"
                  : "text-amber-400/60 hover:text-amber-400"
              }`}
            >
              <span className="material-icons text-xs align-middle mr-0.5">visibility</span>
              神
            </button>
            {players.map((player, index) => (
              <button
                key={player.id}
                onClick={() => setViewPlayerId(player.id)}
                className={`flex-1 min-w-0 py-1.5 px-2 rounded-lg text-xs font-semibold transition-all ${
                  viewPlayerId === player.id
                    ? "bg-[var(--color-primary)] text-[var(--color-bg-deep)]"
                    : "text-[var(--color-text-secondary)] hover:text-white"
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>

        {/* コンテンツ */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
          {isGodView ? (
            <GodViewPanel gameState={gameState} />
          ) : clientState ? (
            <PlayerViewContent
              clientState={clientState}
              playerId={viewPlayerId!}
              onRoleClick={setDetailRole}
            />
          ) : null}
        </div>

        {/* フッター */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent z-20 max-w-md mx-auto">
          <button
            onClick={returnToLobby}
            className="w-full py-3 btn-primary rounded-xl text-base tracking-wider"
          >
            ロビーに戻る
          </button>
        </div>
      </div>

      {detailRole && (
        <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />
      )}
    </div>
  );
}

function PlayerViewContent({
  clientState,
  playerId,
  onRoleClick,
}: {
  clientState: ClientGameState;
  playerId: string;
  onRoleClick: (role: Role) => void;
}) {
  const revealedInfo = buildRevealedInfo(clientState.actionResults);
  const sortedPlayers = [...clientState.players].sort((a, b) =>
    a.id === playerId ? -1 : b.id === playerId ? 1 : 0
  );

  return (
    <>
      {sortedPlayers.map((player: Player, index: number) => {
        const swapReason = getSwapReason(player.id, clientState.myActions, clientState.players);
        return (
          <Fragment key={player.id}>
            {index === 1 && <OtherPlayersDivider />}
            <PlayerCard
              playerName={player.name}
              isCurrentPlayer={player.id === playerId}
              statusBadges={
                (player.id === playerId && (clientState.receivedBread || clientState.receivedNotice)) || swapReason ? (
                  <div className="text-xs space-y-1">
                    {player.id === playerId && clientState.receivedBread && (
                      <div className="flex items-center gap-1 text-amber-400">
                        <span className="material-icons text-sm">bakery_dining</span>
                        <span>パン屋からパンが届きました</span>
                      </div>
                    )}
                    {player.id === playerId && clientState.receivedNotice && (
                      <div className="flex items-center gap-1 text-white">
                        <span className="material-icons text-sm">mail</span>
                        <span>白怪盗から予告状が届きました</span>
                      </div>
                    )}
                    {swapReason && (
                      <span className="text-yellow-500">
                        <span className="material-icons text-sm align-middle animate-pulse">sync_alt</span>
                        {" "}{swapReason}
                      </span>
                    )}
                  </div>
                ) : undefined
              }
            >
              <PlayerRoleDisplay
                playerId={player.id}
                currentPlayerId={playerId}
                gameState={clientState}
                onRoleClick={onRoleClick}
              />
            </PlayerCard>
          </Fragment>
        );
      })}

      <CemeterySection centerRoles={revealedInfo.centers} />
    </>
  );
}
