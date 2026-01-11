"use client";

import { useState, useEffect } from "react";
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
  const [timeLeft, setTimeLeft] = useState(180); // 3分間の議論時間
  const [isAdvancing, setIsAdvancing] = useState(false);

  const isHost = gameState.players[0]?.id === currentPlayerId;

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1));
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAdvanceToVoting = async () => {
    setIsAdvancing(true);
    try {
      const result = await advancePhaseAction(roomId);
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

  return (
    <div className="min-h-screen bg-gray-900 p-4">
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
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4 text-center">
            あなたの最初の役職
          </h2>
          <div className="flex justify-center">
            <RoleCard role={gameState.myRole} />
          </div>
        </div>

        {/* 夜の情報 */}
        {gameState.actionResults && gameState.actionResults.length > 0 && (
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
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
        <div className="bg-gray-800 rounded-xl p-6 mb-6">
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
