import React from 'react';
import { hourToPixel } from './timelineUtils';
import { WARP_ZONE } from './data';

export const WarpZoneComponent: React.FC = () => {
  const top = hourToPixel(WARP_ZONE.startHour);
  const height = WARP_ZONE.collapsedHeight;

  return (
    <div
      className="absolute left-0 right-0 z-20 flex items-center justify-center
                 bg-warp-bg border-y border-warp-border"
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      {/* Sparse starfield */}
      <div className="absolute inset-0 overflow-hidden opacity-15">
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-purple-300 rounded-full"
            style={{
              left: `${10 + Math.random() * 80}%`,
              top: `${15 + Math.random() * 70}%`,
              opacity: 0.4 + Math.random() * 0.6,
            }}
          />
        ))}
      </div>

      <span className="text-warp-text text-[10px] font-medium tracking-wider z-10 select-none">
        {WARP_ZONE.label}
      </span>

      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warp-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warp-border to-transparent" />
    </div>
  );
};
