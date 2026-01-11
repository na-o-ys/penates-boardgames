"use client";

import { ROLE_NAMES, type Role } from "@/lib/game";

const ALL_ROLES: Role[] = [
  "WEREWOLF",
  "SEER",
  "ROBBER",
  "TROUBLEMAKER",
  "VILLAGER",
  "TANNER",
];

const ROLE_COLORS: Record<Role, string> = {
  WEREWOLF: "bg-red-600 hover:bg-red-700",
  SEER: "bg-purple-600 hover:bg-purple-700",
  ROBBER: "bg-blue-600 hover:bg-blue-700",
  TROUBLEMAKER: "bg-orange-600 hover:bg-orange-700",
  VILLAGER: "bg-green-600 hover:bg-green-700",
  TANNER: "bg-amber-700 hover:bg-amber-800",
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
      {/* 役職選択ボタン */}
      <div className="grid grid-cols-2 gap-2">
        {ALL_ROLES.map((role) => {
          const count = getRoleCount(role);
          return (
            <div
              key={role}
              data-testid={`role-${role}`}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                disabled ? "bg-gray-800" : ROLE_COLORS[role]
              } ${disabled ? "opacity-60" : ""}`}
            >
              <span className="text-white text-sm font-medium">
                {ROLE_NAMES[role]}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleRemove(role)}
                  disabled={disabled || count === 0}
                  className="w-6 h-6 flex items-center justify-center bg-black/30 hover:bg-black/50 disabled:opacity-30 rounded text-white text-sm"
                >
                  -
                </button>
                <span data-testid="role-count" className="w-6 text-center text-white font-bold">
                  {count}
                </span>
                <button
                  onClick={() => handleAdd(role)}
                  disabled={disabled}
                  className="w-6 h-6 flex items-center justify-center bg-black/30 hover:bg-black/50 disabled:opacity-30 rounded text-white text-sm"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 選択状況 */}
      <div className="flex items-center justify-between px-3 py-2 bg-gray-800 rounded-lg">
        <span className="text-gray-300">選択枚数</span>
        <span
          className={`font-bold ${
            selectedRoles.length === requiredCount
              ? "text-green-400"
              : "text-red-400"
          }`}
        >
          {selectedRoles.length} / {requiredCount}
        </span>
      </div>

      {/* 選択された役職一覧 */}
      {selectedRoles.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selectedRoles.map((role, index) => (
            <span
              key={index}
              className={`px-2 py-1 text-xs text-white rounded ${ROLE_COLORS[role]}`}
            >
              {ROLE_NAMES[role]}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
