"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { SELECTABLE_ROLES, type GameConfig, type Role } from "@/lib/game";
import { RoleDetailContent } from "./RoleDetailContent";
import { RoleGalleryCard, VillagerBar } from "./RoleGalleryCard";

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface RoleConfigModalProps {
  config: GameConfig;
  onClose: () => void;
}

export function RoleConfigModal({ config, onClose }: RoleConfigModalProps) {
  const [mounted, setMounted] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  const roles = config.roles;

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

  const specialRolesWithCount = SELECTABLE_ROLES.filter((role) => getRoleCount(role) > 0);
  const villagerCount = getRoleCount("VILLAGER");
  const options = config.options ?? { noPeaceVillage: false };

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

            {/* 設定セクション */}
            <div className="border-t border-white/10 pt-4">
              <h3 className="font-[family-name:var(--font-display)] text-base font-bold gold-text text-center mb-3">
                設定
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">夜フェーズ</span>
                  <span className="text-gray-200 font-mono">{formatDuration(config.nightDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">議論フェーズ</span>
                  <span className="text-gray-200 font-mono">{formatDuration(config.dayDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">投票フェーズ</span>
                  <span className="text-gray-200 font-mono">{formatDuration(config.votingDuration)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">平和村無し</span>
                  <span className={`font-bold ${options.noPeaceVillage ? "text-[var(--color-primary)]" : "text-gray-500"}`}>
                    {options.noPeaceVillage ? "ON" : "OFF"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
