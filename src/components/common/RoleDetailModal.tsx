"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ROLE_NAMES, ROLE_DESCRIPTIONS, ROLE_MATERIAL_ICONS, ROLE_CARD_COLORS, type Role } from "@/lib/game";

const TEAM_COLORS: Record<string, string> = {
  "人狼陣営": "text-[var(--color-role-werewolf)]",
  "村人陣営": "text-[var(--color-ready)]",
  "第三陣営": "text-[var(--color-role-tanner)]",
};

interface RoleDetailModalProps {
  role: Role;
  onClose: () => void;
}

export function RoleDetailModal({ role, onClose }: RoleDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const description = ROLE_DESCRIPTIONS[role];
  const colors = ROLE_CARD_COLORS[role];

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
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative glass-card rounded-xl p-6 max-w-sm w-full">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
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

        <div className="flex flex-col items-center mb-4">
          <div className={`w-20 h-20 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center mb-3`}>
            <span className={`material-icons text-5xl ${colors.text}`}>
              {ROLE_MATERIAL_ICONS[role]}
            </span>
          </div>

          <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">
            {ROLE_NAMES[role]}
          </h2>
          <span className={`text-sm font-semibold ${TEAM_COLORS[description.team] || "text-[var(--color-text-secondary)]"}`}>
            {description.team}
          </span>
        </div>

        <div className="glass-panel rounded-xl p-4 mb-3">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">能力</h3>
          <p className="text-white text-sm leading-relaxed">
            {description.ability}
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">勝利条件</h3>
          <p className="text-white text-sm leading-relaxed">
            {description.winCondition}
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
