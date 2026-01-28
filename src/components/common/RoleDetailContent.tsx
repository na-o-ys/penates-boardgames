import {
  ROLES,
  TEAM_COLORS,
  TEAM_BORDER_COLORS,
  type Role,
} from "@/lib/game";

interface RoleDetailContentProps {
  role: Role;
}

export function RoleDetailContent({ role }: RoleDetailContentProps) {
  const roleDef = ROLES[role];

  return (
    <>
      <div className="flex flex-col items-center mb-4">
        <div className={`w-20 h-20 rounded-full bg-slate-800 border-2 ${TEAM_BORDER_COLORS[roleDef.team].border} flex items-center justify-center mb-3`}>
          <span className={`material-icons text-5xl ${roleDef.accentColors.iconText}`}>
            {roleDef.materialIcon}
          </span>
        </div>

        <h2 className="font-[family-name:var(--font-display)] text-2xl font-bold gold-text">
          {roleDef.name}
        </h2>
        <span className={`text-sm font-semibold ${TEAM_COLORS[roleDef.description.team] || "text-[var(--color-text-secondary)]"}`}>
          {roleDef.description.team}
        </span>
      </div>

      <div className="glass-panel rounded-xl p-4 mb-3">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">能力</h3>
        <p className="text-white text-sm leading-relaxed">
          {roleDef.description.ability}
        </p>
      </div>

      <div className="glass-panel rounded-xl p-4">
        <h3 className="text-sm font-semibold text-[var(--color-text-secondary)] mb-2">勝利条件</h3>
        <p className="text-white text-sm leading-relaxed">
          {roleDef.description.winCondition}
        </p>
      </div>
    </>
  );
}
