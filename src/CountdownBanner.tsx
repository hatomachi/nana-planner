import React from 'react';
import type { NextMilestoneInfo } from './timelineUtils';
import { formatHour, formatDuration, hourToPixel } from './timelineUtils';

interface CountdownBannerProps {
  info: NextMilestoneInfo;
}

/**
 * Compact countdown card positioned just above the next milestone
 * on the timeline. Shows Net Usable Time (excluding intervening meetings).
 */
export const CountdownBanner: React.FC<CountdownBannerProps> = ({ info }) => {
  const { milestone, netUsableHours, urgency, atRiskTaskIds } = info;

  const milestoneY = hourToPixel(milestone.startHour);

  const colors = {
    critical: {
      bg: 'bg-red-950/85',
      border: 'border-danger-bright/50',
      text: 'text-danger-glow',
      accent: 'text-danger-bright',
      line: 'bg-danger-bright/40',
    },
    warning: {
      bg: 'bg-amber-950/75',
      border: 'border-amber-500/40',
      text: 'text-amber-300',
      accent: 'text-amber-400',
      line: 'bg-amber-500/30',
    },
    normal: {
      bg: 'bg-surface-overlay/80',
      border: 'border-accent/25',
      text: 'text-accent-glow',
      accent: 'text-accent',
      line: 'bg-accent/20',
    },
  };

  const c = colors[urgency];
  const hasRisk = atRiskTaskIds.length > 0;

  return (
    <>
      {/* Thin connector line */}
      <div
        className={`absolute right-6 w-px z-30 pointer-events-none ${c.line}`}
        style={{ top: `${milestoneY - 32}px`, height: '32px' }}
      />

      {/* Compact countdown pill */}
      <div
        className="absolute right-2 z-35 pointer-events-none"
        style={{ top: `${milestoneY - 52}px` }}
      >
        <div
          className={`
            ${c.bg} ${c.border} border rounded-lg px-2.5 py-1.5
            backdrop-blur-md shadow-md
            flex items-center gap-2
          `}
        >
          {/* Icon */}
          <span className="text-[10px]">
            {urgency === 'critical' ? '🔥' : urgency === 'warning' ? '⏰' : '⏱️'}
          </span>

          {/* Text */}
          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-1">
              <span className={`text-xs font-bold font-mono tabular-nums ${c.text} leading-none`}>
                {formatDuration(netUsableHours)}
              </span>
              <span className="text-[8px] text-text-muted leading-none">
                実質稼働
              </span>
            </div>
            <span className="text-[8px] text-text-muted leading-none mt-0.5 truncate">
              → {formatHour(milestone.startHour)} {milestone.title.replace(/^[^\s]+\s/, '')}
            </span>
          </div>

          {/* Risk indicator */}
          {hasRisk && (
            <div className="w-1.5 h-1.5 rounded-full bg-danger-bright animate-pulse shrink-0" />
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Header-level countdown — always visible, shows net usable time.
 */
interface CountdownHeaderProps {
  info: NextMilestoneInfo;
}

export const CountdownHeader: React.FC<CountdownHeaderProps> = ({ info }) => {
  const { milestone, netUsableHours, urgency, atRiskTaskIds } = info;

  const styles = {
    critical: 'bg-danger/20 border-danger-bright/40 text-danger-glow',
    warning: 'bg-amber-900/20 border-amber-500/40 text-amber-300',
    normal: 'bg-accent/10 border-accent/25 text-accent-glow',
  };

  const icons = {
    critical: '🔥',
    warning: '⏰',
    normal: '⏱️',
  };

  const hasRisk = atRiskTaskIds.length > 0;

  return (
    <div className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 border ${styles[urgency]} transition-all duration-300`}>
      <span className="text-[10px]">{icons[urgency]}</span>
      <div className="flex flex-col">
        <div className="flex items-center gap-1">
          <span className="text-[11px] font-bold font-mono tabular-nums leading-none">
            {formatDuration(netUsableHours)}
          </span>
          <span className="text-[8px] text-text-muted leading-none">実質</span>
        </div>
        <span className="text-[8px] text-text-muted leading-none mt-0.5 truncate max-w-[100px]">
          → {formatHour(milestone.startHour)} {milestone.title.replace(/^[^\s]+\s/, '')}
        </span>
      </div>
      {hasRisk && (
        <div className="w-1.5 h-1.5 rounded-full bg-danger-bright animate-pulse shrink-0" />
      )}
    </div>
  );
};
