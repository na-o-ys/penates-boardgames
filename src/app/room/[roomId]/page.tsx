"use client";

import { use, useState, useEffect } from "react";
import { getCurrentPlayerIdAction } from "@/actions";
import { useGameState } from "@/hooks/useGameState";
import { LobbyScreen } from "@/components/lobby/LobbyScreen";
import { NightScreen } from "@/components/night/NightScreen";
import { DayScreen } from "@/components/day/DayScreen";
import { VotingScreen } from "@/components/voting/VotingScreen";
import { ResultScreen } from "@/components/result/ResultScreen";
import { RoomEntryScreen } from "@/components/room/RoomEntryScreen";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerIdLoading, setPlayerIdLoading] = useState(true);

  // まずplayerIdを取得
  useEffect(() => {
    getCurrentPlayerIdAction().then((result) => {
      if (result.success && result.data) {
        setPlayerId(result.data.playerId);
      }
      setPlayerIdLoading(false);
    });
  }, []);

  // playerIdが取得できたらuseGameStateを呼ぶ
  const { gameState, isInRoom, isLoading, error, refresh } = useGameState(
    roomId,
    playerId ?? ""
  );

  if (playerIdLoading || isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="animate-pulse">
          <h1 className="text-2xl font-bold mb-4 text-white">読み込み中...</h1>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
        <h1 className="text-2xl font-bold mb-4 text-red-500">エラー</h1>
        <p className="text-gray-400">{error}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white"
        >
          再読み込み
        </button>
      </main>
    );
  }

  if (!gameState || !playerId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
        <h1 className="text-2xl font-bold mb-4 text-red-500">エラー</h1>
        <p className="text-gray-400">ゲーム状態を取得できませんでした</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-slate-600 hover:bg-slate-500 rounded-lg text-white"
        >
          再読み込み
        </button>
      </main>
    );
  }

  // 未入室の場合は入室画面を表示
  if (!isInRoom) {
    return <RoomEntryScreen roomId={roomId} onJoined={refresh} />;
  }

  switch (gameState.phase) {
    case "LOBBY":
      return (
        <LobbyScreen
          roomId={roomId}
          gameState={gameState}
          playerId={playerId}
          onRefresh={refresh}
        />
      );
    case "NIGHT":
      return (
        <NightScreen
          roomId={roomId}
          gameState={gameState}
          playerId={playerId}
          onRefresh={refresh}
        />
      );
    case "DAY":
      return (
        <DayScreen
          roomId={roomId}
          gameState={gameState}
          playerId={playerId}
          onRefresh={refresh}
        />
      );
    case "VOTING":
      return (
        <VotingScreen
          roomId={roomId}
          gameState={gameState}
          playerId={playerId}
          onRefresh={refresh}
        />
      );
    case "RESULT":
      return (
        <ResultScreen
          roomId={roomId}
          gameState={gameState}
          playerId={playerId}
          onRefresh={refresh}
        />
      );
    default:
      return (
        <main className="flex min-h-screen flex-col items-center justify-center p-8">
          <h1 className="text-2xl font-bold mb-4 text-white">不明なフェーズ</h1>
          <p className="text-gray-400">フェーズ: {gameState.phase}</p>
        </main>
      );
  }
}
