"use client";

import { ROLE_NAMES, type Role } from "@/lib/game";

const ROLE_COLORS: Record<Role, string> = {
  WEREWOLF: "from-red-600 to-red-800",
  SEER: "from-purple-600 to-purple-800",
  ROBBER: "from-blue-600 to-blue-800",
  TROUBLEMAKER: "from-orange-600 to-orange-800",
  VILLAGER: "from-green-600 to-green-800",
  TANNER: "from-amber-700 to-amber-900",
};

const ROLE_ICONS: Record<Role, string> = {
  WEREWOLF: "🐺",
  SEER: "🔮",
  ROBBER: "🦹",
  TROUBLEMAKER: "🃏",
  VILLAGER: "👨‍🌾",
  TANNER: "💀",
};

interface RoleCardProps {
  role: Role | null;
  revealed?: boolean;
  small?: boolean;
}

export function RoleCard({ role, revealed = true, small = false }: RoleCardProps) {
  if (!role) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl bg-gray-700 ${
          small ? "w-16 h-24" : "w-32 h-44"
        }`}
      >
        <span className={small ? "text-xl" : "text-4xl"}>❓</span>
      </div>
    );
  }

  if (!revealed) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl bg-gradient-to-b from-gray-700 to-gray-900 ${
          small ? "w-16 h-24" : "w-32 h-44"
        }`}
      >
        <span className={small ? "text-xl" : "text-4xl"}>🎴</span>
      </div>
    );
  }

  return (
    <div
      className={`flex flex-col items-center justify-center rounded-xl bg-gradient-to-b ${
        ROLE_COLORS[role]
      } ${small ? "w-16 h-24 p-2" : "w-32 h-44 p-4"}`}
    >
      <span className={small ? "text-2xl mb-1" : "text-5xl mb-2"}>
        {ROLE_ICONS[role]}
      </span>
      <span
        className={`text-white font-bold text-center ${
          small ? "text-xs" : "text-sm"
        }`}
      >
        {ROLE_NAMES[role]}
      </span>
    </div>
  );
}
