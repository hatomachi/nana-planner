import React from 'react';
import type { NextMilestoneInfo } from './timelineUtils';
import { formatHour, formatDuration, hourToPixel } from './timelineUtils';

interface CountdownBannerProps {
  info: NextMilestoneInfo;
}

/**
 * Floating countdown banner that appears on the timeline
 * between the NOW line and the next milestone,
 * showing effective working time remaining.
 */
export const CountdownBanner: React.FC<CountdownBannerProps> = ({ info }) => {
  const { milestone, effectiveHoursRemaining, urgency } = info;

  // Calculate progress percentage (inverse: how much time has "drained")
  // For the circular indicator
  const maxHours = 10; // reference max for visual indicator
  const progress = Math.min(effectiveHoursRemaining / maxHours, 1);
  const circumference = 2 * Math.PI * 18; // radius = 18
  const strokeDashoffset = circumference * (1 - progress);

  // Position the banner on the timeline — vertically centered between now line and milestone
  const milestoneY = hourToPixel(milestone.startHour);

  // Color scheme based on urgency
  const colors = {
    critical: {
      bg: 'bg-red-950/80',
      border: 'border-danger-bright/60',
      text: 'text-danger-glow',
      accent: 'text-danger-bright',
      ring: '#ef4444',
      ringTrack: '#451a1a',
      glow: 'shadow-red-500/30',
      badge: 'bg-danger/50',
    },
    warning: {
      bg: 'bg-amber-950/70',
      border: 'border-amber-500/50',
      text: 'text-amber-300',
      accent: 'text-amber-400',
      ring: '#f59e0b',
      ringTrack: '#451a03',
      glow: 'shadow-amber-500/20',
      badge: 'bg-amber-900/50',
    },
    normal: {
      bg: 'bg-surface-overlay/80',
      border: 'border-accent/30',
      text: 'text-accent-glow',
      accent: 'text-accent',
      ring: '#818cf8',
      ringTrack: '#1e1b4b',
      glow: 'shadow-accent/20',
      badge: 'bg-accent/20',
    },
  };

  const c = colors[urgency];

  return (
    <>
      {/* Connector line from NOW to milestone */}
      <div
        className={`absolute right-8 w-px z-30 pointer-events-none ${
          urgency === 'critical'
            ? 'bg-gradient-to-b from-danger-bright/60 to-danger-bright/10'
            : urgency === 'warning'
              ? 'bg-gradient-to-b from-amber-400/40 to-amber-400/10'
              : 'bg-gradient-to-b from-accent/30 to-accent/10'
        }`}
        style={{ top: `${milestoneY - 60}px`, height: '60px' }}
      />

      {/* Countdown card — positioned just above the milestone */}
      <div
        className={`absolute right-2 z-35 pointer-events-none`}
        style={{ top: `${milestoneY - 72}px` }}
      >
        <div
          className={`
            ${c.bg} ${c.border} border rounded-xl px-3 py-2
            backdrop-blur-md shadow-lg ${c.glow}
            flex items-center gap-3
            min-w-[200px]
          `}
        >
          {/* Circular progress indicator */}
          <div className="relative flex-shrink-0">
            <svg width="44" height="44" className="-rotate-90">
              {/* Track */}
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke={c.ringTrack}
                strokeWidth="3"
              />
              {/* Progress */}
              <circle
                cx="22"
                cy="22"
                r="18"
                fill="none"
                stroke={c.ring}
                strokeWidth="3"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 ease-out"
              />
            </svg>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xs">
                {urgency === 'critical' ? '🔥' : urgency === 'warning' ? '⏰' : '⏱️'}
              </span>
            </div>
          </div>

          {/* Text info */}
          <div className="flex flex-col min-w-0">
            {/* Duration */}
            <span className={`text-base font-bold font-mono tabular-nums ${c.text} leading-tight`}>
              {formatDuration(effectiveHoursRemaining)}
            </span>

            {/* Label */}
            <span className="text-[10px] text-text-muted leading-tight mt-0.5 truncate">
              → {formatHour(milestone.startHour)} {milestone.title}
            </span>

            {/* Urgency badge for critical */}
            {urgency === 'critical' && (
              <span className={`text-[9px] ${c.accent} font-semibold tracking-wider mt-0.5 animate-pulse`}>
                ⚠ 残りわずか
              </span>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

/**
 * Header-level countdown display for always-visible status
 */
interface CountdownHeaderProps {
  info: NextMilestoneInfo;
}

export const CountdownHeader: React.FC<CountdownHeaderProps> = ({ info }) => {
  const { milestone, effectiveHoursRemaining, urgency } = info;

  const urgencyStyles = {
    critical: 'bg-danger/20 border-danger-bright/40 text-danger-glow',
    warning: 'bg-amber-900/20 border-amber-500/40 text-amber-300',
    normal: 'bg-accent/10 border-accent/30 text-accent-glow',
  };

  const urgencyIcons = {
    critical: '🔥',
    warning: '⏰',
    normal: '⏱️',
  };

  return (
    <div className={`flex items-center gap-2 rounded-full px-3 py-1.5 border ${urgencyStyles[urgency]} transition-all duration-300`}>
      <span className="text-xs">{urgencyIcons[urgency]}</span>
      <div className="flex flex-col">
        <span className="text-xs font-bold font-mono tabular-nums leading-tight">
          {formatDuration(effectiveHoursRemaining)}
        </span>
        <span className="text-[9px] text-text-muted leading-tight truncate max-w-[120px]">
          → {formatHour(milestone.startHour)} {milestone.title.replace(/^[^\s]+\s/, '')}
        </span>
      </div>
    </div>
  );
};
