"use client";

import { useState } from "react";
import { startGameAction, setRolesAction, updateGameConfigAction, kickPlayerAction } from "@/actions";
import { type ClientGameState, type Role } from "@/lib/game";
import { PlayerList } from "./PlayerList";
import { RoleSelector } from "./RoleSelector";
import { TimerSettings } from "./TimerSettings";

type LobbyTab = "players" | "roles" | "settings";

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
  const [activeTab, setActiveTab] = useState<LobbyTab>("players");

  const isHost = gameState.players.find((p) => p.id === playerId)?.isHost ?? false;
  const playerCount = gameState.players.length;
  const requiredRoles = playerCount + 2;
  const hasValidRoles = gameState.config.roles.length === requiredRoles;
  const canStart = isHost && playerCount >= 3 && hasValidRoles;

  const handleRolesChange = async (roles: Role[]) => {
    setError(null);
    const result = await setRolesAction(roomId, playerId, roles);
    if (!result.success) {
      setError(result.error ?? "役職の設定に失敗しました");
    }
  };

  const handleTimerChange = async (settings: { nightDuration?: number; dayDuration?: number }) => {
    setError(null);
    const result = await updateGameConfigAction(roomId, playerId, settings);
    if (!result.success) {
      setError(result.error ?? "タイマー設定に失敗しました");
    }
  };

  const handleKickPlayer = async (targetPlayerId: string) => {
    setError(null);
    const result = await kickPlayerAction(roomId, playerId, targetPlayerId);
    if (!result.success) {
      setError(result.error ?? "プレイヤーの退室に失敗しました");
    }
  };

  const handleStartGame = async () => {
    if (!canStart) return;

    setIsStarting(true);
    setError(null);

    try {
      const result = await startGameAction(roomId, playerId);
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

  const tabs: { id: LobbyTab; label: string }[] = [
    { id: "players", label: "プレイヤー" },
    { id: "roles", label: "役職設定" },
    { id: "settings", label: "タイマー" },
  ];

  return (
    <div className="flex flex-col min-h-screen game-overlay p-4 md:p-8">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* ヘッダー */}
        <div className="text-center mb-6 pt-4">
          <h1 className="font-[family-name:var(--font-display)] font-black text-3xl gold-text mb-3 tracking-wider">
            ロビー
          </h1>
          <div className="flex items-center justify-center gap-2">
            <span className="text-[var(--color-text-muted)] text-xs uppercase tracking-widest">部屋ID</span>
            <code className="px-3 py-1 glass-panel rounded-lg text-[var(--color-text-secondary)] text-sm font-mono">
              {roomId.slice(0, 8)}
            </code>
            <button
              onClick={copyRoomLink}
              className="px-3 py-1 btn-secondary rounded-lg text-xs"
            >
              コピー
            </button>
          </div>
          <div className="mt-2 text-xs text-[var(--color-text-muted)]">
            {playerCount}人参加中
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-[var(--color-error)]/20 border border-[var(--color-error)]/40 rounded-xl text-[var(--color-error)] text-center text-sm">
            {error}
          </div>
        )}

        {/* タブバー */}
        <div className="glass-panel rounded-xl p-1 mb-4 flex">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-[var(--color-primary)] text-[var(--color-bg-deep)]"
                  : "text-[var(--color-text-secondary)] hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* タブコンテンツ */}
        <div className="flex-1 glass-card rounded-xl p-4 mb-6">
          {activeTab === "players" && (
            <PlayerList
              players={gameState.players}
              currentPlayerId={playerId}
              isHost={isHost}
              onKickPlayer={handleKickPlayer}
            />
          )}

          {activeTab === "roles" && (
            <div>
              {!isHost && (
                <p className="text-xs text-[var(--color-text-muted)] mb-3">ホストが設定</p>
              )}
              <RoleSelector
                playerCount={playerCount}
                selectedRoles={gameState.config.roles as Role[]}
                onChange={handleRolesChange}
                disabled={!isHost}
              />
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
                必要枚数: {requiredRoles}枚（{playerCount}人 + 中央2枚）
              </p>
            </div>
          )}

          {activeTab === "settings" && (
            <div>
              {!isHost && (
                <p className="text-xs text-[var(--color-text-muted)] mb-3">ホストが設定</p>
              )}
              <TimerSettings
                nightDuration={gameState.config.nightDuration}
                dayDuration={gameState.config.dayDuration}
                votingDuration={gameState.config.votingDuration}
                onChange={handleTimerChange}
                disabled={!isHost}
              />
            </div>
          )}
        </div>

        {/* ゲーム開始ボタン */}
        {isHost && (
          <div className="text-center pb-4">
            <button
              onClick={handleStartGame}
              disabled={!canStart || isStarting}
              className="w-full py-4 btn-primary rounded-xl text-lg font-[family-name:var(--font-display)] tracking-wider"
            >
              {isStarting ? "開始中..." : "ゲーム開始"}
            </button>
            {!canStart && (
              <p className="mt-2 text-xs text-[var(--color-text-muted)]">
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
          <div className="text-center pb-4 text-[var(--color-text-muted)] text-sm">
            ホストがゲームを開始するのを待っています...
          </div>
        )}
      </div>
    </div>
  );
}
