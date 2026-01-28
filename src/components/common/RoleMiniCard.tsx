import type { Role } from "@/lib/game";
import { ROLE_NAMES, ROLE_MATERIAL_ICONS, ROLE_CARD_COLORS } from "@/lib/game";

export function RoleMiniCard({ role, size = "medium" }: { role: Role; size?: "small" | "medium" }) {
  const colors = ROLE_CARD_COLORS[role];
  const sizeClass = size === "small" ? "w-9 h-12" : "w-10 h-14";
  const iconSize = size === "small" ? "text-base" : "text-lg";
  const labelSize = size === "small" ? "text-[8px]" : "text-[9px]";
  const labelColor = size === "small" ? "text-gray-400" : colors.text;

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClass} ${colors.bg} rounded border ${colors.border} flex items-center justify-center ${size === "medium" ? "shadow-[0_0_15px_rgba(212,175,55,0.2)]" : ""}`}>
        <span className={`material-icons ${colors.text} ${iconSize}`}>
          {ROLE_MATERIAL_ICONS[role]}
        </span>
      </div>
      <span className={`${labelSize} ${labelColor} mt-0.5 font-bold`}>
        {ROLE_NAMES[role]}
      </span>
    </div>
  );
}

export function UnknownMiniCard() {
  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-14 bg-gray-800 rounded border border-gray-600 flex items-center justify-center opacity-80">
        <span className="material-icons text-gray-400">question_mark</span>
      </div>
      <span className="text-[9px] text-gray-400 mt-0.5 font-bold">???</span>
    </div>
  );
}
