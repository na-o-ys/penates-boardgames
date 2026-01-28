"use client";

import { useState } from "react";
import {
  ROLE_NAMES,
  ROLE_MATERIAL_ICONS,
  ROLE_DESCRIPTIONS,
  type Role,
} from "@/lib/game";
import { RoleDetailModal } from "../common/RoleDetailModal";

const SPECIAL_ROLES: Role[] = [
  "WEREWOLF",
  "SEER",
  "ROBBER",
  "TROUBLEMAKER",
  "HUNTER",
  "TANNER",
];

const ROLE_ACCENT_COLORS: Record<Role, {
  border30: string;
  gradient: string;
  iconBorder: string;
  iconText: string;
}> = {
  WEREWOLF: { border30: "border-red-500/30", gradient: "to-red-500/10", iconBorder: "border-red-500/50", iconText: "text-red-400" },
  SEER: { border30: "border-indigo-400/30", gradient: "to-indigo-400/10", iconBorder: "border-indigo-400/50", iconText: "text-indigo-400" },
  ROBBER: { border30: "border-gray-400/30", gradient: "to-gray-400/10", iconBorder: "border-gray-400/50", iconText: "text-gray-300" },
  TROUBLEMAKER: { border30: "border-emerald-400/30", gradient: "to-emerald-400/10", iconBorder: "border-emerald-400/50", iconText: "text-emerald-400" },
  VILLAGER: { border30: "border-slate-500/30", gradient: "to-slate-500/10", iconBorder: "border-slate-500/50", iconText: "text-slate-300" },
  HUNTER: { border30: "border-green-400/30", gradient: "to-green-400/10", iconBorder: "border-green-400/50", iconText: "text-green-400" },
  TANNER: { border30: "border-orange-400/30", gradient: "to-orange-400/10", iconBorder: "border-orange-400/50", iconText: "text-orange-400" },
};

function CounterControl({
  count,
  disabled,
  onAdd,
  onRemove,
}: {
  count: number;
  disabled: boolean;
  onAdd: () => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex items-center justify-center bg-black/40 rounded-lg p-1 space-x-3 border border-white/5">
      <button
        onClick={onRemove}
        disabled={disabled || count === 0}
        className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600 disabled:opacity-30 text-white flex items-center justify-center transition-colors"
      >
        <span className="material-icons text-sm">remove</span>
      </button>
      <span
        data-testid="role-count"
        className="font-[family-name:var(--font-display)] font-bold text-lg text-[var(--color-primary)] w-4 text-center"
      >
        {count}
      </span>
      <button
        onClick={onAdd}
        disabled={disabled}
        className="w-6 h-6 rounded bg-[var(--color-primary)] hover:bg-yellow-400 disabled:opacity-30 text-slate-900 flex items-center justify-center transition-colors shadow-[0_0_10px_rgba(212,175,55,0.3)]"
      >
        <span className="material-icons text-sm">add</span>
      </button>
    </div>
  );
}

interface RoleSelectorProps {
  playerCount: number;
  selectedRoles: Role[];
  onChange: (roles: Role[]) => void;
  disabled?: boolean;
}

export function RoleSelector({
  playerCount,
  selectedRoles,
  onChange,
  disabled = false,
}: RoleSelectorProps) {
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const requiredCount = playerCount + 2;

  const getRoleCount = (role: Role) =>
    selectedRoles.filter((r) => r === role).length;

  const handleAdd = (role: Role) => {
    if (disabled) return;
    onChange([...selectedRoles, role]);
  };

  const handleRemove = (role: Role) => {
    if (disabled) return;
    const index = selectedRoles.lastIndexOf(role);
    if (index >= 0) {
      const newRoles = [...selectedRoles];
      newRoles.splice(index, 1);
      onChange(newRoles);
    }
  };

  return (
    <div className="space-y-4" data-testid="role-selector">
      <div className="grid grid-cols-2 gap-3">
        {/* 特殊役職カード */}
        {SPECIAL_ROLES.map((role) => {
          const count = getRoleCount(role);
          const accent = ROLE_ACCENT_COLORS[role];
          return (
            <div
              key={role}
              data-testid={`role-${role}`}
              className={`bg-slate-900/80 border ${accent.border30} rounded-xl p-3 flex flex-col items-center shadow-lg relative overflow-hidden ${
                disabled ? "opacity-60" : ""
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-500/10 opacity-60" />

              <button
                type="button"
                onClick={() => setDetailRole(role)}
                className="flex flex-col items-center relative z-10 cursor-pointer"
              >
                <div className={`w-12 h-12 rounded-full bg-slate-800 border ${accent.iconBorder} flex items-center justify-center mb-2 shadow-inner`}>
                  <span className={`material-icons ${accent.iconText} text-2xl`}>
                    {ROLE_MATERIAL_ICONS[role]}
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-100">
                  {ROLE_NAMES[role]}
                </div>
                <div className="text-[10px] text-gray-400 mb-2 line-clamp-2 min-h-[2.5em]">
                  {ROLE_DESCRIPTIONS[role].ability}
                </div>
              </button>

              <div className="relative z-10 w-full">
                <CounterControl
                  count={count}
                  disabled={disabled}
                  onAdd={() => handleAdd(role)}
                  onRemove={() => handleRemove(role)}
                />
              </div>
            </div>
          );
        })}

        {/* 村人バー */}
        {(() => {
          const count = getRoleCount("VILLAGER");
          const accent = ROLE_ACCENT_COLORS.VILLAGER;
          return (
            <div
              key="VILLAGER"
              data-testid="role-VILLAGER"
              className={`col-span-2 bg-slate-900/80 border ${accent.border30} rounded-xl p-3 flex items-center justify-between shadow-lg relative overflow-hidden px-4 ${
                disabled ? "opacity-60" : ""
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-slate-500/10 opacity-50" />

              <button
                type="button"
                onClick={() => setDetailRole("VILLAGER")}
                className="flex items-center space-x-3 relative z-10 cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-full bg-slate-800 border ${accent.iconBorder} flex items-center justify-center shadow-inner`}>
                  <span className={`material-icons ${accent.iconText} text-xl`}>
                    {ROLE_MATERIAL_ICONS.VILLAGER}
                  </span>
                </div>
                <div className="text-sm font-bold text-gray-100">
                  {ROLE_NAMES.VILLAGER}
                </div>
              </button>

              <div className="relative z-10">
                <CounterControl
                  count={count}
                  disabled={disabled}
                  onAdd={() => handleAdd("VILLAGER")}
                  onRemove={() => handleRemove("VILLAGER")}
                />
              </div>
            </div>
          );
        })()}
      </div>

      <div className="flex items-center justify-between px-3 py-2 glass-panel rounded-xl">
        <span className="text-[var(--color-text-secondary)]">選択枚数</span>
        <span
          className={`font-bold ${
            selectedRoles.length === requiredCount
              ? "text-[var(--color-ready)]"
              : "text-[var(--color-error)]"
          }`}
        >
          {selectedRoles.length} / {requiredCount}
        </span>
      </div>

      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedRoles.map((role, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs rounded-lg glass-panel border-l-2 ${ROLE_ACCENT_COLORS[role].border30} ${ROLE_ACCENT_COLORS[role].iconText}`}
            >
              {ROLE_NAMES[role]}
            </span>
          ))}
        </div>
      )}

      {detailRole && (
        <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />
      )}
    </div>
  );
}
