import type { Role } from "@/lib/game";
import { RoleMiniCard } from "./RoleMiniCard";

interface NightResultModalProps {
  title: string;
  targets: { name: string; role: Role }[];
  onConfirm: () => void;
}

export function NightResultModal({ title, targets, onConfirm }: NightResultModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />
      <div className="relative glass-card rounded-xl p-6 mx-4 max-w-sm w-full space-y-5">
        {targets.length > 0 && (
          <div className="flex justify-center gap-4">
            {targets.map((target) => (
              <div key={target.name} className="flex flex-col items-center gap-2">
                <span className="text-white font-semibold text-sm">{target.name}</span>
                <RoleMiniCard role={target.role} size="medium" />
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-white font-medium">{title}</p>

        <button
          onClick={onConfirm}
          className="w-full py-3 btn-primary rounded-xl"
        >
          確認した
        </button>
      </div>
    </div>
  );
}
