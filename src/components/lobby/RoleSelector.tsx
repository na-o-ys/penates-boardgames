"use client";

import { ROLE_NAMES, type Role } from "@/lib/game";

const ALL_ROLES: Role[] = [
  "WEREWOLF",
  "SEER",
  "ROBBER",
  "TROUBLEMAKER",
  "VILLAGER",
  "HUNTER",
  "TANNER",
];

const ROLE_BORDER_COLORS: Record<Role, string> = {
  WEREWOLF: "border-[var(--color-role-werewolf)]",
  SEER: "border-[var(--color-role-seer)]",
  ROBBER: "border-[var(--color-role-robber)]",
  TROUBLEMAKER: "border-[var(--color-role-troublemaker)]",
  VILLAGER: "border-[var(--color-role-villager)]",
  HUNTER: "border-[var(--color-role-hunter)]",
  TANNER: "border-[var(--color-role-tanner)]",
};

const ROLE_TEXT_COLORS: Record<Role, string> = {
  WEREWOLF: "text-[var(--color-role-werewolf)]",
  SEER: "text-[var(--color-role-seer)]",
  ROBBER: "text-[var(--color-role-robber)]",
  TROUBLEMAKER: "text-[var(--color-role-troublemaker)]",
  VILLAGER: "text-[var(--color-role-villager)]",
  HUNTER: "text-[var(--color-role-hunter)]",
  TANNER: "text-[var(--color-role-tanner)]",
};

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
      <div className="grid grid-cols-2 gap-2">
        {ALL_ROLES.map((role) => {
          const count = getRoleCount(role);
          return (
            <div
              key={role}
              data-testid={`role-${role}`}
              className={`flex items-center justify-between px-3 py-2 rounded-xl glass-panel border-l-4 ${
                ROLE_BORDER_COLORS[role]
              } ${disabled ? "opacity-60" : ""}`}
            >
              <span className={`text-sm font-medium ${ROLE_TEXT_COLORS[role]}`}>
                {ROLE_NAMES[role]}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRemove(role)}
                  disabled={disabled || count === 0}
                  className="w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-black/60 disabled:opacity-30 rounded-lg text-white text-sm transition-colors"
                >
                  -
                </button>
                <span data-testid="role-count" className="w-6 text-center text-[var(--color-primary)] font-bold">
                  {count}
                </span>
                <button
                  onClick={() => handleAdd(role)}
                  disabled={disabled}
                  className="w-7 h-7 flex items-center justify-center bg-black/40 hover:bg-black/60 disabled:opacity-30 rounded-lg text-white text-sm transition-colors"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
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
              className={`px-2 py-1 text-xs rounded-lg glass-panel border-l-2 ${ROLE_BORDER_COLORS[role]} ${ROLE_TEXT_COLORS[role]}`}
            >
              {ROLE_NAMES[role]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
