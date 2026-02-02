"use client";

import type { GameOptions } from "@/lib/game";

interface GameOptionsSettingsProps {
  options: GameOptions;
  onChange: (options: GameOptions) => void;
  disabled?: boolean;
}

export function GameOptionsSettings({
  options,
  onChange,
  disabled = false,
}: GameOptionsSettingsProps) {
  return (
    <div className="space-y-4">
      <label className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-bold text-gray-200">平和村無し</div>
          <div className="text-[10px] text-gray-500 mt-0.5">
            プレイヤーに人狼が1人もいない配布を防ぎます
          </div>
        </div>
        <input
          type="checkbox"
          checked={options.noPeaceVillage}
          onChange={(e) => onChange({ ...options, noPeaceVillage: e.target.checked })}
          disabled={disabled}
          className="w-5 h-5 rounded accent-[var(--color-primary)] shrink-0"
        />
      </label>
    </div>
  );
}
