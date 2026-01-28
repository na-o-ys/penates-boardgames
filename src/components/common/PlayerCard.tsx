import type { ReactNode } from "react";

interface PlayerCardProps {
  playerName: string;
  isCurrentPlayer: boolean;
  highlight?: boolean;
  leftIndicator?: ReactNode;
  statusBadges?: ReactNode;
  onClick?: () => void;
  children: ReactNode;
}

export function PlayerCard({
  playerName,
  isCurrentPlayer,
  highlight = false,
  leftIndicator,
  statusBadges,
  onClick,
  children,
}: PlayerCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-3 relative overflow-hidden ${
        onClick ? "cursor-pointer group/player" : ""
      } ${
        isCurrentPlayer ? "bg-gray-800/90" : "bg-white/15 backdrop-blur-md"
      } ${
        highlight
          ? "border-2 border-[var(--color-primary)] shadow-[0_0_15px_rgba(212,175,55,0.5)]"
          : "border border-white/10"
      }`}
    >
      {isCurrentPlayer && (
        <div className="absolute top-0 right-0 z-10 bg-[var(--color-primary)] text-[var(--color-bg-deep)] text-[10px] font-bold px-2 py-0.5 rounded-bl-lg">
          あなた
        </div>
      )}

      {leftIndicator}

      <div className="flex items-center justify-between">
        <div className={`flex-1 ${leftIndicator ? "pl-2" : ""}`}>
          <div className="font-bold text-white text-lg">{playerName}</div>
          {statusBadges}
        </div>
        <div className="flex items-center space-x-1">
          {children}
        </div>
      </div>
    </div>
  );
}
