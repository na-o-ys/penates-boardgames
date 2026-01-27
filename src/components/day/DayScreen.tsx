"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientGameState, Player, Role, ActionResult } from "@/lib/game";
import { ROLE_NAMES } from "@/lib/game";
import { RoleCard } from "../night/RoleCard";

interface DayScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onAdvancePhase: () => Promise<{ success: boolean; error?: string }>;
}

export function DayScreen({ gameState, playerId, roomId, onAdvancePhase }: DayScreenProps) {
  const currentPlayerId = playerId;
  const [isAdvancing, setIsAdvancing] = useState(false);

  const isHost = gameState.players[0]?.id === currentPlayerId;
  const dayDuration = gameState.config.dayDuration;
  const phaseStartedAt = gameState.phaseStartedAt;

  const calculateTimeLeft = useCallback(() => {
    if (!phaseStartedAt) return dayDuration;
    const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000);
    return Math.max(0, dayDuration - elapsed);
  }, [phaseStartedAt, dayDuration]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
  }, [calculateTimeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, calculateTimeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onAdvancePhase().catch(console.error);
    }
  }, [timeLeft, onAdvancePhase]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAdvanceToVoting = async () => {
    setIsAdvancing(true);
    try {
      const result = await onAdvancePhase();
      if (!result.success) {
        console.error("Failed to advance phase:", result.error);
      }
    } catch (error) {
      console.error("Error advancing phase:", error);
    } finally {
      setIsAdvancing(false);
    }
  };

  const getRoleName = (role: Role): string => {
    return ROLE_NAMES[role] ?? role;
  };

  const getCurrentRole = (): Role | null => {
    const robberSwap = gameState.actionResults.find(
      (r) => r.type === "ROBBER_SWAP"
    );
    if (robberSwap && robberSwap.revealedRoles?.[0]) {
      return robberSwap.revealedRoles[0];
    }
    return null;
  };

  const currentRole = getCurrentRole();
  const hasSwapped = currentRole !== null;
  const isTimeLow = timeLeft <= 10 && timeLeft > 0;

  return (
    <div className="min-h-screen game-overlay p-4">
      <div className="max-w-md mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 pt-4">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-2">
            議論フェーズ
          </h1>
          <div className={`text-5xl font-bold mb-4 ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "gold-text"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[var(--color-text-secondary)]">
            誰が人狼か話し合いましょう
          </p>
        </div>

        {/* 自分の役職 */}
        <div className="glass-card rounded-xl p-6 mb-6">
          {hasSwapped ? (
            <>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4 text-center">
                あなたの現在の役職
              </h2>
              <div className="flex justify-center mb-4">
                <RoleCard role={currentRole} size="large" />
              </div>
              <p className="text-center text-[var(--color-text-muted)] text-sm">
                最初の役職: {ROLE_NAMES[gameState.myRole!]}
              </p>
            </>
          ) : (
            <>
              <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4 text-center">
                あなたの役職
              </h2>
              <div className="flex justify-center">
                <RoleCard role={gameState.myRole} size="large" />
              </div>
            </>
          )}
        </div>

        {/* 夜の情報 */}
        {gameState.actionResults && gameState.actionResults.length > 0 && (
          <div className="glass-card rounded-xl p-6 mb-6">
            <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">
              夜に得た情報
            </h2>
            <div className="space-y-2">
              {gameState.actionResults.map((result: ActionResult, idx: number) => (
                <div key={idx} className="text-white text-sm">
                  {result.type === "SEER_LOOK_PLAYER" && result.revealedRoles && (
                    <span>
                      <span className="text-[var(--color-text-secondary)]">見た役職: </span>
                      {gameState.players.find(p => p.id === result.targetIds[0])?.name}は
                      {getRoleName(result.revealedRoles[0])}
                    </span>
                  )}
                  {result.type === "SEER_LOOK_CENTER" && result.revealedRoles && (
                    <span>
                      <span className="text-[var(--color-text-secondary)]">中央カード: </span>
                      {result.targetIds.map((targetId, i) => (
                        <span key={targetId}>
                          {i > 0 && ", "}
                          中央{parseInt(targetId.split("_")[1]) + 1}は{getRoleName(result.revealedRoles![i])}
                        </span>
                      ))}
                    </span>
                  )}
                  {result.type === "WEREWOLF_LOOK" && result.revealedRoles && (
                    <span>
                      <span className="text-[var(--color-text-secondary)]">見た中央カード: </span>
                      中央{parseInt(result.targetIds[0].split("_")[1]) + 1}は
                      {getRoleName(result.revealedRoles[0])}
                    </span>
                  )}
                  {result.type === "ROBBER_SWAP" && result.revealedRoles && (
                    <span>
                      <span className="text-[var(--color-text-secondary)]">交換後の役職: </span>
                      {gameState.players.find(p => p.id === result.targetIds[0])?.name}から
                      {getRoleName(result.revealedRoles[0])}を奪いました
                    </span>
                  )}
                  {result.type === "TROUBLEMAKER_SWAP" && (
                    <span>
                      <span className="text-[var(--color-text-secondary)]">交換: </span>
                      {gameState.players.find(p => p.id === result.targetIds[0])?.name}と
                      {gameState.players.find(p => p.id === result.targetIds[1])?.name}の
                      カードを交換しました
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* プレイヤー一覧 */}
        <div className="glass-card rounded-xl p-6 mb-6">
          <h2 className="font-[family-name:var(--font-display)] text-lg font-semibold text-white mb-4">プレイヤー</h2>
          <div className="grid grid-cols-2 gap-3">
            {gameState.players.map((player: Player) => (
              <div
                key={player.id}
                className={`p-3 rounded-xl ${
                  player.id === currentPlayerId
                    ? "glass-card card-highlight"
                    : "glass-panel"
                }`}
              >
                <span className="text-white font-medium">{player.name}</span>
                {player.id === currentPlayerId && (
                  <span className="text-[var(--color-text-muted)] text-sm ml-2">(あなた)</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 投票へ進むボタン（ホストのみ） */}
        {isHost && (
          <button
            onClick={handleAdvanceToVoting}
            disabled={isAdvancing}
            className="w-full py-4 btn-primary rounded-xl text-lg font-[family-name:var(--font-display)] tracking-wider"
          >
            {isAdvancing ? "移行中..." : "投票フェーズへ進む"}
          </button>
        )}

        {!isHost && (
          <p className="text-center text-[var(--color-text-muted)]">
            ホストが投票フェーズへ進めるのを待っています...
          </p>
        )}
      </div>
    </div>
  );
}
