"use client";

import { useEffect, useState } from "react";
import { createTestRoomAction } from "@/actions";
import { PlayerColumn } from "@/components/dev/PlayerColumn";

interface RoomData {
  roomId: string;
  playerIds: string[];
  playerNames: string[];
}

export default function TestRoomPage() {
  const [roomData, setRoomData] = useState<RoomData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    createTestRoomAction().then((result) => {
      if (result.success && result.data) {
        setRoomData(result.data);
      } else {
        setError(result.error ?? "テストルーム作成に失敗");
      }
    });
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-red-500 p-4 text-center">
          <h1 className="text-xl font-bold mb-2">エラー</h1>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-white p-4 animate-pulse">読み込み中...</div>
      </div>
    );
  }

  return (
    <main className="h-screen bg-gray-950 p-2">
      <div className="grid grid-cols-4 gap-2 h-full">
        {roomData.playerIds.map((playerId, i) => (
          <PlayerColumn
            key={playerId}
            roomId={roomData.roomId}
            playerId={playerId}
            playerName={roomData.playerNames[i]}
          />
        ))}
      </div>
    </main>
  );
}
