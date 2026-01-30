interface VotesReceivedBadgeProps {
  count: number;
  voterNames: string[];
}

export function VotesReceivedBadge({ count, voterNames }: VotesReceivedBadgeProps) {
  return (
    <span className="whitespace-nowrap text-[var(--color-text-muted)]">
      <span className="material-icons text-sm align-middle">how_to_vote</span>
      {" "}{count}票 ({voterNames.join(", ")})
    </span>
  );
}
