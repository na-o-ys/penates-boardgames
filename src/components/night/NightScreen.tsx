"use client";

import { useState, useEffect, useCallback } from "react";
import {
  ROLE_HAS_ACTION,
  ROLE_NAMES,
  ROLE_MATERIAL_ICONS,
  ROLE_CARD_COLORS,
  buildRevealedInfo,
  getSwapReason,
  type ClientGameState,
  type ActionType,
  type Role,
} from "@/lib/game";
import { RoleMiniCard, UnknownMiniCard } from "../common/RoleMiniCard";
import { PlayerCard } from "../common/PlayerCard";
import { CemeterySection } from "../common/CemeterySection";
import { TappableUnknownCard } from "./TappableUnknownCard";
import { ConfirmModal } from "../common/ConfirmModal";
import { SkipLink } from "../common/SkipLink";

interface NightScreenProps {
  roomId: string;
  gameState: ClientGameState;
  playerId: string;
  onSubmitAction: (actionType: ActionType, targets: string[]) => Promise<{ success: boolean; error?: string }>;
  onAutoSkip: () => Promise<{ success: boolean; error?: string }>;
}

export function NightScreen({
  roomId,
  gameState,
  playerId,
  onSubmitAction,
  onAutoSkip,
}: NightScreenProps) {
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: ActionType; targets: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nightDuration = gameState.config.nightDuration;
  const phaseStartedAt = gameState.phaseStartedAt;

  const calculateTimeLeft = useCallback(() => {
    if (!phaseStartedAt) return nightDuration;
    const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000);
    return Math.max(0, nightDuration - elapsed);
  }, [phaseStartedAt, nightDuration]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
  }, [calculateTimeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, calculateTimeLeft]);

  const hasActed = gameState.hasActed;
  useEffect(() => {
    if (timeLeft <= 0 && !hasActed) {
      onAutoSkip().catch(console.error);
    }
  }, [timeLeft, hasActed, onAutoSkip]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const myRole = gameState.myRole;
  const hasAction = myRole ? ROLE_HAS_ACTION[myRole] : false;
  const fellowWerewolves = gameState.fellowWerewolves ?? [];
  const otherPlayers = gameState.players.filter((p) => p.id !== playerId);
  const sortedPlayers = [...gameState.players].sort((a, b) =>
    a.id === playerId ? -1 : b.id === playerId ? 1 : 0
  );
  const revealedInfo = buildRevealedInfo(gameState.actionResults);

  const handleSubmitAction = async (actionType: ActionType, targets: string[]) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmitAction(actionType, targets);
      if (!result.success) {
        setError(result.error ?? "アクションの実行に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
      setConfirmAction(null);
    }
  };

  const handleSkip = () => handleSubmitAction("SKIP", []);

  const handleConfirm = () => {
    if (!confirmAction) return;
    handleSubmitAction(confirmAction.type, confirmAction.targets);
  };

  const handleCancelConfirm = () => {
    setConfirmAction(null);
    if (myRole === "TROUBLEMAKER") {
      setSelectedTargets([]);
    }
  };

  const handleTroublemakerSelect = (targetId: string) => {
    if (selectedTargets.includes(targetId)) {
      setSelectedTargets(selectedTargets.filter((t) => t !== targetId));
      return;
    }
    if (selectedTargets.length === 0) {
      setSelectedTargets([targetId]);
    } else if (selectedTargets.length === 1) {
      setConfirmAction({
        type: "TROUBLEMAKER_SWAP",
        targets: [selectedTargets[0], targetId],
      });
    }
  };

  const isTimeLow = timeLeft <= 10 && timeLeft > 0;

  // Action instruction text
  const getInstructionText = (): string | null => {
    if (hasActed) return null;
    if (!myRole) return null;

    switch (myRole) {
      case "SEER":
        return "対象のカードを選択してください（プレイヤー1人 or 墓地）";
      case "ROBBER":
        return "交換する対象のカードを選択してください";
      case "TROUBLEMAKER":
        if (selectedTargets.length === 1) {
          return "もう1人を選択してください";
        }
        return "入れ替える2人のカードを選択してください";
      case "WEREWOLF":
        if (fellowWerewolves.length > 0) {
          const fellowNames = fellowWerewolves
            .map((id) => gameState.players.find((p) => p.id === id)?.name)
            .filter(Boolean)
            .join("、");
          return `仲間の人狼は ${fellowNames} です`;
        }
        return "あなたは唯一の人狼です";
      default:
        return "夜の行動はありません";
    }
  };

  // Confirm modal text builders
  const getConfirmTitle = (): string => {
    if (!confirmAction) return "";
    const targetNames = confirmAction.targets
      .map((id) => gameState.players.find((p) => p.id === id)?.name)
      .filter(Boolean);

    switch (confirmAction.type) {
      case "SEER_LOOK_PLAYER":
        return `${targetNames[0]}を占いますか？`;
      case "SEER_LOOK_CENTER":
        return "墓地のカードを占いますか？";
      case "ROBBER_SWAP":
        return `${targetNames[0]}と交換しますか？`;
      case "TROUBLEMAKER_SWAP":
        return `${targetNames[0]}と${targetNames[1]}を入れ替えますか？`;
      default:
        return "";
    }
  };

  const getConfirmLabel = (): string => {
    if (!confirmAction) return "";
    switch (confirmAction.type) {
      case "SEER_LOOK_PLAYER":
      case "SEER_LOOK_CENTER":
        return "占う";
      case "ROBBER_SWAP":
        return "交換する";
      case "TROUBLEMAKER_SWAP":
        return "入れ替える";
      default:
        return "実行";
    }
  };

  const getConfirmTargets = (): { name: string }[] => {
    if (!confirmAction) return [];
    if (confirmAction.type === "SEER_LOOK_CENTER") {
      return [{ name: "中央カード1" }, { name: "中央カード2" }];
    }
    return confirmAction.targets
      .map((id) => {
        const player = gameState.players.find((p) => p.id === id);
        return player ? { name: player.name } : null;
      })
      .filter((t): t is { name: string } => t !== null);
  };

  // Render card for each player in the list
  const renderPlayerCard = (playerId_: string, isCurrentPlayer: boolean) => {
    // Self: always show own role
    if (isCurrentPlayer) {
      return gameState.myRole ? (
        <RoleMiniCard role={gameState.myRole} size="medium" />
      ) : (
        <UnknownMiniCard />
      );
    }

    // After acting: show revealed or unknown
    if (hasActed) {
      const swapReason = getSwapReason(playerId_, gameState.myActions, gameState.players);
      // Already handled in PlayerCard statusBadges
      return revealedInfo.players[playerId_] ? (
        <RoleMiniCard role={revealedInfo.players[playerId_]} size="medium" />
      ) : (
        <UnknownMiniCard />
      );
    }

    // Before acting
    if (!myRole) return <UnknownMiniCard />;

    switch (myRole) {
      case "SEER":
        return (
          <TappableUnknownCard
            onClick={() => setConfirmAction({ type: "SEER_LOOK_PLAYER", targets: [playerId_] })}
          />
        );
      case "ROBBER":
        return (
          <TappableUnknownCard
            onClick={() => setConfirmAction({ type: "ROBBER_SWAP", targets: [playerId_] })}
          />
        );
      case "TROUBLEMAKER":
        return (
          <TappableUnknownCard
            selected={selectedTargets.includes(playerId_)}
            onClick={() => handleTroublemakerSelect(playerId_)}
          />
        );
      case "WEREWOLF":
        if (fellowWerewolves.includes(playerId_)) {
          return <RoleMiniCard role={"WEREWOLF" as Role} size="medium" />;
        }
        return <UnknownMiniCard />;
      default:
        return <UnknownMiniCard />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1">
        {/* Header */}
        <div className="pt-8 pb-4 px-4 text-center">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-2">
            夜フェーズ
          </h1>
          <div className={`text-5xl font-bold mb-4 ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "gold-text"
          }`}>
            {formatTime(timeLeft)}
          </div>

          {/* Role notification + instruction */}
          {myRole && !hasActed && (
            <div className="space-y-1">
              <div className="flex items-center justify-center gap-2">
                <span className={`material-icons ${ROLE_CARD_COLORS[myRole].text}`}>
                  {ROLE_MATERIAL_ICONS[myRole]}
                </span>
                <span className={`font-bold ${ROLE_CARD_COLORS[myRole].text}`}>
                  {ROLE_NAMES[myRole]}
                </span>
              </div>
              <p className="text-[var(--color-text-secondary)] text-sm">
                {getInstructionText()}
              </p>
            </div>
          )}

          {hasActed && (
            <p className="text-[var(--color-ready)] font-semibold">アクション完了</p>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-4 px-4 py-3 bg-[var(--color-error)]/20 border border-[var(--color-error)]/40 rounded-xl text-[var(--color-error)] text-center text-sm">
            {error}
          </div>
        )}

        {/* Player list + Cemetery (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-24">
          {sortedPlayers.map((player) => {
            const isCurrentPlayer = player.id === playerId;
            const swapReason = hasActed
              ? getSwapReason(player.id, gameState.myActions, gameState.players)
              : null;

            const cardOnClick = (() => {
              if (isCurrentPlayer || hasActed || !myRole) return undefined;
              switch (myRole) {
                case "SEER":
                  return () => setConfirmAction({ type: "SEER_LOOK_PLAYER", targets: [player.id] });
                case "ROBBER":
                  return () => setConfirmAction({ type: "ROBBER_SWAP", targets: [player.id] });
                case "TROUBLEMAKER":
                  return () => handleTroublemakerSelect(player.id);
                default:
                  return undefined;
              }
            })();

            return (
              <PlayerCard
                key={player.id}
                playerName={player.name}
                isCurrentPlayer={isCurrentPlayer}
                onClick={cardOnClick}
                statusBadges={swapReason ? (
                  <div className="text-xs">
                    <span className="text-yellow-500">
                      <span className="material-icons text-sm align-middle animate-pulse">sync_alt</span>
                      {" "}{swapReason}
                    </span>
                  </div>
                ) : undefined}
              >
                {renderPlayerCard(player.id, isCurrentPlayer)}
              </PlayerCard>
            );
          })}

          {/* Cemetery */}
          {hasActed ? (
            <CemeterySection centerRoles={revealedInfo.centers} />
          ) : myRole === "SEER" ? (
            <CemeterySection
              centerRoles={{}}
              onTapCenter={() => setConfirmAction({ type: "SEER_LOOK_CENTER", targets: ["CENTER_0", "CENTER_1"] })}
            />
          ) : (
            <CemeterySection centerRoles={{}} />
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent z-20 max-w-md mx-auto">
          {hasActed || (!hasAction && myRole !== "WEREWOLF") ? (
            <p className="text-center text-[var(--color-text-muted)] py-3">
              他のプレイヤーの行動を待っています...
            </p>
          ) : myRole === "WEREWOLF" ? (
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="w-full py-3 btn-primary rounded-xl"
            >
              {isSubmitting ? "処理中..." : "確認した"}
            </button>
          ) : (
            <SkipLink label="行動をスキップ" onClick={handleSkip} disabled={isSubmitting} />
          )}
        </div>
      </div>

      {/* Confirm Modal */}
      {confirmAction && (
        <ConfirmModal
          title={getConfirmTitle()}
          targets={getConfirmTargets()}
          confirmLabel={getConfirmLabel()}
          onConfirm={handleConfirm}
          onCancel={handleCancelConfirm}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
