"use client";

import { useState } from "react";
import {
  ROLE_NAMES,
  ROLE_ACCENT_COLORS,
  DISABLED_ROLES,
  type Role,
} from "@/lib/game";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { RoleGalleryCard, VillagerBar } from "../common/RoleGalleryCard";

const SPECIAL_ROLES = ([
  "WEREWOLF",
  "SEER",
  "ROBBER",
  "TROUBLEMAKER",
  "HUNTER",
  "TANNER",
] as const satisfies readonly Role[]).filter((r) => !DISABLED_ROLES.has(r));

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
        {SPECIAL_ROLES.map((role) => {
          const count = getRoleCount(role);
          return (
            <RoleGalleryCard
              key={role}
              role={role}
              onClick={() => setDetailRole(role)}
              disabled={disabled}
            >
              <CounterControl
                count={count}
                disabled={disabled}
                onAdd={() => handleAdd(role)}
                onRemove={() => handleRemove(role)}
              />
            </RoleGalleryCard>
          );
        })}

        <VillagerBar
          onClick={() => setDetailRole("VILLAGER")}
          disabled={disabled}
        >
          <CounterControl
            count={getRoleCount("VILLAGER")}
            disabled={disabled}
            onAdd={() => handleAdd("VILLAGER")}
            onRemove={() => handleRemove("VILLAGER")}
          />
        </VillagerBar>
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
