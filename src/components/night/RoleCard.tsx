"use client";

import { useState } from "react";
import Image from "next/image";
import { ROLE_NAMES, type Role } from "@/lib/game";
import { RoleDetailModal } from "../common/RoleDetailModal";

const ROLE_IMAGES: Partial<Record<Role, string>> = {
  VILLAGER: "/images/roles/villager.jpeg",
  SEER: "/images/roles/seer.jpeg",
  ROBBER: "/images/roles/robber.jpeg",
  HUNTER: "/images/roles/hunter.jpeg",
  TANNER: "/images/roles/tanner.jpeg",
  WEREWOLF: "/images/roles/werewolf.jpeg",
};

const ROLE_ICONS: Record<Role, string> = {
  WEREWOLF: "🐺",
  SEER: "🔮",
  ROBBER: "🦹",
  TROUBLEMAKER: "🃏",
  VILLAGER: "👨‍🌾",
  HUNTER: "🏹",
  TANNER: "💀",
};

interface RoleCardProps {
  role: Role | null;
  revealed?: boolean;
  small?: boolean;
  interactive?: boolean;
}

export function RoleCard({
  role,
  revealed = true,
  small = false,
  interactive = true,
}: RoleCardProps) {
  const [showDetail, setShowDetail] = useState(false);

  const handleClick = () => {
    if (interactive && role && revealed) {
      setShowDetail(true);
    }
  };

  const cardClassName = interactive && role && revealed ? "cursor-pointer" : "";

  if (!role) {
    return (
      <div
        className={`flex flex-col items-center justify-center rounded-xl glass-card ${
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
        className={`flex flex-col items-center justify-center rounded-xl glass-card border-[var(--color-border)] ${
          small ? "w-16 h-24" : "w-32 h-44"
        }`}
      >
        <span className={small ? "text-xl" : "text-4xl"}>🎴</span>
      </div>
    );
  }

  const imageSrc = ROLE_IMAGES[role];

  if (imageSrc) {
    return (
      <>
        <div
          onClick={handleClick}
          className={`relative overflow-hidden rounded-xl border border-[var(--color-border)] ${
            small ? "w-16 h-24" : "w-32 h-44"
          } ${cardClassName}`}
        >
          <Image
            src={imageSrc}
            alt={ROLE_NAMES[role]}
            fill
            className="object-cover"
          />
        </div>
        {showDetail && (
          <RoleDetailModal role={role} onClose={() => setShowDetail(false)} />
        )}
      </>
    );
  }

  return (
    <>
      <div
        onClick={handleClick}
        className={`flex flex-col items-center justify-center rounded-xl glass-card ${
          small ? "w-16 h-24 p-2" : "w-32 h-44 p-4"
        } ${cardClassName}`}
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
      {showDetail && (
        <RoleDetailModal role={role} onClose={() => setShowDetail(false)} />
      )}
    </>
  );
}
