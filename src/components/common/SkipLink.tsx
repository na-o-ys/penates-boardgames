interface SkipLinkProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function SkipLink({ label, onClick, disabled }: SkipLinkProps) {
  return (
    <div className="text-center">
      <button
        onClick={onClick}
        disabled={disabled}
        className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] underline text-sm transition-colors disabled:opacity-50"
      >
        {label}
      </button>
    </div>
  );
}
