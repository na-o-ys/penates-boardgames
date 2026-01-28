interface VoteTargetBadgeProps {
  targetName: string | null;
}

export function VoteTargetBadge({ targetName }: VoteTargetBadgeProps) {
  return (
    <span className="text-[var(--color-text-muted)]">
      <span className="material-icons text-sm align-middle">how_to_vote</span>
      {" "}→{" "}
      {targetName ?? "スキップ"}
    </span>
  );
}
