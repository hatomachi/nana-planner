import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { TimeBlock } from './types';
import { hourToPixel, formatHour } from './timelineUtils';
import { HOUR_HEIGHT } from './data';

interface TimeBlockComponentProps {
  block: TimeBlock;
  nowHour: number;
  /** Resolved milestone title for the target badge */
  targetMilestoneLabel?: string;
  /** Whether this milestone has at-risk tasks */
  isAtRisk?: boolean;
}

export const TimeBlockComponent: React.FC<TimeBlockComponentProps> = ({
  block,
  nowHour,
  targetMilestoneLabel,
  isAtRisk,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: block.id,
      disabled: block.type === 'milestone',
    });

  const top = hourToPixel(block.startHour);
  const height = block.durationHours * HOUR_HEIGHT;
  const endHour = block.startHour + block.durationHours;

  const isOverdue =
    block.type === 'task' && !block.completed && nowHour > endHour;

  const isMilestone = block.type === 'milestone';
  const isCompleted = block.completed;

  const dragStyle = transform
    ? { transform: `translate3d(0, ${transform.y}px, 0)` }
    : undefined;

  // Compact height handling — if HOUR_HEIGHT is small, single‐line layout
  const isCompact = height < 28;

  return (
    <div
      ref={setNodeRef}
      {...(block.type === 'task' ? { ...listeners, ...attributes } : {})}
      className={`
        absolute left-[52px] right-3 border overflow-hidden
        flex items-center
        transition-shadow duration-150
        ${isCompact ? 'rounded px-2 gap-2' : 'rounded-md px-2.5 py-1 gap-1.5 flex-col items-start justify-center'}
        ${isDragging ? 'z-50 shadow-xl opacity-90 scale-[1.01]' : 'z-10'}
        ${
          isMilestone
            ? isAtRisk
              ? 'bg-milestone border-l-[3px] animate-milestone-danger cursor-default'
              : 'bg-milestone border-milestone-border cursor-default'
            : isOverdue
              ? 'bg-task/80 border-task-border/40 border-l-[3px] border-l-danger-bright animate-overdue-accent cursor-grab'
              : isCompleted
                ? 'bg-emerald-900/20 border-emerald-800/30 cursor-grab opacity-50'
                : 'bg-task border-task-border cursor-grab hover:shadow-md hover:shadow-task-border/20'
        }
      `}
      style={{
        top: `${top}px`,
        height: `${Math.max(height, 18)}px`,
        ...dragStyle,
      }}
    >
      {isCompact ? (
        /* ── Single-line compact layout ── */
        <>
          <span className={`text-[9px] font-mono shrink-0 ${isMilestone ? 'text-milestone-text/60' : isOverdue ? 'text-danger-glow/80' : isCompleted ? 'text-emerald-500/40' : 'text-task-text/50'}`}>
            {formatHour(block.startHour)}
          </span>
          <span className={`text-[11px] leading-none truncate ${isMilestone ? 'text-milestone-text font-medium' : isOverdue ? 'text-task-text/90' : isCompleted ? 'text-emerald-500/40 line-through' : 'text-task-text'}`}>
            {block.title}
          </span>
          {targetMilestoneLabel && !isCompleted && (
            <span className={`text-[8px] shrink-0 px-1 py-0 rounded ${isOverdue ? 'text-danger-glow/70 bg-danger/20' : 'text-text-muted bg-surface-overlay/50'}`}>
              🎯{targetMilestoneLabel}
            </span>
          )}
          {isOverdue && (
            <span className="text-[8px] text-danger-bright shrink-0">遅延</span>
          )}
        </>
      ) : (
        /* ── Multi-line layout (taller blocks) ── */
        <>
          {/* Top row: time + milestone target */}
          <div className="flex items-center gap-1.5 w-full min-w-0">
            <span className={`text-[9px] font-mono shrink-0 ${isMilestone ? 'text-milestone-text/50' : isOverdue ? 'text-danger-glow/70' : isCompleted ? 'text-emerald-500/40' : 'text-task-text/50'}`}>
              {formatHour(block.startHour)}–{formatHour(endHour)}
            </span>
            {targetMilestoneLabel && !isCompleted && (
              <span className={`text-[8px] px-1 rounded truncate ${isOverdue ? 'text-danger-glow/80 bg-danger/20' : 'text-text-muted bg-surface-overlay/40'}`}>
                🎯 {targetMilestoneLabel}
              </span>
            )}
            {isOverdue && (
              <span className="text-[8px] text-danger-bright font-semibold ml-auto shrink-0">⚠ 遅延中</span>
            )}
          </div>

          {/* Title */}
          <span className={`text-[11px] leading-tight truncate w-full ${isMilestone ? 'text-milestone-text font-medium' : isOverdue ? 'text-task-text' : isCompleted ? 'text-emerald-500/40 line-through' : 'text-task-text'}`}>
            {block.title}
          </span>

          {/* Milestone at-risk indicator */}
          {isMilestone && isAtRisk && (
            <span className="text-[8px] text-danger-glow font-semibold animate-pulse">
              ⚠ 準備タスクに遅延あり
            </span>
          )}
        </>
      )}

      {/* Drag handle (tasks only, visible on taller blocks) */}
      {block.type === 'task' && !isCompleted && !isCompact && (
        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex flex-col gap-px opacity-20">
          <span className="block w-3 h-px bg-current rounded" />
          <span className="block w-3 h-px bg-current rounded" />
        </div>
      )}
    </div>
  );
};
