"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createRoomAction, joinRoomAction } from "@/actions/room";

export default function Home() {
  const router = useRouter();
  const [playerName, setPlayerName] = useState("");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError("プレイヤー名を入力してください");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await createRoomAction(playerName.trim());
    if (result.success && result.data) {
      router.push(`/room/${result.data.roomId}`);
    } else {
      setError(result.error || "部屋の作成に失敗しました");
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      setError("プレイヤー名を入力してください");
      return;
    }
    if (!roomId.trim()) {
      setError("部屋IDを入力してください");
      return;
    }

    setIsLoading(true);
    setError("");

    const result = await joinRoomAction(roomId.trim(), playerName.trim());
    if (result.success) {
      router.push(`/room/${roomId.trim()}`);
    } else {
      setError(result.error || "部屋への参加に失敗しました");
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-900 p-8">
      <h1 className="text-4xl font-bold mb-8 text-white">ワンナイト人狼</h1>
      <p className="text-lg text-gray-400 mb-12">
        3〜10人で遊べるブラウザゲーム
      </p>
      <div className="flex flex-col gap-4 w-full max-w-sm">
        <input
          type="text"
          placeholder="プレイヤー名"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
          disabled={isLoading}
        />
        <button
          onClick={handleCreateRoom}
          disabled={isLoading || !playerName.trim()}
          className="px-8 py-4 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-lg font-semibold text-white transition-colors"
        >
          部屋を作成
        </button>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="部屋ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="flex-1 px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-slate-500"
            disabled={isLoading}
          />
          <button
            onClick={handleJoinRoom}
            disabled={isLoading || !playerName.trim() || !roomId.trim()}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
          >
            参加
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm text-center">{error}</p>
        )}
      </div>
    </main>
  );
}
