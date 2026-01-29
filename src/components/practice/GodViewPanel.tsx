"use client";

import { Fragment } from "react";
import type { GameState, Role } from "@/lib/game";
import { ROLES, resolveFinalRoles } from "@/lib/game";
import { RoleMiniCard } from "../common/RoleMiniCard";
import { PlayerCard } from "../common/PlayerCard";

interface GodViewPanelProps {
  gameState: GameState;
}

export function GodViewPanel({ gameState }: GodViewPanelProps) {
  const finalRoles = resolveFinalRoles(
    gameState.initialDistribution,
    gameState.actions
  );

  const hasSwaps = gameState.players.some(
    (p) => gameState.initialDistribution[p.id] !== finalRoles[p.id]
  );

  return (
    <div className="space-y-3">
      {/* 全プレイヤーの役職 */}
      {gameState.players.map((player) => {
        const initialRole = gameState.initialDistribution[player.id];
        const finalRole = finalRoles[player.id];
        const swapped = initialRole !== finalRole;

        return (
          <PlayerCard key={player.id} playerName={player.name} isCurrentPlayer={false}>
            <div className="flex items-center gap-2">
              <RoleMiniCard role={initialRole} size="small" />
              {swapped && (
                <>
                  <span className="material-icons text-amber-400 text-sm">arrow_forward</span>
                  <RoleMiniCard role={finalRole} size="small" />
                </>
              )}
            </div>
          </PlayerCard>
        );
      })}

      {/* 中央カード */}
      <div className="mt-3 pt-2">
        <h3 className="text-center text-[var(--color-text-muted)] text-xs uppercase tracking-widest mb-3 font-[family-name:var(--font-display)]">
          GRAVEYARD
        </h3>
        <div className="flex justify-center space-x-4">
          {(["CENTER_0", "CENTER_1"] as const).map((centerId) => {
            const role = gameState.initialDistribution[centerId] as Role;
            return (
              <div key={centerId}>
                {role && <RoleMiniCard role={role} size="medium" />}
              </div>
            );
          })}
        </div>
      </div>

      {/* 夜アクション履歴 */}
      {gameState.actions.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/10">
          <h3 className="text-center text-[var(--color-text-muted)] text-xs uppercase tracking-widest mb-3 font-[family-name:var(--font-display)]">
            NIGHT ACTIONS
          </h3>
          <div className="space-y-2">
            {gameState.actions.map((action, i) => {
              const actor = gameState.players.find((p) => p.id === action.actorId);
              const actorRole = gameState.initialDistribution[action.actorId];
              const roleDef = ROLES[actorRole];

              return (
                <div
                  key={i}
                  className="glass-panel rounded-lg px-3 py-2 text-sm"
                >
                  <div className="flex items-center gap-2">
                    <span className={`material-icons text-sm ${roleDef.accentColors.iconText}`}>
                      {roleDef.materialIcon}
                    </span>
                    <span className="text-white font-semibold">
                      {actor?.name}
                    </span>
                    <span className="text-[var(--color-text-muted)]">
                      {action.type === "SKIP"
                        ? "スキップ"
                        : formatActionType(action.type)}
                    </span>
                  </div>
                  {action.result && action.result.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 ml-6">
                      <span className="text-[var(--color-text-muted)] text-xs">結果:</span>
                      {action.result.map((role, j) => (
                        <RoleMiniCard key={j} role={role} size="small" />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function formatActionType(type: string): string {
  switch (type) {
    case "SEER_LOOK_PLAYER": return "プレイヤーを占った";
    case "SEER_LOOK_CENTER": return "中央カードを占った";
    case "ROBBER_SWAP": return "カードを交換した";
    case "TROUBLEMAKER_SWAP": return "2人を交換した";
    case "WEREWOLF_LOOK": return "中央カードを確認した";
    default: return type;
  }
}
