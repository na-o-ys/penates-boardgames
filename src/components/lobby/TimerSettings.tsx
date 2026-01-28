"use client";

interface TimerSettingsProps {
  nightDuration: number;
  dayDuration: number;
  votingDuration: number;
  playerCount: number;
  onChange: (settings: { nightDuration?: number; dayDuration?: number; votingDuration?: number }) => void;
  disabled?: boolean;
}

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function formatLabel(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  return `${seconds / 60}m`;
}

interface PhaseSliderConfig {
  label: string;
  key: "nightDuration" | "dayDuration" | "votingDuration";
  min: number;
  max: number;
  step: number;
  dotColor: string;
}

const PHASE_CONFIGS: PhaseSliderConfig[] = [
  { label: "夜フェーズ", key: "nightDuration", min: 10, max: 180, step: 10, dotColor: "bg-indigo-500" },
  { label: "議論フェーズ", key: "dayDuration", min: 10, max: 600, step: 10, dotColor: "bg-yellow-500" },
  { label: "投票フェーズ", key: "votingDuration", min: 10, max: 60, step: 10, dotColor: "bg-emerald-500" },
];

export function TimerSettings({
  nightDuration,
  dayDuration,
  votingDuration,
  onChange,
  disabled = false,
}: TimerSettingsProps) {
  const values: Record<string, number> = {
    nightDuration,
    dayDuration,
    votingDuration,
  };

  return (
    <div data-testid="timer-settings" className="space-y-6">
      {PHASE_CONFIGS.map((config) => {
        const value = values[config.key];
        return (
          <div key={config.key}>
            <div className="flex justify-between items-end mb-2">
              <div className="flex items-center">
                <span className={`w-2 h-2 rounded-full ${config.dotColor} mr-2`} />
                <span className="text-sm font-bold text-gray-200">{config.label}</span>
              </div>
              <div className="font-[family-name:var(--font-display)] text-[var(--color-primary)] text-xl font-bold bg-black/40 px-2 rounded border border-white/5">
                {formatDuration(value)}
              </div>
            </div>
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step}
              value={value}
              onChange={(e) => onChange({ [config.key]: Number(e.target.value) })}
              disabled={disabled}
              className="w-full"
              data-testid={`${config.key}-slider`}
            />
            <div className="flex justify-between text-[10px] text-gray-500 mt-1 font-mono">
              <span>{formatLabel(config.min)}</span>
              <span>{formatLabel(config.max)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
