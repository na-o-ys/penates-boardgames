import {
  ROLE_NAMES,
  ROLE_DESCRIPTIONS,
  ROLE_MATERIAL_ICONS,
  ROLE_CARD_COLORS,
  TEAM_COLORS,
  type Role,
} from "@/lib/game";

interface RoleDetailContentProps {
  role: Role;
}

export function RoleDetailContent({ role }: RoleDetailContentProps) {
  const description = ROLE_DESCRIPTIONS[role];
  const colors = ROLE_CARD_COLORS[role];

  return (
    <>
      <div className="flex flex-col items-center mb-4">
        <div className={`w-20 h-20 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center mb-3`}>
          <span className={`material-icons text-5xl ${colors.text}`}>
            {ROLE_MATERIAL_ICONS[role]}
          </span>
        </div>

        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">
          {ROLE_NAMES[role]}
        </h2>
        <span className={`text-sm font-semibold ${TEAM_COLORS[description.team] || "text-[var(--color-text-secondary)]"}`}>
          {description.team}
        </span>
      </div>

      <div className="glass-panel rounded-xl p-4 mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">能力</h3>
        <p className="text-white text-sm leading-relaxed">
          {description.ability}
        </p>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">勝利条件</h3>
        <p className="text-white text-sm leading-relaxed">
          {description.winCondition}
        </p>
      </div>
    </>
  );
}
