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
    <main className="flex min-h-screen flex-col items-center justify-center game-overlay p-8">
      <h1 className="font-[family-name:var(--font-display)] font-black text-5xl gold-text mb-3 tracking-wider">
        ワンナイト人狼
      </h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-10 tracking-wide">
        3〜10人で遊べるブラウザゲーム
      </p>
      <div className="glass-card rounded-xl p-8 w-full max-w-sm space-y-4">
        <input
          type="text"
          placeholder="プレイヤー名"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="w-full px-4 py-3 glass-input rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
          disabled={isLoading}
        />
        <button
          onClick={handleCreateRoom}
          disabled={isLoading || !playerName.trim()}
          className="w-full px-8 py-4 btn-primary rounded-xl text-lg font-[family-name:var(--font-display)] tracking-wider"
        >
          部屋を作成
        </button>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="部屋ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            className="flex-1 px-4 py-3 glass-input rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            disabled={isLoading}
          />
          <button
            onClick={handleJoinRoom}
            disabled={isLoading || !playerName.trim() || !roomId.trim()}
            className="px-6 py-3 btn-secondary rounded-xl"
          >
            参加
          </button>
        </div>
        {error && (
          <p className="text-[var(--color-error)] text-sm text-center">{error}</p>
        )}
      </div>
    </main>
  );
}
