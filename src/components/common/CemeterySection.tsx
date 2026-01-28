import type { Role } from "@/lib/game";
import { RoleMiniCard, UnknownMiniCard } from "./RoleMiniCard";

interface CemeterySectionProps {
  centerRoles: Record<string, Role | undefined>;
  onTapCenter?: () => void;
}

export function CemeterySection({ centerRoles, onTapCenter }: CemeterySectionProps) {
  const isTappable = !!onTapCenter;

  return (
    <div className="mt-3 pt-2">
      <h3 className="text-center text-[var(--color-text-muted)] text-xs uppercase tracking-widest mb-3 font-[family-name:var(--font-display)]">
        GRAVEYARD
      </h3>
      <div
        className={`flex justify-center space-x-4 ${isTappable ? "cursor-pointer group/player" : ""}`}
        onClick={isTappable ? onTapCenter : undefined}
        role={isTappable ? "button" : undefined}
      >
        {["CENTER_0", "CENTER_1"].map((centerId) => {
          const role = centerRoles[centerId];
          return (
            <div key={centerId}>
              {role ? (
                <RoleMiniCard role={role} size="medium" />
              ) : (
                <UnknownMiniCard tappable={isTappable} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
