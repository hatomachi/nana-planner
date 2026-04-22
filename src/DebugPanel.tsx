import React from 'react';
import { formatHour } from './timelineUtils';

interface DebugPanelProps {
  nowHour: number;
  onNowHourChange: (hour: number) => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  nowHour,
  onNowHourChange,
}) => {
  // Slider range: 9.0 → 43.0 (today 9AM → tomorrow 7PM)
  const min = 9;
  const max = 43;

  // Calculate the visual progress percentage
  const progress = ((nowHour - min) / (max - min)) * 100;

  return (
    <div className="fixed bottom-4 right-4 z-[100] bg-surface-raised/95 backdrop-blur-md border border-border rounded-xl p-4 shadow-2xl w-72">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <div className="w-2 h-2 rounded-full bg-danger-bright animate-pulse" />
        <span className="text-xs font-mono text-text-secondary uppercase tracking-widest">
          Debug Panel
        </span>
      </div>

      {/* Current time display */}
      <div className="text-center mb-3">
        <span className="text-2xl font-mono font-bold text-text-primary tabular-nums">
          {formatHour(nowHour)}
        </span>
        <span className="text-xs text-text-muted ml-2">
          {nowHour >= 24 ? '(翌日)' : '(本日)'}
        </span>
      </div>

      {/* Slider */}
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={0.25}
          value={nowHour}
          onChange={(e) => onNowHourChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none
                     [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4
                     [&::-webkit-slider-thumb]:rounded-full
                     [&::-webkit-slider-thumb]:bg-nowline
                     [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:shadow-red-500/50
                     [&::-webkit-slider-thumb]:cursor-grab
                     [&::-webkit-slider-thumb]:active:cursor-grabbing
                     [&::-webkit-slider-thumb]:relative [&::-webkit-slider-thumb]:z-10"
          style={{
            background: `linear-gradient(to right, #ef4444 0%, #ef4444 ${progress}%, #2e2e48 ${progress}%, #2e2e48 100%)`,
          }}
        />

        {/* Time labels */}
        <div className="flex justify-between mt-1">
          <span className="text-[10px] text-text-muted font-mono">09:00</span>
          <span className="text-[10px] text-warp-text font-mono">🌙</span>
          <span className="text-[10px] text-text-muted font-mono">翌19:00</span>
        </div>
      </div>

      {/* Quick jump buttons */}
      <div className="flex gap-1.5 mt-3">
        {[9, 12, 15, 18, 33, 36, 40].map((h) => (
          <button
            key={h}
            onClick={() => onNowHourChange(h)}
            className={`
              flex-1 text-[10px] font-mono py-1 rounded
              border transition-all duration-150
              ${
                Math.abs(nowHour - h) < 0.5
                  ? 'bg-accent/30 border-accent text-accent-glow'
                  : 'bg-surface-overlay/50 border-border-subtle text-text-muted hover:text-text-secondary hover:border-border'
              }
            `}
          >
            {formatHour(h)}
          </button>
        ))}
      </div>
    </div>
  );
};
