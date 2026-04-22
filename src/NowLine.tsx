import React from 'react';
import { hourToPixel } from './timelineUtils';

interface NowLineProps {
  nowHour: number;
}

export const NowLine: React.FC<NowLineProps> = ({ nowHour }) => {
  const top = hourToPixel(nowHour);

  return (
    <div
      className="absolute left-0 right-0 z-40 pointer-events-none"
      style={{ top: `${top}px` }}
    >
      {/* Diamond marker on the left */}
      <div className="absolute -left-1 -top-[6px] w-3 h-3 bg-nowline rounded-sm rotate-45 shadow-lg shadow-red-500/50" />

      {/* The line itself */}
      <div className="h-[2px] bg-nowline animate-pulse-glow rounded-full" />

      {/* "NOW" label */}
      <div className="absolute -top-[10px] left-4 bg-nowline text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-widest shadow-lg">
        NOW
      </div>
    </div>
  );
};
