"use client";

import { useState } from "react";
import { joinRoomAction } from "@/actions";

interface RoomEntryScreenProps {
  roomId: string;
  onJoined: () => void;
}

export function RoomEntryScreen({ roomId, onJoined }: RoomEntryScreenProps) {
  const [playerName, setPlayerName] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleJoin = async () => {
    if (!playerName.trim()) return;

    setIsJoining(true);
    setError(null);

    try {
      const result = await joinRoomAction(roomId, playerName.trim());
      if (result.success) {
        onJoined();
      } else {
        setError(result.error ?? "入室に失敗しました");
      }
    } catch {
      setError("エラーが発生しました");
    } finally {
      setIsJoining(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && playerName.trim()) {
      handleJoin();
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gray-900">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center mb-8 text-white">
          ルームに入室
        </h1>

        <div className="bg-gray-800 rounded-xl p-6 space-y-6">
          <div>
            <p className="text-gray-400 text-sm mb-2">部屋ID</p>
            <code className="block px-3 py-2 bg-gray-700 rounded text-gray-300 text-sm">
              {roomId.slice(0, 8)}...
            </code>
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-900/50 border border-red-500 rounded-lg text-red-200 text-center">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="playerName" className="block text-gray-300 mb-2">
              プレイヤー名
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="プレイヤー名を入力"
              className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-slate-500"
              disabled={isJoining}
              autoFocus
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={!playerName.trim() || isJoining}
            className="w-full py-4 bg-slate-600 hover:bg-slate-500 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg text-white font-bold text-lg transition-colors"
          >
            {isJoining ? "入室中..." : "入室する"}
          </button>
        </div>
      </div>
    </main>
  );
}
