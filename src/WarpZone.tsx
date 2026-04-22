import React from 'react';
import { hourToPixel } from './timelineUtils';
import { WARP_ZONE } from './data';

export const WarpZoneComponent: React.FC = () => {
  const top = hourToPixel(WARP_ZONE.startHour);
  const height = WARP_ZONE.collapsedHeight;

  return (
    <div
      className="absolute left-0 right-0 z-20 flex items-center justify-center
                 bg-warp-bg border-y border-warp-border
                 backdrop-blur-sm"
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      {/* Starfield dots */}
      <div className="absolute inset-0 overflow-hidden opacity-20">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-purple-300 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: 0.3 + Math.random() * 0.7,
            }}
          />
        ))}
      </div>

      {/* Label */}
      <span className="text-warp-text text-sm font-medium tracking-wider z-10 select-none">
        {WARP_ZONE.label}
      </span>

      {/* Decorative gradient lines */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warp-border to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-warp-border to-transparent" />
    </div>
  );
};
