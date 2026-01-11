"use client";

interface TimerSettingsProps {
  nightDuration: number;
  dayDuration: number;
  votingDuration: number;
  onChange: (settings: { nightDuration?: number; dayDuration?: number; votingDuration?: number }) => void;
  disabled?: boolean;
}

const DURATION_OPTIONS = [
  { value: 10, label: "10秒" },
  { value: 30, label: "30秒" },
  { value: 60, label: "1分" },
  { value: 120, label: "2分" },
  { value: 180, label: "3分" },
  { value: 300, label: "5分" },
];

export function TimerSettings({
  nightDuration,
  dayDuration,
  votingDuration,
  onChange,
  disabled = false,
}: TimerSettingsProps) {
  return (
    <div className="space-y-4" data-testid="timer-settings">
      <div className="flex items-center justify-between">
        <span className="text-gray-300">夜フェーズ時間</span>
        <select
          value={nightDuration}
          onChange={(e) => onChange({ nightDuration: Number(e.target.value) })}
          disabled={disabled}
          className="bg-gray-700 text-white px-3 py-2 rounded-lg disabled:opacity-50"
          data-testid="night-duration-select"
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-300">議論フェーズ時間</span>
        <select
          value={dayDuration}
          onChange={(e) => onChange({ dayDuration: Number(e.target.value) })}
          disabled={disabled}
          className="bg-gray-700 text-white px-3 py-2 rounded-lg disabled:opacity-50"
          data-testid="day-duration-select"
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center justify-between">
        <span className="text-gray-300">投票フェーズ時間</span>
        <select
          value={votingDuration}
          onChange={(e) => onChange({ votingDuration: Number(e.target.value) })}
          disabled={disabled}
          className="bg-gray-700 text-white px-3 py-2 rounded-lg disabled:opacity-50"
          data-testid="voting-duration-select"
        >
          {DURATION_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
