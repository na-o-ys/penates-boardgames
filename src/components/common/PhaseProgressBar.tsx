"use client";

type GamePhase = "NIGHT" | "DAY" | "VOTING";

interface PhaseProgressBarProps {
  currentPhase: GamePhase;
}

const STEPS = [
  { key: "NIGHT" as const, label: "NIGHT" },
  { key: "DAY" as const, label: "DISCUSSION" },
  { key: "VOTING" as const, label: "VOTING" },
];

const PHASE_INDEX: Record<GamePhase, number> = {
  NIGHT: 0,
  DAY: 1,
  VOTING: 2,
};

export function PhaseProgressBar({ currentPhase }: PhaseProgressBarProps) {
  const activeIndex = PHASE_INDEX[currentPhase];

  return (
    <div className="flex items-center justify-center gap-0 py-2 px-4">
      {STEPS.map((step, i) => {
        const isCompleted = i < activeIndex;
        const isActive = i === activeIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* ステップ */}
            <div className="flex items-center gap-1.5">
              <div
                className={`w-2 h-2 rounded-full ${
                  isCompleted || isActive
                    ? "bg-[var(--color-primary)]"
                    : "border border-[var(--color-text-muted)] bg-transparent"
                }`}
              />
              <span
                className={`text-[10px] font-semibold tracking-wider ${
                  isActive
                    ? "text-[var(--color-primary)]"
                    : isCompleted
                    ? "text-[var(--color-primary)]/70"
                    : "text-[var(--color-text-muted)]"
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* コネクターライン */}
            {i < STEPS.length - 1 && (
              <div
                className={`w-6 h-[2px] mx-2 ${
                  i < activeIndex
                    ? "bg-[var(--color-primary)]"
                    : "bg-[var(--color-text-muted)]/30"
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
