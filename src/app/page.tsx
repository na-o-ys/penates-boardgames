export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <h1 className="text-4xl font-bold mb-8">ワンナイト人狼</h1>
      <p className="text-lg text-gray-400 mb-12">
        3〜10人で遊べるブラウザゲーム
      </p>
      <div className="flex flex-col gap-4">
        <button className="px-8 py-4 bg-blue-600 hover:bg-blue-700 rounded-lg text-lg font-semibold transition-colors">
          部屋を作成
        </button>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="部屋IDを入力"
            className="px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold transition-colors">
            参加
          </button>
        </div>
      </div>
    </main>
  );
}
