"use client";

import { useState, useEffect, useCallback } from "react";
import { ROLE_HAS_ACTION, buildRevealedInfo, getSwapReason, type ClientGameState, type ActionType } from "@/lib/game";
import { RoleMiniCard, UnknownMiniCard } from "../common/RoleMiniCard";
import { PlayerCard } from "../common/PlayerCard";
import { CemeterySection } from "../common/CemeterySection";

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
  const actionResult = gameState.actionResults[0];
  const fellowWerewolves = gameState.fellowWerewolves ?? [];

  const otherPlayers = gameState.players.filter((p) => p.id !== playerId);
  const sortedPlayers = [...gameState.players].sort((a, b) =>
    a.id === playerId ? -1 : b.id === playerId ? 1 : 0
  );
  const revealedInfo = buildRevealedInfo(gameState.actionResults);

  const handleTargetClick = (targetId: string) => {
    if (hasActed || isSubmitting) return;

    if (selectedTargets.includes(targetId)) {
      setSelectedTargets(selectedTargets.filter((t) => t !== targetId));
    } else {
      const maxTargets = getMaxTargets();
      if (selectedTargets.length < maxTargets) {
        setSelectedTargets([...selectedTargets, targetId]);
      } else if (maxTargets === 1) {
        setSelectedTargets([targetId]);
      }
    }
  };

  const getMaxTargets = () => {
    switch (myRole) {
      case "SEER":
        return 2;
      case "ROBBER":
        return 1;
      case "TROUBLEMAKER":
        return 2;
      default:
        return 0;
    }
  };

  const handleSubmitAction = async (actionType: ActionType, targets?: string[]) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const result = await onSubmitAction(actionType, targets ?? selectedTargets);
      if (!result.success) {
        setError(result.error ?? "アクションの実行に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => handleSubmitAction("SKIP");

  const isTimeLow = timeLeft <= 10 && timeLeft > 0;

  const renderActionUI = () => {
    if (!myRole || hasActed) return null;

    switch (myRole) {
      case "WEREWOLF":
        if (fellowWerewolves.length > 0) {
          const fellowPlayers = fellowWerewolves
            .map((id) => gameState.players.find((p) => p.id === id))
            .filter(Boolean);
          return (
            <div className="space-y-4">
              <p className="text-[var(--color-text-secondary)]">あなたの仲間の人狼:</p>
              <div className="space-y-2">
                {fellowPlayers.map((player) => (
                  <div
                    key={player!.id}
                    className="flex items-center justify-between p-3 rounded-xl glass-card border-l-4 border-[var(--color-role-werewolf)]"
                  >
                    <span className="text-white font-semibold">{player!.name}</span>
                    <UnknownMiniCard />
                  </div>
                ))}
              </div>
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full py-3 btn-primary rounded-xl"
              >
                {isSubmitting ? "処理中..." : "確認した"}
              </button>
            </div>
          );
        }
        return (
          <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)]">
              あなたは唯一の人狼です。
            </p>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="w-full py-3 btn-primary rounded-xl"
            >
              {isSubmitting ? "処理中..." : "確認した"}
            </button>
          </div>
        );

      case "SEER":
        return (
          <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)]">
              プレイヤー1人のカード、または中央のカード2枚を確認できます
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-[var(--color-text-muted)] mb-2">プレイヤーを選択</p>
                <div className="space-y-2">
                  {otherPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => {
                        setSelectedTargets([player.id]);
                      }}
                      disabled={isSubmitting}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        selectedTargets.includes(player.id)
                          ? "glass-card card-highlight"
                          : "glass-card hover:border-[var(--color-text-muted)]"
                      }`}
                    >
                      <span className="text-white font-medium">{player.name}</span>
                      <UnknownMiniCard />
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleSubmitAction("SEER_LOOK_PLAYER")}
                  disabled={selectedTargets.length !== 1 || selectedTargets[0]?.startsWith("CENTER") || isSubmitting}
                  className="w-full mt-2 py-2 btn-primary rounded-xl"
                >
                  プレイヤーを占う
                </button>
              </div>
              <div className="text-center text-[var(--color-text-muted)]">または</div>
              <div>
                <button
                  onClick={() => handleSubmitAction("SEER_LOOK_CENTER", ["CENTER_0", "CENTER_1"])}
                  disabled={isSubmitting}
                  className="w-full py-3 btn-secondary rounded-xl"
                >
                  中央を占う
                </button>
              </div>
            </div>
          </div>
        );

      case "ROBBER":
        return (
          <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)]">
              他のプレイヤー1人とカードを交換し、新しいカードを確認します
            </p>
            <div className="space-y-2">
              {otherPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleTargetClick(player.id)}
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedTargets.includes(player.id)
                      ? "glass-card card-highlight"
                      : "glass-card hover:border-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="text-white font-medium">{player.name}</span>
                  <UnknownMiniCard />
                </button>
              ))}
            </div>
            <button
              onClick={() => handleSubmitAction("ROBBER_SWAP")}
              disabled={selectedTargets.length !== 1 || isSubmitting}
              className="w-full py-3 btn-primary rounded-xl"
            >
              カードを奪う
            </button>
          </div>
        );

      case "TROUBLEMAKER":
        return (
          <div className="space-y-4">
            <p className="text-[var(--color-text-secondary)]">
              他のプレイヤー2人のカードを入れ替えます（中身は見られません）
            </p>
            <div className="space-y-2">
              {otherPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleTargetClick(player.id)}
                  disabled={isSubmitting}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    selectedTargets.includes(player.id)
                      ? "glass-card card-highlight"
                      : "glass-card hover:border-[var(--color-text-muted)]"
                  }`}
                >
                  <span className="text-white font-medium">{player.name}</span>
                  <UnknownMiniCard />
                </button>
              ))}
            </div>
            <button
              onClick={() => handleSubmitAction("TROUBLEMAKER_SWAP")}
              disabled={selectedTargets.length !== 2 || isSubmitting}
              className="w-full py-3 btn-primary rounded-xl"
            >
              カードを入れ替える
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col min-h-screen game-overlay p-4 md:p-8">
      <div className="max-w-md mx-auto w-full">
        {/* ヘッダー */}
        <div className="text-center mb-8 pt-4">
          <h1 className="font-[family-name:var(--font-display)] font-bold text-3xl gold-text mb-2">
            夜フェーズ
          </h1>
          <div className={`text-5xl font-bold mb-4 ${
            isTimeLow ? "text-[var(--color-error)] animate-pulse" : "gold-text"
          }`}>
            {formatTime(timeLeft)}
          </div>
          <p className="text-[var(--color-text-secondary)]">目を閉じて、能力を使ってください</p>
        </div>

        {error && (
          <div className="mb-6 px-4 py-3 bg-[var(--color-error)]/20 border border-[var(--color-error)]/40 rounded-xl text-[var(--color-error)] text-center text-sm">
            {error}
          </div>
        )}

        <div className="flex-1">
          {hasActed ? (
            <div className="space-y-3">
              <p className="text-[var(--color-ready)] text-center font-semibold mb-2">アクション完了</p>
              {sortedPlayers.map((player) => {
                const isCurrentPlayer = player.id === playerId;
                const swapReason = getSwapReason(player.id, gameState.myActions, gameState.players);
                return (
                  <PlayerCard
                    key={player.id}
                    playerName={player.name}
                    isCurrentPlayer={isCurrentPlayer}
                    statusBadges={swapReason ? (
                      <div className="text-xs">
                        <span className="text-yellow-500">
                          <span className="material-icons text-sm align-middle animate-pulse">sync_alt</span>
                          {" "}{swapReason}
                        </span>
                      </div>
                    ) : undefined}
                  >
                    {isCurrentPlayer && gameState.myRole ? (
                      <RoleMiniCard role={gameState.myRole} size="medium" />
                    ) : revealedInfo.players[player.id] ? (
                      <RoleMiniCard role={revealedInfo.players[player.id]} size="medium" />
                    ) : (
                      <UnknownMiniCard />
                    )}
                  </PlayerCard>
                );
              })}
              <CemeterySection centerRoles={revealedInfo.centers} />
              <p className="text-center text-[var(--color-text-muted)]">
                他のプレイヤーの行動を待っています...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* 自分の役職をプレイヤーカードで表示 */}
              <PlayerCard
                playerName={gameState.players.find((p) => p.id === playerId)?.name ?? ""}
                isCurrentPlayer={true}
              >
                {gameState.myRole ? (
                  <RoleMiniCard role={gameState.myRole} size="medium" />
                ) : (
                  <UnknownMiniCard />
                )}
              </PlayerCard>

              {hasAction ? (
                renderActionUI()
              ) : (
                <div className="text-center">
                  <p className="text-[var(--color-text-secondary)] mb-4">
                    あなたの役職には夜の行動がありません
                  </p>
                  <button
                    onClick={handleSkip}
                    disabled={isSubmitting}
                    className="px-6 py-3 btn-secondary rounded-xl"
                  >
                    {isSubmitting ? "処理中..." : "待機する"}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* スキップリンク */}
          {hasAction && !hasActed && (
            <div className="mt-6 text-center">
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] underline text-sm transition-colors"
              >
                行動をスキップ
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
