"use client";

import Link from "next/link";
import type { Role, Player } from "@/lib/game";
import { RoleSelector } from "../lobby/RoleSelector";

interface PracticeLobbyProps {
  roles: Role[];
  players: Player[];
  playerCount: number;
  setRoles: (roles: Role[]) => void;
  startGame: () => void;
}

export function PracticeLobby({
  roles,
  players,
  playerCount,
  setRoles,
  startGame,
}: PracticeLobbyProps) {
  const requiredCount = playerCount + 2;
  const hasValidRoles = playerCount >= 3 && roles.length === requiredCount;

  return (
    <div className="flex flex-col min-h-screen game-overlay p-4 md:p-8">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* ヘッダー */}
        <div className="text-center mb-6 pt-4">
          <Link
            href="/"
            className="inline-block mb-4 text-[var(--color-text-muted)] hover:text-white transition-colors text-sm"
          >
            <span className="material-icons text-sm align-middle mr-1">arrow_back</span>
            ホームに戻る
          </Link>
          <h1 className="font-[family-name:var(--font-display)] font-black text-3xl gold-text mb-3 tracking-wider">
            PRACTICE MODE
          </h1>
          <p className="text-[var(--color-text-secondary)] text-sm">
            役職を設定して練習を開始
          </p>
          {playerCount >= 3 && (
            <div className="mt-2 text-xs text-[var(--color-text-muted)]">
              {playerCount}人分のプレイヤーを操作します
            </div>
          )}
        </div>

        {/* 先頭の開始ボタン */}
        {hasValidRoles && (
          <div className="mb-4">
            <button
              onClick={startGame}
              className="w-full py-3 btn-primary rounded-xl text-base tracking-wider"
            >
              練習開始
            </button>
          </div>
        )}

        {/* プレイヤー名一覧 */}
        {playerCount >= 3 && (
          <div className="glass-panel rounded-xl p-3 mb-4">
            <div className="flex flex-wrap gap-2 justify-center">
              {players.map((p) => (
                <span
                  key={p.id}
                  className="px-2 py-1 bg-black/30 rounded text-xs text-[var(--color-text-secondary)]"
                >
                  {p.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 役職設定 */}
        <div className="flex-1 glass-card rounded-xl p-4 mb-6">
          <RoleSelector
            playerCount={playerCount}
            selectedRoles={roles}
            onChange={setRoles}
            disabled={false}
          />
        </div>

        {/* 開始ボタン */}
        <div className="text-center pb-4">
          <button
            onClick={startGame}
            disabled={!hasValidRoles}
            className="w-full py-4 btn-primary rounded-xl text-lg tracking-wider"
          >
            練習開始
          </button>
          {!hasValidRoles && playerCount < 3 && (
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">
              役職を5枚以上設定してください（3人以上）
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
