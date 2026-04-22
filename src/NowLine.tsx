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
      {/* Diamond marker */}
      <div className="absolute -left-0.5 -top-[4px] w-2 h-2 bg-nowline rounded-sm rotate-45 shadow-md shadow-red-500/40" />

      {/* Line */}
      <div className="h-[2px] bg-nowline animate-pulse-glow rounded-full" />

      {/* NOW badge */}
      <div className="absolute -top-[8px] left-3 bg-nowline text-white text-[7px] font-bold px-1 py-px rounded tracking-widest shadow-md">
        NOW
      </div>
    </div>
  );
};
