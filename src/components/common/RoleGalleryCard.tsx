import type { ReactNode } from "react";
import {
  ROLES,
  TEAM_BORDER_COLORS,
  type Role,
} from "@/lib/game";

interface RoleGalleryCardProps {
  role: Role;
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export function RoleGalleryCard({ role, onClick, disabled = false, children }: RoleGalleryCardProps) {
  const roleDef = ROLES[role];
  const teamBorder = TEAM_BORDER_COLORS[roleDef.team];

  return (
    <div
      data-testid={`role-${role}`}
      className={`bg-slate-900/80 border ${teamBorder.border30} rounded-xl p-3 flex flex-col items-center shadow-lg relative overflow-hidden ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-500/10 opacity-60" />

      <button
        type="button"
        onClick={onClick}
        className="flex flex-col items-center relative z-10 cursor-pointer"
      >
        <div className={`w-12 h-12 rounded-full bg-slate-800 border ${roleDef.accentColors.iconBorder} flex items-center justify-center mb-2 shadow-inner`}>
          <span className={`material-icons ${roleDef.accentColors.iconText} text-2xl`}>
            {roleDef.materialIcon}
          </span>
        </div>
        <div className="text-sm font-bold text-gray-100">
          {roleDef.name}
        </div>
        <div className="text-[10px] text-gray-400 mb-2 line-clamp-2 min-h-[2.5em] text-center">
          {roleDef.description.ability}
        </div>
      </button>

      <div className="relative z-10 w-full">
        {children}
      </div>
    </div>
  );
}

interface VillagerBarProps {
  onClick?: () => void;
  disabled?: boolean;
  children: ReactNode;
}

export function VillagerBar({ onClick, disabled = false, children }: VillagerBarProps) {
  const villagerDef = ROLES.VILLAGER;

  return (
    <div
      data-testid="role-VILLAGER"
      className={`col-span-2 bg-slate-900/80 border ${TEAM_BORDER_COLORS.VILLAGE.border30} rounded-xl p-3 flex items-center justify-between shadow-lg relative overflow-hidden px-4 ${
        disabled ? "opacity-60" : ""
      }`}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-500/10 opacity-50" />

      <button
        type="button"
        onClick={onClick}
        className="flex items-center space-x-3 relative z-10 cursor-pointer"
      >
        <div className={`w-10 h-10 rounded-full bg-slate-800 border ${villagerDef.accentColors.iconBorder} flex items-center justify-center shadow-inner`}>
          <span className={`material-icons ${villagerDef.accentColors.iconText} text-xl`}>
            {villagerDef.materialIcon}
          </span>
        </div>
        <div className="text-sm font-bold text-gray-100">
          {villagerDef.name}
        </div>
      </button>

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
