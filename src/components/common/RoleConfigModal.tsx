"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { DISABLED_ROLES, type Role } from "@/lib/game";
import { RoleDetailContent } from "./RoleDetailContent";
import { RoleGalleryCard, VillagerBar } from "./RoleGalleryCard";

const SPECIAL_ROLES = ([
  "WEREWOLF",
  "ALPHA_WOLF",
  "MADMAN",
  "SEER",
  "ROBBER",
  "TROUBLEMAKER",
  "HUNTER",
  "TANNER",
] as const satisfies readonly Role[]).filter((r) => !DISABLED_ROLES.has(r));

interface RoleConfigModalProps {
  roles: Role[];
  onClose: () => void;
}

export function RoleConfigModal({ roles, onClose }: RoleConfigModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const getRoleCount = (role: Role) => roles.filter((r) => r === role).length;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  const specialRolesWithCount = SPECIAL_ROLES.filter((role) => getRoleCount(role) > 0);
  const villagerCount = getRoleCount("VILLAGER");

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none" />

      <div className="relative glass-card rounded-xl p-6 max-w-sm w-full max-h-[80vh] overflow-y-auto">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors z-10"
          aria-label="閉じる"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        {selectedRole ? (
          <div>
            <button
              onClick={() => setSelectedRole(null)}
              className="flex items-center gap-1 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors mb-4"
            >
              <span className="material-icons text-sm">arrow_back</span>
              <span className="text-sm">一覧に戻る</span>
            </button>
            <RoleDetailContent role={selectedRole} />
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="font-[family-name:var(--font-display)] text-xl font-bold gold-text text-center">
              役職構成
            </h2>

            <div className="grid grid-cols-2 gap-3">
              {specialRolesWithCount.map((role) => {
                const count = getRoleCount(role);
                return (
                  <RoleGalleryCard key={role} role={role} onClick={() => setSelectedRole(role)}>
                    <div className="flex justify-center">
                      <span className="font-[family-name:var(--font-display)] font-bold text-lg text-[var(--color-primary)]">
                        ×{count}
                      </span>
                    </div>
                  </RoleGalleryCard>
                );
              })}

              {villagerCount > 0 && (
                <VillagerBar onClick={() => setSelectedRole("VILLAGER")}>
                  <span className="font-[family-name:var(--font-display)] font-bold text-lg text-[var(--color-primary)]">
                    ×{villagerCount}
                  </span>
                </VillagerBar>
              )}
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
