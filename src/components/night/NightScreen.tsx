"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import {
  ROLES,
  buildRevealedInfo,
  getSwapReason,
  type ActionType,
  type Role,
} from "@/lib/game";
import type { ClientRoomState } from "@/lib/room";
import { RoleMiniCard, UnknownMiniCard } from "../common/RoleMiniCard";
import { PlayerCard } from "../common/PlayerCard";
import { PlayerRoleDisplay } from "../common/PlayerRoleDisplay";
import { CemeterySection } from "../common/CemeterySection";
import { ConfirmModal } from "../common/ConfirmModal";
import { NightResultModal } from "../common/NightResultModal";
import { RoleDetailModal } from "../common/RoleDetailModal";
import { RoleConfigModal } from "../common/RoleConfigModal";
import { SkipLink } from "../common/SkipLink";
import { OtherPlayersDivider } from "../common/OtherPlayersDivider";
import { PhaseProgressBar } from "../common/PhaseProgressBar";


interface NightScreenProps {
  roomId: string;
  roomState: ClientRoomState;
  playerId: string;
  onSubmitAction: (actionType: ActionType, targets: string[]) => Promise<{ success: boolean; error?: string }>;
  onAutoSkip: () => Promise<{ success: boolean; error?: string }>;
  /** 結果モーダルの「確認した」後に呼ばれるコールバック */
  onResultConfirmed?: () => void;
  /** Storybook 用: 結果モーダルの初期表示状態 */
  initialPendingResult?: { type: ActionType; targets: string[] } | null;
}

export function NightScreen({
  roomId,
  roomState,
  playerId,
  onSubmitAction,
  onAutoSkip,
  onResultConfirmed,
  initialPendingResult = null,
}: NightScreenProps) {
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [confirmAction, setConfirmAction] = useState<{ type: ActionType; targets: string[] } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailRole, setDetailRole] = useState<Role | null>(null);
  const [showRoleConfig, setShowRoleConfig] = useState(false);
  const [pendingResult, setPendingResult] = useState<{ type: ActionType; targets: string[] } | null>(initialPendingResult);

  const game = roomState.game!;
  const nightDuration = roomState.config.nightDuration;
  const phaseStartedAt = game.phaseStartedAt;

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

  const hasActed = game.hasActed;
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

  const myRole = game.myRole;
  const hasAction = myRole ? ROLES[myRole].hasNightAction : false;
  const fellowWerewolves = game.fellowWerewolves ?? [];
  const otherPlayers = game.players.filter((p) => p.id !== playerId);
  const sortedPlayers = [...game.players].sort((a, b) =>
    a.id === playerId ? -1 : b.id === playerId ? 1 : 0
  );
  const revealedInfo = buildRevealedInfo(game.actionResults);

  const handleSubmitAction = async (actionType: ActionType, targets: string[]) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmitAction(actionType, targets);
      if (!result.success) {
        setError(result.error ?? "アクションの実行に失敗しました");
      } else {
        const showsResult = ["SEER_LOOK_PLAYER", "SEER_LOOK_CENTER", "ROBBER_SWAP"].includes(actionType);
        if (showsResult) {
          setPendingResult({ type: actionType, targets });
        }
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
      case "APPRENTICE_SEER":
        return "占うプレイヤーを1人選択してください";
      case "ROBBER":
      case "WHITE_ROBBER":
        return "交換する対象のカードを選択してください";
      case "TROUBLEMAKER":
        if (selectedTargets.length === 1) {
          return "もう1人を選択してください";
        }
        return "入れ替える2人のカードを選択してください";
      default:
        if (ROLES[myRole].isWerewolfNightAlly) {
          const parts: string[] = [];
          if (fellowWerewolves.length > 0) {
            const fellowNames = fellowWerewolves
              .map((id) => game.players.find((p) => p.id === id)?.name)
              .filter(Boolean)
              .join("、");
            parts.push(`人狼仲間は ${fellowNames} です`);
          } else {
            parts.push("人狼仲間はいません");
          }
          if (ROLES[myRole].revealsCenter) {
            parts.push("墓地のカードが開示されています");
          }
          return parts.join("。");
        }
        return "夜の行動はありません";
    }
  };

  // Confirm modal text builders
  const getConfirmTitle = (): string => {
    if (!confirmAction) return "";
    const targetNames = confirmAction.targets
      .map((id) => game.players.find((p) => p.id === id)?.name)
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
        const player = game.players.find((p) => p.id === id);
        return player ? { name: player.name } : null;
      })
      .filter((t): t is { name: string } => t !== null);
  };

  // Render card for each player in the list
  const renderPlayerCard = (playerId_: string, isCurrentPlayer: boolean) => {
    // Self or after acting: use shared component
    if (isCurrentPlayer || hasActed) {
      return (
        <PlayerRoleDisplay
          playerId={playerId_}
          currentPlayerId={playerId}
          gameState={game}
          onRoleClick={setDetailRole}
        />
      );
    }

    // Before acting: role-specific interactive UI
    if (!myRole) return <UnknownMiniCard />;

    switch (myRole) {
      case "SEER":
      case "APPRENTICE_SEER":
        return <UnknownMiniCard tappable />;
      case "ROBBER":
      case "WHITE_ROBBER":
        return <UnknownMiniCard tappable />;
      case "TROUBLEMAKER":
        return <UnknownMiniCard tappable selected={selectedTargets.includes(playerId_)} />;
      default:
        if (ROLES[myRole].isWerewolfNightAlly && fellowWerewolves.includes(playerId_)) {
          return <RoleMiniCard role={"WEREWOLF" as Role} size="medium" onClick={() => setDetailRole("WEREWOLF")} />;
        }
        return <UnknownMiniCard />;
    }
  };

  return (
    <div className="flex flex-col h-dvh overflow-hidden game-overlay">
      <div className="max-w-md mx-auto w-full flex flex-col flex-1 min-h-0">
        {/* Header */}
        <div className="pt-8 pb-4 px-4 text-center relative">
          <PhaseProgressBar currentPhase="NIGHT" />
          <button
            onClick={() => setShowRoleConfig(true)}
            className="absolute top-8 right-4 w-9 h-9 rounded-full glass-panel flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary)] transition-colors"
            aria-label="役職構成"
          >
            <span className="material-icons text-xl">groups</span>
          </button>
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-2">
            NIGHT PHASE
          </h1>
          <div key={isTimeLow ? "low" : "normal"} className={`text-5xl font-bold mb-4 font-[family-name:var(--font-display)] ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "gold-text"
          }`}>
            {formatTime(timeLeft)}
          </div>

        </div>

        {error && (
          <div className="mx-4 mb-4 px-4 py-3 bg-[var(--color-error)]/20 border border-[var(--color-error)]/40 rounded-xl text-[var(--color-error)] text-center text-sm">
            {error}
          </div>
        )}

        {/* Player list + Cemetery (scrollable) */}
        <div className="flex-1 overflow-y-auto px-4 space-y-3 pb-4 ">
          {sortedPlayers.map((player, index) => {
            const isCurrentPlayer = player.id === playerId;
            const swapReason = hasActed
              ? getSwapReason(player.id, game.myActions, game.players)
              : null;

            const cardOnClick = (() => {
              if (isCurrentPlayer || hasActed || !myRole) return undefined;
              switch (myRole) {
                case "SEER":
                case "APPRENTICE_SEER":
                  return () => setConfirmAction({ type: "SEER_LOOK_PLAYER", targets: [player.id] });
                case "ROBBER":
                case "WHITE_ROBBER":
                  return () => setConfirmAction({ type: "ROBBER_SWAP", targets: [player.id] });
                case "TROUBLEMAKER":
                  return () => handleTroublemakerSelect(player.id);
                default:
                  return undefined;
              }
            })();

            return (
              <Fragment key={player.id}>
                {index === 1 && <OtherPlayersDivider />}
                <PlayerCard
                  playerName={player.name}
                  isCurrentPlayer={isCurrentPlayer}
                  onClick={cardOnClick}
                  statusBadges={
                    isCurrentPlayer && myRole ? (
                      <div className="space-y-0.5 mt-1">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setDetailRole(myRole); }}
                          className="flex items-center gap-1.5 cursor-pointer"
                        >
                          <span className="text-xs text-[var(--color-text-muted)]">あなたの役職:</span>
                          <span className={`material-icons text-sm ${ROLES[myRole].accentColors.iconText}`}>
                            {ROLES[myRole].materialIcon}
                          </span>
                          <span className={`font-bold text-sm ${ROLES[myRole].accentColors.iconText}`}>
                            {ROLES[myRole].name}
                          </span>
                          <span className="material-icons text-xs text-[var(--color-text-muted)]">chevron_right</span>
                        </button>
                        {!hasActed ? (
                          <p className="text-[var(--color-text-secondary)] text-xs">{getInstructionText()}</p>
                        ) : (
                          <p className="text-[var(--color-ready)] font-semibold text-xs">アクション完了</p>
                        )}
                        {game.receivedBread && (
                          <div className="flex items-center gap-1 text-amber-400 text-xs mt-1">
                            <span className="material-icons text-sm">bakery_dining</span>
                            <span>パン屋からパンが届きました</span>
                          </div>
                        )}
                        {game.receivedNotice && (
                          <div className="flex items-center gap-1 text-white text-xs mt-1">
                            <span className="material-icons text-sm">mail</span>
                            <span>白怪盗から予告状が届きました</span>
                          </div>
                        )}
                      </div>
                    ) : swapReason ? (
                      <div className="text-xs">
                        <span className="text-yellow-500">
                          <span className="material-icons text-sm align-middle animate-pulse">sync_alt</span>
                          {" "}{swapReason}
                        </span>
                      </div>
                    ) : undefined
                  }
                >
                  {renderPlayerCard(player.id, isCurrentPlayer)}
                </PlayerCard>
              </Fragment>
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
          ) : myRole && ROLES[myRole].revealsCenter && game.revealedCenterRoles ? (
            <CemeterySection centerRoles={game.revealedCenterRoles} />
          ) : (
            <CemeterySection centerRoles={{}} />
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-4 pb-4 pt-8 -mt-8 relative z-10 bg-gradient-to-t from-[var(--color-bg-deep)] via-[var(--color-bg-deep)]/95 to-transparent">
          {(() => {
            const isWerewolfAlly = myRole && ROLES[myRole].isWerewolfNightAlly;
            if (hasActed || (!hasAction && !isWerewolfAlly)) {
              return (
                <p className="text-center text-[var(--color-text-muted)] py-3">
                  他のプレイヤーの行動を待っています...
                </p>
              );
            }
            if (isWerewolfAlly) {
              return (
                <button
                  onClick={handleSkip}
                  disabled={isSubmitting}
                  className="w-full py-3 btn-primary rounded-xl"
                >
                  {isSubmitting ? "処理中..." : "確認した"}
                </button>
              );
            }
            return <SkipLink label="行動をスキップ" onClick={handleSkip} disabled={isSubmitting} />;
          })()}
        </div>
      </div>

      {detailRole && (
        <RoleDetailModal role={detailRole} onClose={() => setDetailRole(null)} />
      )}

      {/* Night Result Modal */}
      {pendingResult && hasActed && (() => {
        const actionResult = game.actionResults.find(r => r.type === pendingResult.type);
        if (!actionResult?.revealedRoles) return null;

        let resultTitle: string;
        let resultTargets: { name: string; role: Role }[];

        switch (pendingResult.type) {
          case "SEER_LOOK_PLAYER": {
            const player = game.players.find(p => p.id === pendingResult.targets[0]);
            resultTitle = `${player?.name}の役職`;
            resultTargets = [{ name: player?.name ?? "", role: actionResult.revealedRoles[0] }];
            break;
          }
          case "SEER_LOOK_CENTER":
            resultTitle = "墓地のカード";
            resultTargets = actionResult.revealedRoles.map((role, i) => ({
              name: `中央カード${i + 1}`,
              role,
            }));
            break;
          case "ROBBER_SWAP": {
            const player = game.players.find(p => p.id === pendingResult.targets[0]);
            resultTitle = `${player?.name}から${ROLES[actionResult.revealedRoles[0]].name}を奪った`;
            resultTargets = [{ name: player?.name ?? "", role: actionResult.revealedRoles[0] }];
            break;
          }
          default:
            return null;
        }

        return (
          <NightResultModal
            title={resultTitle}
            targets={resultTargets}
            onConfirm={() => { setPendingResult(null); onResultConfirmed?.(); }}
          />
        );
      })()}

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

      {showRoleConfig && (
        <RoleConfigModal config={roomState.config} onClose={() => setShowRoleConfig(false)} />
      )}
    </div>
  );
}
