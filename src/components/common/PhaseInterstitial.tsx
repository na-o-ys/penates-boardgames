"use client";

import { useEffect, useState } from "react";
import type { GamePhase } from "@/lib/game";

interface PhaseInterstitialProps {
  phase: GamePhase;
  onComplete: () => void;
}

const PHASE_CONFIG: Record<GamePhase, { title: string; subtitle?: string }> = {
  NIGHT: { title: "NIGHT PHASE", subtitle: "役職アクションを実行してください" },
  DAY: { title: "DISCUSSION", subtitle: "怪しい人を見つけましょう" },
  VOTING: { title: "VOTING", subtitle: "処刑する人を投票してください" },
  HUNTER_REVENGE: {
    title: "HUNTER",
    subtitle: "道連れにする相手を選んでください",
  },
  FINISHED: { title: "JUDGMENT..." },
};

const DURATION_MS: Record<GamePhase, number> = {
  NIGHT: 1500,
  DAY: 1500,
  VOTING: 1500,
  HUNTER_REVENGE: 1500,
  FINISHED: 2500,
};

const FADE_OUT_MS = 300;

export function PhaseInterstitial({ phase, onComplete }: PhaseInterstitialProps) {
  const [fadingOut, setFadingOut] = useState(false);
  const config = PHASE_CONFIG[phase];
  const duration = DURATION_MS[phase];

  useEffect(() => {
    const fadeOutTimer = setTimeout(() => {
      setFadingOut(true);
    }, duration - FADE_OUT_MS);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeOutTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[var(--color-bg-deep)] ${
        fadingOut ? "interstitial-fade-out" : "interstitial-fade-in"
      }`}
    >
      <h1 className="font-[family-name:var(--font-display)] font-black text-4xl gold-text tracking-[0.2em] interstitial-text">
        {config.title}
      </h1>
      {config.subtitle && (
        <p className="mt-4 text-[var(--color-text-secondary)] text-sm tracking-wider interstitial-text">
          {config.subtitle}
        </p>
      )}
    </div>
  );
}
