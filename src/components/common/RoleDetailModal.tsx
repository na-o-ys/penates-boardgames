"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Role } from "@/lib/game";
import { RoleDetailContent } from "./RoleDetailContent";

interface RoleDetailModalProps {
  role: Role;
  onClose: () => void;
}

export function RoleDetailModal({ role, onClose }: RoleDetailModalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm pointer-events-none" />

      <div className="relative glass-card rounded-xl p-6 max-w-sm w-full">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
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

        <RoleDetailContent role={role} />
      </div>
    </div>,
    document.body
  );
}
