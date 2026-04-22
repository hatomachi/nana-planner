import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { TimeBlock } from './types';
import { initialBlocks, HOUR_HEIGHT, TIMELINE_START_HOUR, TIMELINE_END_HOUR, NEXT_DAY_START_HOUR, NEXT_DAY_END_HOUR } from './data';
import { hourToPixel, pixelToHour, getTotalTimelineHeight, formatHour } from './timelineUtils';
import { TimeBlockComponent } from './TimeBlockComponent';
import { NowLine } from './NowLine';
import { WarpZoneComponent } from './WarpZone';
import { DebugPanel } from './DebugPanel';

/**
 * Generate hour marks for the timeline grid.
 * Returns hours for today's working section and tomorrow's working section.
 */
function getHourMarks(): number[] {
  const marks: number[] = [];
  // Today: 9, 10, ..., 19
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
    marks.push(h);
  }
  // Tomorrow: 33(9), 34(10), ..., 43(19)
  for (let h = NEXT_DAY_START_HOUR; h <= NEXT_DAY_END_HOUR; h++) {
    marks.push(h);
  }
  return marks;
}

export const TimelineMockup: React.FC = () => {
  const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks);
  const [nowHour, setNowHour] = useState<number>(11.5); // Default: 11:30
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalHeight = getTotalTimelineHeight();
  const hourMarks = getHourMarks();

  // Scroll to the Now Line on mount
  useEffect(() => {
    if (scrollRef.current) {
      const nowPx = hourToPixel(nowHour);
      scrollRef.current.scrollTo({
        top: Math.max(0, nowPx - 200),
        behavior: 'smooth',
      });
    }
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // dnd-kit sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    })
  );

  // Handle drag end: update block position
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    const blockId = active.id as string;

    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;

        // Calculate new position
        const currentPx = hourToPixel(block.startHour);
        const newPx = currentPx + delta.y;
        let newStartHour = pixelToHour(newPx);

        // Prevent tasks from starting inside warp zone
        if (newStartHour > TIMELINE_END_HOUR && newStartHour < NEXT_DAY_START_HOUR) {
          // Snap to whichever boundary is closer
          const distToEnd = Math.abs(newStartHour - TIMELINE_END_HOUR);
          const distToNextStart = Math.abs(newStartHour - NEXT_DAY_START_HOUR);
          newStartHour = distToEnd < distToNextStart ? TIMELINE_END_HOUR : NEXT_DAY_START_HOUR;
        }

        // Clamp within timeline range
        if (newStartHour < TIMELINE_START_HOUR) newStartHour = TIMELINE_START_HOUR;
        const maxEndHour = NEXT_DAY_END_HOUR;
        if (newStartHour + block.durationHours > maxEndHour) {
          newStartHour = maxEndHour - block.durationHours;
        }

        return { ...block, startHour: newStartHour };
      })
    );
  }, []);

  // Count overdue tasks
  const overdueCount = blocks.filter(
    (b) => b.type === 'task' && !b.completed && nowHour > b.startHour + b.durationHours
  ).length;

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/80 backdrop-blur-xl border-b border-border px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-accent/30">
              N
            </div>
            <div>
              <h1 className="text-base font-bold text-text-primary tracking-tight">
                Nana Planner
              </h1>
              <p className="text-[10px] text-text-muted font-mono tracking-wider uppercase">
                Timeline Mockup
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {overdueCount > 0 && (
              <div className="flex items-center gap-1.5 bg-danger/30 border border-danger-bright/40 rounded-full px-3 py-1">
                <div className="w-1.5 h-1.5 rounded-full bg-danger-bright animate-pulse" />
                <span className="text-xs text-danger-glow font-semibold">
                  {overdueCount}件の遅延タスク
                </span>
              </div>
            )}
            <div className="text-right">
              <div className="text-xs text-text-secondary">
                {nowHour < 24 ? '本日' : '翌日'}
              </div>
              <div className="text-sm font-mono font-bold text-text-primary tabular-nums">
                {formatHour(nowHour)}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Timeline Body */}
      <main className="flex-1 overflow-hidden">
        <div
          ref={scrollRef}
          className="h-[calc(100vh-56px)] overflow-y-auto scroll-smooth"
        >
          <div className="max-w-4xl mx-auto px-6 py-4">
            {/* Day label */}
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs font-mono text-text-muted uppercase tracking-widest">
                Today
              </span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Timeline container */}
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="relative" style={{ height: `${totalHeight}px` }}>
                {/* Hour grid lines and labels */}
                {hourMarks.map((hour) => {
                  const y = hourToPixel(hour);
                  const isSection = hour === NEXT_DAY_START_HOUR;
                  return (
                    <div key={hour} className="absolute left-0 right-0" style={{ top: `${y}px` }}>
                      {/* Section divider for "Tomorrow" */}
                      {isSection && (
                        <div className="flex items-center gap-2 -mt-6 mb-1">
                          <span className="text-xs font-mono text-text-muted uppercase tracking-widest">
                            Tomorrow
                          </span>
                          <div className="flex-1 h-px bg-border-subtle" />
                        </div>
                      )}

                      {/* Hour label */}
                      <span className="absolute -left-0 top-0 -translate-y-1/2 text-xs font-mono text-text-muted w-14 text-right pr-3 select-none">
                        {formatHour(hour)}
                      </span>

                      {/* Grid line */}
                      <div className="absolute left-[64px] right-0 h-px bg-border-subtle" />

                      {/* Half-hour line (subtle) */}
                      {hour < (hour >= NEXT_DAY_START_HOUR ? NEXT_DAY_END_HOUR : TIMELINE_END_HOUR) && (
                        <div
                          className="absolute left-[64px] right-0 h-px bg-border-subtle/40"
                          style={{ top: `${HOUR_HEIGHT / 2}px` }}
                        />
                      )}
                    </div>
                  );
                })}

                {/* Warp Zone */}
                <WarpZoneComponent />

                {/* Now Line */}
                <NowLine nowHour={nowHour} />

                {/* Time Blocks */}
                {blocks.map((block) => (
                  <TimeBlockComponent
                    key={block.id}
                    block={block}
                    nowHour={nowHour}
                  />
                ))}
              </div>
            </DndContext>
          </div>
        </div>
      </main>

      {/* Debug Panel */}
      <DebugPanel nowHour={nowHour} onNowHourChange={setNowHour} />
    </div>
  );
};
