"use client";

import { useState, useEffect, useCallback } from "react";
import { submitNightActionAction, autoSkipNightActionAction } from "@/actions";
import { ROLE_NAMES, ROLE_HAS_ACTION, type ClientGameState, type ActionType } from "@/lib/game";
import { RoleCard } from "./RoleCard";

interface NightScreenProps {
  roomId: string;
  gameState: ClientGameState;
  playerId: string;
  onRefresh: () => void;
}

export function NightScreen({
  roomId,
  gameState,
  playerId,
}: NightScreenProps) {
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const nightDuration = gameState.config.nightDuration;
  const phaseStartedAt = gameState.phaseStartedAt;

  // phaseStartedAtから残り時間を計算
  const calculateTimeLeft = useCallback(() => {
    if (!phaseStartedAt) return nightDuration;
    const elapsed = Math.floor((Date.now() - phaseStartedAt) / 1000);
    return Math.max(0, nightDuration - elapsed);
  }, [phaseStartedAt, nightDuration]);

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft);

  useEffect(() => {
    // phaseStartedAtが変わったら再計算
    setTimeLeft(calculateTimeLeft());
  }, [calculateTimeLeft]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, calculateTimeLeft]);

  // タイマー終了時の自動スキップ
  const hasActed = gameState.hasActed;
  useEffect(() => {
    if (timeLeft <= 0 && !hasActed) {
      // タイマー終了時に未行動なら自動スキップを実行
      autoSkipNightActionAction(roomId).catch(console.error);
    }
  }, [timeLeft, hasActed, roomId]);

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

  const handleTargetClick = (targetId: string) => {
    if (hasActed || isSubmitting) return;

    if (selectedTargets.includes(targetId)) {
      setSelectedTargets(selectedTargets.filter((t) => t !== targetId));
    } else {
      // 役職に応じて選択可能数を制限
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
        return 2; // 中央2枚 or プレイヤー1人
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
      const result = await submitNightActionAction(roomId, actionType, targets ?? selectedTargets);
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

  const renderActionUI = () => {
    if (!myRole || hasActed) return null;

    switch (myRole) {
      case "WEREWOLF":
        // 仲間の人狼がいる場合
        if (fellowWerewolves.length > 0) {
          const fellowNames = fellowWerewolves
            .map((id) => gameState.players.find((p) => p.id === id)?.name)
            .filter(Boolean);
          return (
            <div className="space-y-4">
              <p className="text-gray-300">あなたの仲間の人狼:</p>
              <div className="flex flex-wrap justify-center gap-2">
                {fellowNames.map((name, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-red-900/50 border border-red-500 rounded-lg text-white font-semibold"
                  >
                    {name}
                  </span>
                ))}
              </div>
              <button
                onClick={handleSkip}
                disabled={isSubmitting}
                className="w-full py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
              >
                {isSubmitting ? "処理中..." : "確認した"}
              </button>
            </div>
          );
        }
        // 単独人狼の場合
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              あなたは唯一の人狼です。
            </p>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="w-full py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
            >
              {isSubmitting ? "処理中..." : "確認した"}
            </button>
          </div>
        );

      case "SEER":
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              プレイヤー1人のカード、または中央のカード2枚を確認できます
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-400 mb-2">プレイヤーを選択</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {otherPlayers.map((player) => (
                    <button
                      key={player.id}
                      onClick={() => {
                        setSelectedTargets([player.id]);
                      }}
                      disabled={isSubmitting}
                      className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                        selectedTargets.includes(player.id)
                          ? "border-slate-400 bg-slate-700"
                          : "border-gray-600 bg-gray-800 hover:border-gray-500"
                      }`}
                    >
                      {player.name}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => handleSubmitAction("SEER_LOOK_PLAYER")}
                  disabled={selectedTargets.length !== 1 || selectedTargets[0]?.startsWith("CENTER") || isSubmitting}
                  className="w-full mt-2 py-2 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
                >
                  プレイヤーを占う
                </button>
              </div>
              <div className="text-center text-gray-500">または</div>
              <div>
                <button
                  onClick={() => handleSubmitAction("SEER_LOOK_CENTER", ["CENTER_0", "CENTER_1"])}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
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
            <p className="text-gray-300">
              他のプレイヤー1人とカードを交換し、新しいカードを確認します
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {otherPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleTargetClick(player.id)}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedTargets.includes(player.id)
                      ? "border-slate-400 bg-slate-700"
                      : "border-gray-600 bg-gray-800 hover:border-gray-500"
                  }`}
                >
                  {player.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleSubmitAction("ROBBER_SWAP")}
              disabled={selectedTargets.length !== 1 || isSubmitting}
              className="w-full py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
            >
              カードを奪う
            </button>
          </div>
        );

      case "TROUBLEMAKER":
        return (
          <div className="space-y-4">
            <p className="text-gray-300">
              他のプレイヤー2人のカードを入れ替えます（中身は見られません）
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {otherPlayers.map((player) => (
                <button
                  key={player.id}
                  onClick={() => handleTargetClick(player.id)}
                  disabled={isSubmitting}
                  className={`px-4 py-2 rounded-lg border-2 transition-colors ${
                    selectedTargets.includes(player.id)
                      ? "border-slate-400 bg-slate-700"
                      : "border-gray-600 bg-gray-800 hover:border-gray-500"
                  }`}
                >
                  {player.name}
                </button>
              ))}
            </div>
            <button
              onClick={() => handleSubmitAction("TROUBLEMAKER_SWAP")}
              disabled={selectedTargets.length !== 2 || isSubmitting}
              className="w-full py-3 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
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
    <div className="flex flex-col min-h-screen bg-gray-900 p-4 md:p-8">
      {/* ヘッダー */}
      <div className="text-center mb-8 pt-4">
        <h1 className="text-2xl font-bold text-white mb-2">🌙 夜フェーズ</h1>
        <div className="text-5xl font-bold text-white mb-4">
          {formatTime(timeLeft)}
        </div>
        <p className="text-gray-400">目を閉じて、能力を使ってください</p>
      </div>

      {error && (
        <div className="mb-6 px-4 py-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-center">
          {error}
        </div>
      )}

      {/* 自分の役職 */}
      <div className="flex justify-center mb-8">
        <RoleCard role={myRole} />
      </div>

      <div className="flex-1 max-w-md mx-auto w-full">
        {hasActed ? (
          <div className="text-center">
            <p className="text-green-400 mb-4">アクション完了</p>
            {actionResult && actionResult.revealedRoles && actionResult.revealedRoles.length > 0 && (
              <div className="p-4 bg-gray-800 rounded-lg">
                <p className="text-gray-400 mb-2">確認した役職:</p>
                <div className="flex justify-center gap-2">
                  {actionResult.revealedRoles.map((role, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-700 rounded text-white font-semibold"
                    >
                      {ROLE_NAMES[role]}
                    </span>
                  ))}
                </div>
              </div>
            )}
            <p className="mt-4 text-gray-400">
              他のプレイヤーの行動を待っています...
            </p>
          </div>
        ) : hasAction ? (
          renderActionUI()
        ) : (
          <div className="text-center">
            <p className="text-gray-400 mb-4">
              あなたの役職には夜の行動がありません
            </p>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg text-white font-semibold transition-colors"
            >
              {isSubmitting ? "処理中..." : "待機する"}
            </button>
          </div>
        )}

        {/* スキップボタン（行動ありの役職用） */}
        {hasAction && !hasActed && (
          <div className="mt-6 text-center">
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="text-gray-400 hover:text-gray-300 underline text-sm"
            >
              行動をスキップ
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
