"use client";

import { useState } from "react";
import { startGameAction, setRolesAction } from "@/actions";
import { type ClientGameState, type Role } from "@/lib/game";
import { PlayerList } from "./PlayerList";
import { RoleSelector } from "./RoleSelector";

interface LobbyScreenProps {
  roomId: string;
  gameState: ClientGameState;
  playerId: string;
  onRefresh: () => void;
}

export function LobbyScreen({
  roomId,
  gameState,
  playerId,
}: LobbyScreenProps) {
  const [isStarting, setIsStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isHost = gameState.players.find((p) => p.id === playerId)?.isHost ?? false;
  const playerCount = gameState.players.length;
  const requiredRoles = playerCount + 2;
  const hasValidRoles = gameState.config.roles.length === requiredRoles;
  const canStart = isHost && playerCount >= 3 && hasValidRoles;

  const handleRolesChange = async (roles: Role[]) => {
    setError(null);
    const result = await setRolesAction(roomId, roles);
    if (!result.success) {
      setError(result.error ?? "役職の設定に失敗しました");
    }
  };

  const handleStartGame = async () => {
    if (!canStart) return;

    setIsStarting(true);
    setError(null);

    try {
      const result = await startGameAction(roomId);
      if (!result.success) {
        setError(result.error ?? "ゲームの開始に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setIsStarting(false);
    }
  };

  const copyRoomLink = () => {
    const url = `${window.location.origin}/room/${roomId}`;
    navigator.clipboard.writeText(url);
  };

  return (
    <div className="flex flex-col min-h-screen p-4 md:p-8">
      {/* ヘッダー */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">ロビー</h1>
        <div className="flex items-center justify-center gap-2">
          <code className="px-3 py-1 bg-gray-800 rounded text-gray-300 text-sm">
            {roomId.slice(0, 8)}...
          </code>
          <button
            onClick={copyRoomLink}
            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm text-white transition-colors"
          >
            リンクをコピー
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-center">
          {error}
        </div>
      )}

      <div className="flex-1 grid md:grid-cols-2 gap-8 max-w-4xl mx-auto w-full">
        {/* プレイヤーリスト */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            プレイヤー ({playerCount}人)
          </h2>
          <PlayerList players={gameState.players} currentPlayerId={playerId} />
        </div>

        {/* 役職設定（ホストのみ） */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">
            役職設定
            {!isHost && <span className="text-sm text-gray-400 ml-2">(ホストが設定)</span>}
          </h2>
          <RoleSelector
            playerCount={playerCount}
            selectedRoles={gameState.config.roles as Role[]}
            onChange={handleRolesChange}
            disabled={!isHost}
          />
          <p className="mt-2 text-sm text-gray-400">
            必要枚数: {requiredRoles}枚（プレイヤー{playerCount}人 + 中央2枚）
          </p>
        </div>
      </div>

      {/* ゲーム開始ボタン */}
      {isHost && (
        <div className="mt-8 text-center">
          <button
            onClick={handleStartGame}
            disabled={!canStart || isStarting}
            className="px-8 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-lg font-semibold text-white transition-colors"
          >
            {isStarting ? "開始中..." : "ゲーム開始"}
          </button>
          {!canStart && (
            <p className="mt-2 text-sm text-gray-400">
              {playerCount < 3
                ? "3人以上でプレイできます"
                : !hasValidRoles
                ? "役職を設定してください"
                : ""}
            </p>
          )}
        </div>
      )}

      {!isHost && (
        <div className="mt-8 text-center text-gray-400">
          ホストがゲームを開始するのを待っています...
        </div>
      )}
    </div>
  );
}
