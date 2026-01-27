"use client";

import type { ClientGameState, Player, Role, Team, PlayerId, GameAction } from "@/lib/game";
import { ROLE_NAMES, ROLE_MATERIAL_ICONS, ROLE_CARD_COLORS } from "@/lib/game";
import { useState } from "react";

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

/**
 * 交換によって役職が変わったプレイヤーの交換理由を返す
 */
function getSwapReason(
  playerId: string,
  allActions: readonly GameAction[],
  players: readonly Player[]
): string | null {
  for (const action of allActions) {
    if (action.type === "ROBBER_SWAP" && action.targetIds[0] === playerId) {
      const robberName = players.find((p) => p.id === action.actorId)?.name;
      return `${robberName ?? "怪盗"}に奪われた`;
    }
    if (action.type === "ROBBER_SWAP" && action.actorId === playerId) {
      const targetName = players.find((p) => p.id === action.targetIds[0])?.name;
      return `${targetName ?? "相手"}から奪った`;
    }
    if (
      action.type === "TROUBLEMAKER_SWAP" &&
      (action.targetIds[0] === playerId || action.targetIds[1] === playerId)
    ) {
      const makerName = players.find((p) => p.id === action.actorId)?.name;
      return `${makerName ?? "トラブルメーカー"}に交換された`;
    }
  }
  return null;
}

function RoleMiniCard({ role, size = "medium" }: { role: Role; size?: "small" | "medium" }) {
  const colors = ROLE_CARD_COLORS[role];
  const sizeClass = size === "small" ? "w-9 h-12" : "w-10 h-14";
  const iconSize = size === "small" ? "text-base" : "text-lg";
  const labelSize = size === "small" ? "text-[8px]" : "text-[9px]";
  const labelColor = size === "small" ? "text-gray-400" : colors.text;

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClass} ${colors.bg} rounded border ${colors.border} flex items-center justify-center ${size === "medium" ? "shadow-[0_0_15px_rgba(212,175,55,0.2)]" : ""}`}>
        <span className={`material-icons ${colors.text} ${iconSize}`}>
          {ROLE_MATERIAL_ICONS[role]}
        </span>
      </div>
      <span className={`${labelSize} ${labelColor} mt-0.5 font-bold`}>
        {ROLE_NAMES[role]}
      </span>
    </div>
  );
}

function UnknownMiniCard() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-12 h-16 bg-gray-800 rounded border border-gray-600 flex items-center justify-center opacity-80">
        <span className="material-icons text-gray-400">question_mark</span>
      </div>
    </div>
  );
}

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
          {gameState.players.map((player: Player) => {
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
              <div
                key={player.id}
                className={`rounded-xl p-3 relative overflow-hidden ${
                  isCurrentPlayer
                    ? "bg-gray-800/90 border-2 border-[var(--color-primary)] shadow-[0_0_15px_rgba(212,175,55,0.5)]"
                    : "bg-white/10 backdrop-blur-md border border-white/10"
                }`}
              >
                {/* あなたバッジ */}
                {isCurrentPlayer && (
                  <div className="absolute top-0 right-0 bg-[var(--color-primary)] text-[var(--color-bg-deep)] text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
                    あなた
                  </div>
                )}

                {/* 処刑マーカー（左赤ライン） */}
                {isExecuted && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-error)] rounded-l-xl" />
                )}

                <div className="flex items-center justify-between">
                  {/* 左側: 名前 + ステータス */}
                  <div className={`flex-1 ${isExecuted ? "pl-2" : ""}`}>
                    <div className="font-bold text-white text-lg">{player.name}</div>
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
                  </div>

                  {/* 右側: 役職遷移 */}
                  <div className="flex items-center space-x-1">
                    {roleChanged && initRole ? (
                      <>
                        <div className="opacity-50 grayscale scale-90">
                          <RoleMiniCard role={initRole} size="small" />
                        </div>
                        <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
                      </>
                    ) : null}
                    {finalRole ? (
                      <RoleMiniCard role={finalRole} size={roleChanged ? "medium" : "medium"} />
                    ) : (
                      <UnknownMiniCard />
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* 墓地（中央カード） */}
          <div className="mt-6 border-t border-white/20 pt-4">
            <h3 className="text-center text-[var(--color-text-muted)] text-xs uppercase tracking-widest mb-3 font-[family-name:var(--font-display)]">
              墓地（中央カード）
            </h3>
            <div className="flex justify-center space-x-4">
              {["CENTER_0", "CENTER_1"].map((centerId) => {
                const role = finalRoles[centerId] as Role | undefined;
                return (
                  <div key={centerId} className="flex flex-col items-center">
                    {role ? (
                      <>
                        <div className={`w-12 h-16 ${ROLE_CARD_COLORS[role].bg} rounded border ${ROLE_CARD_COLORS[role].border} flex items-center justify-center opacity-80`}>
                          <span className={`material-icons ${ROLE_CARD_COLORS[role].text}`}>
                            {ROLE_MATERIAL_ICONS[role]}
                          </span>
                        </div>
                        <span className={`text-[9px] ${ROLE_CARD_COLORS[role].text} mt-1 font-bold`}>
                          {ROLE_NAMES[role]}
                        </span>
                      </>
                    ) : (
                      <>
                        <div className="w-12 h-16 bg-gray-800 rounded border border-gray-600 flex items-center justify-center opacity-80">
                          <span className="material-icons text-gray-400">question_mark</span>
                        </div>
                        <span className="text-[9px] text-gray-400 mt-1">不明</span>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
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
