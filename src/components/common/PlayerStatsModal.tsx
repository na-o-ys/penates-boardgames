"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Player, PlayerStat } from "@/lib/game";

interface PlayerStatsModalProps {
  players: readonly Player[];
  playerStats: Record<string, PlayerStat>;
  onClose: () => void;
}

const EMPTY_STAT: PlayerStat = {
  totalGames: 0,
  totalWins: 0,
  villageGames: 0,
  villageWins: 0,
  werewolfGames: 0,
  werewolfWins: 0,
  minorityGames: 0,
  minorityWins: 0,
};

function StatBlock({
  label,
  games,
  wins,
  colorClass,
}: {
  label: string;
  games: number;
  wins: number;
  colorClass: string;
}) {
  const rate = games > 0 ? Math.round((wins / games) * 100) : 0;
  return (
    <div className="text-center">
      <div className={`text-xs ${colorClass}`}>{label}</div>
      <div className="font-bold text-sm">
        {wins}/{games}
      </div>
      <div className="text-[var(--color-text-muted)] text-xs">{rate}%</div>
    </div>
  );
}

export function PlayerStatsModal({
  players,
  playerStats,
  onClose,
}: PlayerStatsModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none" />

      <div className="relative glass-card rounded-xl p-4 max-w-sm w-full max-h-[80vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors z-10"
          aria-label="閉じる"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <h2 className="font-[family-name:var(--font-display)] text-lg font-bold gold-text text-center mb-4">
          プレイヤースタッツ
        </h2>

        <div className="space-y-3">
          {players.map((player) => {
            const stats = playerStats[player.id] ?? EMPTY_STAT;
            return (
              <div key={player.id} className="glass-panel rounded-lg p-3">
                <div className="font-semibold text-sm mb-2">{player.name}</div>
                <div className="grid grid-cols-4 gap-1">
                  <StatBlock
                    label="全体"
                    games={stats.totalGames}
                    wins={stats.totalWins}
                    colorClass="text-[var(--color-text-secondary)]"
                  />
                  <StatBlock
                    label="村人"
                    games={stats.villageGames}
                    wins={stats.villageWins}
                    colorClass="text-emerald-400"
                  />
                  <StatBlock
                    label="人狼"
                    games={stats.werewolfGames}
                    wins={stats.werewolfWins}
                    colorClass="text-red-400"
                  />
                  <StatBlock
                    label="第三"
                    games={stats.minorityGames}
                    wins={stats.minorityWins}
                    colorClass="text-orange-400"
                  />
                </div>
              </div>
            );
          })}

          {players.length === 0 && (
            <p className="text-center text-[var(--color-text-muted)] py-4">
              プレイヤーがいません
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
