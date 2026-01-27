"use client";

import { useState } from "react";
import { ROLE_NAMES, ROLE_MATERIAL_ICONS, ROLE_CARD_COLORS, type Role } from "@/lib/game";
import { RoleDetailModal } from "../common/RoleDetailModal";

type RoleCardSize = "small" | "medium" | "large";

interface RoleCardProps {
  role: Role | null;
  revealed?: boolean;
  size?: RoleCardSize;
  /** @deprecated Use size="small" instead */
  small?: boolean;
  interactive?: boolean;
}

const SIZE_CLASSES: Record<RoleCardSize, { card: string; icon: string; label: string }> = {
  small: { card: "w-9 h-12", icon: "text-base", label: "text-[9px]" },
  medium: { card: "w-10 h-14", icon: "text-lg", label: "text-[9px]" },
  large: { card: "w-24 h-32", icon: "text-4xl", label: "text-sm" },
};

export function RoleCard({
  role,
  revealed = true,
  size: sizeProp,
  small = false,
  interactive = true,
}: RoleCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  const size: RoleCardSize = sizeProp ?? (small ? "small" : "medium");
  const sizeConfig = SIZE_CLASSES[size];

  const handleClick = () => {
    if (interactive && role && revealed) {
      setShowDetail(true);
    }
  };

  const cardClassName = interactive && role && revealed ? "cursor-pointer" : "";

  // 不明カード (role === null)
  if (!role) {
    return (
      <div className={`${sizeConfig.card} bg-gray-800 rounded border border-gray-600 flex items-center justify-center opacity-80`}>
        <span className={`material-icons text-gray-400 ${sizeConfig.icon}`}>question_mark</span>
      </div>
    );
  }

  // 未公開カード
  if (!revealed) {
    return (
      <div className={`${sizeConfig.card} glass-card rounded border border-[var(--color-border)] flex items-center justify-center`}>
        <span className={`material-icons text-[var(--color-text-muted)] ${sizeConfig.icon}`}>help_outline</span>
      </div>
    );
  }

  const colors = ROLE_CARD_COLORS[role];

  return (
    <>
      <div
        onClick={handleClick}
        className={`${sizeConfig.card} ${colors.bg} rounded border ${colors.border} flex flex-col items-center justify-center ${cardClassName}`}
      >
        <span className={`material-icons ${colors.text} ${sizeConfig.icon}`}>
          {ROLE_MATERIAL_ICONS[role]}
        </span>
        {size === "large" && (
          <span className={`${colors.text} ${sizeConfig.label} font-bold mt-1`}>
            {ROLE_NAMES[role]}
          </span>
        )}
      </div>
      {showDetail && (
        <RoleDetailModal role={role} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
