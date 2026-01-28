interface TappableUnknownCardProps {
  selected?: boolean;
  disabled?: boolean;
  onClick: () => void;
}

export function TappableUnknownCard({ selected, disabled, onClick }: TappableUnknownCardProps) {
  if (disabled) {
    return (
      <div className="flex flex-col items-center">
        <div className="w-10 h-14 bg-gray-800 rounded border border-gray-600 flex items-center justify-center opacity-80">
          <span className="material-icons text-gray-400">question_mark</span>
        </div>
        <span className="text-[9px] text-gray-400 mt-0.5 font-bold">不明</span>
      </div>
    );
  }

  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center cursor-pointer transition-all active:scale-95 ${
        selected
          ? "ring-2 ring-amber-400 rounded shadow-[0_0_20px_rgba(212,175,55,0.5)]"
          : ""
      }`}
    >
      <div className={`w-10 h-14 bg-gray-800 rounded border flex items-center justify-center transition-all ${
        selected
          ? "border-amber-400"
          : "border-amber-400/50 shadow-[0_0_12px_rgba(212,175,55,0.3)] group-hover/player:border-amber-400 group-hover/player:shadow-[0_0_18px_rgba(212,175,55,0.5)]"
      }`}>
        <span className="material-icons text-amber-300">question_mark</span>
      </div>
      <span className="text-[9px] text-amber-300/80 mt-0.5 font-bold">不明</span>
    </button>
  );
}
