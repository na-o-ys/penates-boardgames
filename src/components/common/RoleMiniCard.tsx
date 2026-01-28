import type { Role } from "@/lib/game";
import { ROLE_NAMES, ROLE_MATERIAL_ICONS, ROLE_CARD_COLORS } from "@/lib/game";

export function RoleMiniCard({ role, size = "medium", tappable = false }: {
  role: Role;
  size?: "small" | "medium";
  tappable?: boolean;
}) {
  const colors = ROLE_CARD_COLORS[role];
  const sizeClass = size === "small" ? "w-9 h-12" : "w-10 h-14";
  const iconSize = size === "small" ? "text-base" : "text-lg";
  const labelSize = size === "small" ? "text-[8px]" : "text-[9px]";
  const labelColor = size === "small" ? "text-gray-400" : colors.text;

  const borderShadow = tappable
    ? "border-amber-400/50 shadow-[0_0_12px_rgba(212,175,55,0.3)] group-hover/player:border-amber-400 group-hover/player:shadow-[0_0_18px_rgba(212,175,55,0.5)]"
    : `${colors.border} ${size === "medium" ? "shadow-[0_0_15px_rgba(212,175,55,0.2)]" : ""}`;

  return (
    <div className="flex flex-col items-center">
      <div className={`${sizeClass} ${colors.bg} rounded border flex items-center justify-center transition-all ${borderShadow}`}>
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

export function UnknownMiniCard({ tappable = false, selected = false }: {
  tappable?: boolean;
  selected?: boolean;
} = {}) {
  if (tappable) {
    const selectedClass = selected
      ? "border-amber-400 ring-2 ring-amber-400 shadow-[0_0_20px_rgba(212,175,55,0.5)]"
      : "border-amber-400/50 shadow-[0_0_12px_rgba(212,175,55,0.3)] group-hover/player:border-amber-400 group-hover/player:shadow-[0_0_18px_rgba(212,175,55,0.5)]";

    return (
      <div className="flex flex-col items-center">
        <div className={`w-10 h-14 bg-gray-800 rounded border flex items-center justify-center transition-all ${selectedClass}`}>
          <span className="material-icons text-amber-300">question_mark</span>
        </div>
        <span className="text-[9px] text-amber-300/80 mt-0.5 font-bold">不明</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <div className="w-10 h-14 bg-gray-800 rounded border border-gray-600 flex items-center justify-center opacity-80">
        <span className="material-icons text-gray-400">question_mark</span>
      </div>
      <span className="text-[9px] text-gray-400 mt-0.5 font-bold">不明</span>
    </div>
  );
}
