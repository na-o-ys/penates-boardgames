import { UnknownMiniCard } from "../common/RoleMiniCard";

interface ConfirmModalProps {
  title: string;
  targets: { name: string }[];
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  variant?: "primary" | "danger";
}

export function ConfirmModal({
  title,
  targets,
  confirmLabel,
  onConfirm,
  onCancel,
  isSubmitting,
  variant = "primary",
}: ConfirmModalProps) {
  const confirmButtonClass = variant === "danger"
    ? "flex-1 py-3 bg-[var(--color-error)] hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
    : "flex-1 py-3 btn-primary rounded-xl";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      <div className="relative glass-card rounded-xl p-6 mx-4 max-w-sm w-full space-y-5">
        {targets.length > 0 && (
          <div className="flex justify-center gap-4">
            {targets.map((target) => (
              <div key={target.name} className="flex flex-col items-center gap-2">
                <span className="text-white font-semibold text-sm">{target.name}</span>
                <UnknownMiniCard />
              </div>
            ))}
          </div>
        )}

        <p className="text-center text-white font-medium">{title}</p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex-1 py-3 btn-secondary rounded-xl"
          >
            キャンセル
          </button>
          <button
            onClick={onConfirm}
            disabled={isSubmitting}
            className={confirmButtonClass}
          >
            {isSubmitting ? "処理中..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
