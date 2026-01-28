import type { ClientGameState, Role } from "@/lib/game";
import { buildRevealedInfo } from "@/lib/game";
import { RoleMiniCard, UnknownMiniCard } from "./RoleMiniCard";

interface PlayerRoleDisplayProps {
  playerId: string;
  currentPlayerId: string;
  gameState: ClientGameState;
  tappable?: boolean;
  onRoleClick?: (role: Role) => void;
}

export function PlayerRoleDisplay({ playerId, currentPlayerId, gameState, tappable = false, onRoleClick }: PlayerRoleDisplayProps) {
  const isCurrentPlayer = playerId === currentPlayerId;
  const revealedInfo = buildRevealedInfo(gameState.actionResults);

  const robberSwap = gameState.actionResults.find((r) => r.type === "ROBBER_SWAP");
  const hasSwapped = robberSwap && robberSwap.revealedRoles?.[0];
  const robberTargetId = robberSwap?.targetIds[0];

  const roleClick = !tappable && onRoleClick ? onRoleClick : undefined;

  if (isCurrentPlayer && hasSwapped && gameState.myRole) {
    return (
      <>
        <div className="opacity-50 grayscale scale-90">
          <RoleMiniCard role={gameState.myRole} size="small" onClick={roleClick ? () => roleClick(gameState.myRole!) : undefined} />
        </div>
        <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
        <RoleMiniCard role={robberSwap.revealedRoles![0]} size="medium" tappable={tappable} onClick={roleClick ? () => roleClick(robberSwap.revealedRoles![0]) : undefined} />
      </>
    );
  }

  if (hasSwapped && playerId === robberTargetId && gameState.myRole) {
    return (
      <>
        <div className="opacity-50 grayscale scale-90">
          <RoleMiniCard role={robberSwap.revealedRoles![0]} size="small" onClick={roleClick ? () => roleClick(robberSwap.revealedRoles![0]) : undefined} />
        </div>
        <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
        <RoleMiniCard role={gameState.myRole} size="medium" tappable={tappable} onClick={roleClick ? () => roleClick(gameState.myRole!) : undefined} />
      </>
    );
  }

  if (isCurrentPlayer && gameState.myRole) {
    return <RoleMiniCard role={gameState.myRole} size="medium" tappable={tappable} onClick={roleClick ? () => roleClick(gameState.myRole!) : undefined} />;
  }

  const revealedRole = revealedInfo.players[playerId];
  if (revealedRole) {
    return <RoleMiniCard role={revealedRole} size="medium" tappable={tappable} onClick={roleClick ? () => roleClick(revealedRole) : undefined} />;
  }

  const fellowWerewolves = gameState.fellowWerewolves ?? [];
  if (fellowWerewolves.includes(playerId)) {
    return <RoleMiniCard role={"WEREWOLF" as Role} size="medium" tappable={tappable} onClick={roleClick ? () => roleClick("WEREWOLF" as Role) : undefined} />;
  }

  return <UnknownMiniCard tappable={tappable} />;
}
