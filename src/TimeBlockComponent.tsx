import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import type { TimeBlock } from './types';
import { hourToPixel, formatHour } from './timelineUtils';
import { HOUR_HEIGHT } from './data';

interface TimeBlockComponentProps {
  block: TimeBlock;
  nowHour: number;
}

export const TimeBlockComponent: React.FC<TimeBlockComponentProps> = ({
  block,
  nowHour,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: block.id,
      disabled: block.type === 'milestone',
    });

  const top = hourToPixel(block.startHour);
  const height = block.durationHours * HOUR_HEIGHT;
  const endHour = block.startHour + block.durationHours;

  // Is this task overdue? (now past end time, and not completed)
  const isOverdue =
    block.type === 'task' && !block.completed && nowHour > endHour;

  const isMilestone = block.type === 'milestone';
  const isCompleted = block.completed;

  const dragStyle = transform
    ? { transform: `translate3d(0, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...(block.type === 'task' ? { ...listeners, ...attributes } : {})}
      className={`
        absolute left-[72px] right-4 rounded-lg border px-3 py-2
        flex flex-col justify-center
        transition-shadow duration-200
        ${isDragging ? 'z-50 shadow-2xl opacity-90 scale-[1.02]' : 'z-10'}
        ${
          isMilestone
            ? 'bg-milestone border-milestone-border cursor-default'
            : isOverdue
              ? 'animate-overdue-blink border-danger-bright cursor-grab'
              : isCompleted
                ? 'bg-emerald-900/30 border-emerald-700/50 cursor-grab opacity-60'
                : 'bg-task border-task-border cursor-grab hover:shadow-lg hover:shadow-task-border/20'
        }
      `}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: '32px',
        ...dragStyle,
      }}
    >
      {/* Time range badge */}
      <span
        className={`
          text-[10px] font-mono tracking-wider mb-0.5
          ${isMilestone ? 'text-milestone-text/60' : isOverdue ? 'text-danger-glow' : isCompleted ? 'text-emerald-400/50' : 'text-task-text/60'}
        `}
      >
        {formatHour(block.startHour)} – {formatHour(endHour)}
      </span>

      {/* Title */}
      <span
        className={`
          text-sm font-medium leading-tight truncate
          ${isMilestone ? 'text-milestone-text' : isOverdue ? 'text-danger-glow font-semibold' : isCompleted ? 'text-emerald-400/50 line-through' : 'text-task-text'}
        `}
      >
        {block.title}
      </span>

      {/* Overdue badge */}
      {isOverdue && (
        <span className="text-[10px] text-danger-bright font-semibold mt-0.5 tracking-wide">
          ⚠️ 遅延中
        </span>
      )}

      {/* Drag handle indicator for tasks */}
      {block.type === 'task' && !isCompleted && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 opacity-30">
          <span className="block w-4 h-0.5 bg-current rounded" />
          <span className="block w-4 h-0.5 bg-current rounded" />
          <span className="block w-4 h-0.5 bg-current rounded" />
        </div>
      )}
    </div>
  );
};
