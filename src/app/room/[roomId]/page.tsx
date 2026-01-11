interface RoomPageProps {
  params: Promise<{ roomId: string }>;
}

export default async function RoomPage({ params }: RoomPageProps) {
  const { roomId } = await params;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-2xl font-bold mb-4">ゲームルーム</h1>
      <p className="text-gray-400">Room ID: {roomId}</p>
    </main>
  );
}
