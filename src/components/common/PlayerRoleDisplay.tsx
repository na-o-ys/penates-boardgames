import type { ClientGameState } from "@/lib/game";
import { buildRevealedInfo } from "@/lib/game";
import { RoleMiniCard, UnknownMiniCard } from "./RoleMiniCard";

interface PlayerRoleDisplayProps {
  playerId: string;
  currentPlayerId: string;
  gameState: ClientGameState;
  tappable?: boolean;
}

export function PlayerRoleDisplay({ playerId, currentPlayerId, gameState, tappable = false }: PlayerRoleDisplayProps) {
  const isCurrentPlayer = playerId === currentPlayerId;
  const revealedInfo = buildRevealedInfo(gameState.actionResults);

  const robberSwap = gameState.actionResults.find((r) => r.type === "ROBBER_SWAP");
  const hasSwapped = robberSwap && robberSwap.revealedRoles?.[0];
  const robberTargetId = robberSwap?.targetIds[0];

  if (isCurrentPlayer && hasSwapped && gameState.myRole) {
    return (
      <>
        <div className="opacity-50 grayscale scale-90">
          <RoleMiniCard role={gameState.myRole} size="small" />
        </div>
        <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
        <RoleMiniCard role={robberSwap.revealedRoles![0]} size="medium" tappable={tappable} />
      </>
    );
  }

  if (hasSwapped && playerId === robberTargetId && gameState.myRole) {
    return (
      <>
        <div className="opacity-50 grayscale scale-90">
          <RoleMiniCard role={robberSwap.revealedRoles![0]} size="small" />
        </div>
        <span className="material-icons text-gray-500 text-sm">arrow_forward</span>
        <RoleMiniCard role={gameState.myRole} size="medium" tappable={tappable} />
      </>
    );
  }

  if (isCurrentPlayer && gameState.myRole) {
    return <RoleMiniCard role={gameState.myRole} size="medium" tappable={tappable} />;
  }

  const revealedRole = revealedInfo.players[playerId];
  if (revealedRole) {
    return <RoleMiniCard role={revealedRole} size="medium" tappable={tappable} />;
  }

  return <UnknownMiniCard tappable={tappable} />;
}
