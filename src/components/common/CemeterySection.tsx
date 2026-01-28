import type { Role } from "@/lib/game";
import { ROLE_NAMES, ROLE_MATERIAL_ICONS, ROLE_CARD_COLORS } from "@/lib/game";

interface CemeterySectionProps {
  centerRoles: Record<string, Role | undefined>;
  onTapCenter?: () => void;
}

export function CemeterySection({ centerRoles, onTapCenter }: CemeterySectionProps) {
  const isTappable = !!onTapCenter;

  return (
    <div className="mt-6 border-t border-white/20 pt-4">
      <h3 className="text-center text-[var(--color-text-muted)] text-xs uppercase tracking-widest mb-3 font-[family-name:var(--font-display)]">
        墓地（中央カード）
      </h3>
      <div
        className={`flex justify-center space-x-4 ${isTappable ? "cursor-pointer group" : ""}`}
        onClick={isTappable ? onTapCenter : undefined}
        role={isTappable ? "button" : undefined}
      >
        {["CENTER_0", "CENTER_1"].map((centerId) => {
          const role = centerRoles[centerId];
          return (
            <div key={centerId} className="flex flex-col items-center">
              {role ? (
                <>
                  <div className={`w-12 h-16 ${ROLE_CARD_COLORS[role].bg} rounded border ${ROLE_CARD_COLORS[role].border} flex items-center justify-center opacity-80`}>
                    <span className={`material-icons ${ROLE_CARD_COLORS[role].text}`}>
                      {ROLE_MATERIAL_ICONS[role]}
                    </span>
                  </div>
                  <span className={`text-[9px] ${ROLE_CARD_COLORS[role].text} mt-1 font-bold`}>
                    {ROLE_NAMES[role]}
                  </span>
                </>
              ) : (
                <>
                  <div className={`w-12 h-16 bg-gray-800 rounded border flex items-center justify-center transition-all ${
                    isTappable
                      ? "border-amber-400/50 shadow-[0_0_12px_rgba(212,175,55,0.3)] group-hover:border-amber-400 group-hover:shadow-[0_0_18px_rgba(212,175,55,0.5)] active:scale-95"
                      : "border-gray-600 opacity-80"
                  }`}>
                    <span className={`material-icons ${isTappable ? "text-amber-300" : "text-gray-400"}`}>question_mark</span>
                  </div>
                  <span className={`text-[9px] mt-1 ${isTappable ? "text-amber-300/80 font-bold" : "text-gray-400"}`}>不明</span>
                </>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
