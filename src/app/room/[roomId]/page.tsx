"use client";

import { use } from "react";
import { useGameState } from "@/hooks/useGameState";
import { LobbyScreen } from "@/components/lobby/LobbyScreen";
import { NightScreen } from "@/components/night/NightScreen";
import { DayScreen } from "@/components/day/DayScreen";
import { VotingScreen } from "@/components/voting/VotingScreen";
import { ResultScreen } from "@/components/result/ResultScreen";

interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  const { gameState, playerId, isLoading, error, refresh } = useGameState(roomId);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="animate-pulse">
          <h1 className="text-2xl font-bold mb-4 text-white">読み込み中...</h1>
        </div>
      </main>
    );
  }

  if (error || !gameState || !playerId) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <h1 className="text-2xl font-bold mb-4 text-red-500">エラー</h1>
        <p className="text-gray-400">{error || "ゲーム状態を取得できませんでした"}</p>
        <button
          onClick={refresh}
          className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white"
        >
          再読み込み
        </button>
      </main>
    );
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
