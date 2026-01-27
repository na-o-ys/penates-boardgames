"use client";

import { useState, useEffect, useCallback } from "react";
import type { ClientGameState, Player, Role, ActionResult } from "@/lib/game";
import { ROLE_NAMES } from "@/lib/game";
import { advancePhaseAction } from "@/actions";
import { RoleCard } from "../night/RoleCard";

interface DayScreenProps {
  gameState: ClientGameState;
  playerId: string;
  roomId: string;
  onRefresh: () => void;
}

export function DayScreen({ gameState, playerId, roomId }: DayScreenProps) {
  const currentPlayerId = playerId;
  const [isAdvancing, setIsAdvancing] = useState(false);

  const isHost = gameState.players[0]?.id === currentPlayerId;
  const dayDuration = gameState.config.dayDuration;
  const phaseStartedAt = gameState.phaseStartedAt;

  // phaseStartedAtから残り時間を計算
  const calculateTimeLeft = useCallback(() => {
    if (!phaseStartedAt) return dayDuration;
    const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000);
    return Math.max(0, dayDuration - elapsed);
  }, [phaseStartedAt, dayDuration]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    // phaseStartedAtが変わったら再計算
    setTimeLeft(calculateTimeLeft());
  }, [calculateTimeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, calculateTimeLeft]);

  // タイマー終了時の自動進行
  useEffect(() => {
    if (timeLeft <= 0) {
      advancePhaseAction(roomId, playerId).catch(console.error);
    }
  }, [timeLeft, roomId, playerId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAdvanceToVoting = async () => {
    setIsAdvancing(true);
    try {
      const result = await advancePhaseAction(roomId, playerId);
      if (!result.success) {
        console.error("Failed to advance phase:", result.error);
      }
    } catch (error) {
      console.error("Error advancing phase:", error);
    } finally {
      setIsAdvancing(false);
    }
  };

  // 役職名を取得
  const getRoleName = (role: Role): string => {
    return ROLE_NAMES[role] ?? role;
  };

  // 怪盗の交換後の役職を取得
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

  return (
    <div className="min-h-screen game-overlay p-4">
      <div className="max-w-2xl mx-auto">
        {/* ヘッダー */}
        <div className="text-center mb-8 pt-4">
          <h1 className="text-3xl font-bold text-white mb-2">☀️ 議論フェーズ</h1>
          <div className="text-5xl font-bold text-white mb-4">
            {formatTime(timeLeft)}
          </div>
          <p className="text-gray-400">
            誰が人狼か話し合いましょう
          </p>
        </div>

        {/* 自分の役職 */}
        <div className="glass-card rounded-xl p-6 mb-6">
          {hasSwapped ? (
            <>
              <h2 className="text-lg font-semibold text-white mb-4 text-center">
                あなたの現在の役職
              </h2>
              <div className="flex justify-center mb-4">
                <RoleCard role={currentRole} />
              </div>
              <p className="text-center text-gray-400 text-sm">
                最初の役職: {ROLE_NAMES[gameState.myRole!]}
              </p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-semibold text-white mb-4 text-center">
                あなたの役職
              </h2>
              <div className="flex justify-center">
                <RoleCard role={gameState.myRole} />
              </div>
            </>
          )}
        </div>

        {/* 夜の情報 */}
        {gameState.actionResults && gameState.actionResults.length > 0 && (
          <div className="glass-card rounded-xl p-6 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4">
              夜に得た情報
            </h2>
            <div className="space-y-2">
              {gameState.actionResults.map((result: ActionResult, idx: number) => (
                <div key={idx} className="text-white">
                  {result.type === "SEER_LOOK_PLAYER" && result.revealedRoles && (
                    <span>
                      <span className="text-gray-400">見た役職: </span>
                      {gameState.players.find(p => p.id === result.targetIds[0])?.name}は
                      {getRoleName(result.revealedRoles[0])}
                    </span>
                  )}
                  {result.type === "SEER_LOOK_CENTER" && result.revealedRoles && (
                    <span>
                      <span className="text-gray-400">中央カード: </span>
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
                      <span className="text-gray-400">見た中央カード: </span>
                      中央{parseInt(result.targetIds[0].split("_")[1]) + 1}は
                      {getRoleName(result.revealedRoles[0])}
                    </span>
                  )}
                  {result.type === "ROBBER_SWAP" && result.revealedRoles && (
                    <span>
                      <span className="text-gray-400">交換後の役職: </span>
                      {gameState.players.find(p => p.id === result.targetIds[0])?.name}から
                      {getRoleName(result.revealedRoles[0])}を奪いました
                    </span>
                  )}
                  {result.type === "TROUBLEMAKER_SWAP" && (
                    <span>
                      <span className="text-gray-400">交換: </span>
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
          <h2 className="text-lg font-semibold text-white mb-4">プレイヤー</h2>
          <div className="grid grid-cols-2 gap-3">
            {gameState.players.map((player: Player) => (
              <div
                key={player.id}
                className={`p-3 rounded-lg ${
                  player.id === currentPlayerId
                    ? "bg-slate-700 border-2 border-slate-500"
                    : "bg-gray-700"
                }`}
              >
                <span className="text-white font-medium">{player.name}</span>
                {player.id === currentPlayerId && (
                  <span className="text-gray-400 text-sm ml-2">(あなた)</span>
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
            className="w-full py-4 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold text-lg transition-colors"
          >
            {isAdvancing ? "移行中..." : "投票フェーズへ進む"}
          </button>
        )}

        {!isHost && (
          <p className="text-center text-gray-400">
            ホストが投票フェーズへ進めるのを待っています...
          </p>
        )}
      </div>
    </div>
  );
}
