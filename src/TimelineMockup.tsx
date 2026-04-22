import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import type { TimeBlock } from './types';
import { initialBlocks, HOUR_HEIGHT, TIMELINE_START_HOUR, TIMELINE_END_HOUR, NEXT_DAY_START_HOUR, NEXT_DAY_END_HOUR } from './data';
import { hourToPixel, pixelToHour, getTotalTimelineHeight, formatHour, getNextMilestone } from './timelineUtils';
import { TimeBlockComponent } from './TimeBlockComponent';
import { NowLine } from './NowLine';
import { WarpZoneComponent } from './WarpZone';
import { DebugPanel } from './DebugPanel';
import { CountdownBanner, CountdownHeader } from './CountdownBanner';

function getHourMarks(): number[] {
  const marks: number[] = [];
  for (let h = TIMELINE_START_HOUR; h <= TIMELINE_END_HOUR; h++) {
    marks.push(h);
  }
  for (let h = NEXT_DAY_START_HOUR; h <= NEXT_DAY_END_HOUR; h++) {
    marks.push(h);
  }
  return marks;
}

export const TimelineMockup: React.FC = () => {
  const [blocks, setBlocks] = useState<TimeBlock[]>(initialBlocks);
  const [nowHour, setNowHour] = useState<number>(11.5);
  const scrollRef = useRef<HTMLDivElement>(null);

  const totalHeight = getTotalTimelineHeight();
  const hourMarks = getHourMarks();

  // Build a milestone lookup map: id → title (for target labels on tasks)
  const milestoneLookup = useMemo(() => {
    const map = new Map<string, TimeBlock>();
    blocks.filter((b) => b.type === 'milestone').forEach((b) => map.set(b.id, b));
    return map;
  }, [blocks]);

  // Scroll to Now Line on mount
  useEffect(() => {
    if (scrollRef.current) {
      const nowPx = hourToPixel(nowHour);
      scrollRef.current.scrollTo({
        top: Math.max(0, nowPx - 120),
        behavior: 'smooth',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 4 },
    })
  );

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event;
    const blockId = active.id as string;

    setBlocks((prev) =>
      prev.map((block) => {
        if (block.id !== blockId) return block;

        const currentPx = hourToPixel(block.startHour);
        const newPx = currentPx + delta.y;
        let newStartHour = pixelToHour(newPx);

        if (newStartHour > TIMELINE_END_HOUR && newStartHour < NEXT_DAY_START_HOUR) {
          const distToEnd = Math.abs(newStartHour - TIMELINE_END_HOUR);
          const distToNextStart = Math.abs(newStartHour - NEXT_DAY_START_HOUR);
          newStartHour = distToEnd < distToNextStart ? TIMELINE_END_HOUR : NEXT_DAY_START_HOUR;
        }

        if (newStartHour < TIMELINE_START_HOUR) newStartHour = TIMELINE_START_HOUR;
        if (newStartHour + block.durationHours > NEXT_DAY_END_HOUR) {
          newStartHour = NEXT_DAY_END_HOUR - block.durationHours;
        }

        return { ...block, startHour: newStartHour };
      })
    );
  }, []);

  // Count overdue tasks
  const overdueCount = blocks.filter(
    (b) => b.type === 'task' && !b.completed && nowHour > b.startHour + b.durationHours
  ).length;

  // Next milestone countdown (with net usable time)
  const nextMilestoneInfo = getNextMilestone(blocks, nowHour);

  // Set of milestone IDs that have at-risk tasks
  const atRiskMilestoneIds = useMemo(() => {
    const ids = new Set<string>();
    blocks.forEach((b) => {
      if (b.type === 'task' && !b.completed && b.targetMilestoneId) {
        const taskEnd = b.startHour + b.durationHours;
        if (nowHour > taskEnd) {
          ids.add(b.targetMilestoneId);
        }
      }
    });
    return ids;
  }, [blocks, nowHour]);

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-surface/85 backdrop-blur-xl border-b border-border px-4 py-2">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-accent to-purple-500 flex items-center justify-center text-white text-[10px] font-bold shadow-md shadow-accent/30">
              N
            </div>
            <div>
              <h1 className="text-sm font-bold text-text-primary tracking-tight leading-none">
                Nana Planner
              </h1>
              <p className="text-[8px] text-text-muted font-mono tracking-wider uppercase leading-none mt-0.5">
                Timeline
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {nextMilestoneInfo && (
              <CountdownHeader info={nextMilestoneInfo} />
            )}
            {overdueCount > 0 && (
              <div className="flex items-center gap-1 bg-danger/25 border border-danger-bright/30 rounded-full px-2 py-0.5">
                <div className="w-1 h-1 rounded-full bg-danger-bright animate-pulse" />
                <span className="text-[10px] text-danger-glow font-semibold">
                  {overdueCount}件遅延
                </span>
              </div>
            )}
            <div className="text-right">
              <div className="text-[9px] text-text-secondary leading-none">
                {nowHour < 24 ? '本日' : '翌日'}
              </div>
              <div className="text-xs font-mono font-bold text-text-primary tabular-nums leading-none mt-0.5">
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
          className="h-[calc(100vh-40px)] overflow-y-auto scroll-smooth"
        >
          <div className="max-w-4xl mx-auto px-4 py-2">
            {/* Day label */}
            <div className="mb-1 flex items-center gap-2">
              <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">
                Today
              </span>
              <div className="flex-1 h-px bg-border-subtle" />
            </div>

            {/* Timeline container */}
            <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
              <div className="relative" style={{ height: `${totalHeight}px` }}>
                {/* Hour grid */}
                {hourMarks.map((hour) => {
                  const y = hourToPixel(hour);
                  const isSection = hour === NEXT_DAY_START_HOUR;
                  return (
                    <div key={hour} className="absolute left-0 right-0" style={{ top: `${y}px` }}>
                      {isSection && (
                        <div className="flex items-center gap-2 -mt-4 mb-0.5">
                          <span className="text-[9px] font-mono text-text-muted uppercase tracking-widest">
                            Tomorrow
                          </span>
                          <div className="flex-1 h-px bg-border-subtle" />
                        </div>
                      )}

                      {/* Hour label */}
                      <span className="absolute left-0 top-0 -translate-y-1/2 text-[9px] font-mono text-text-muted w-11 text-right pr-2 select-none">
                        {formatHour(hour)}
                      </span>

                      {/* Grid line */}
                      <div className="absolute left-[48px] right-0 h-px bg-border-subtle" />
                    </div>
                  );
                })}

                {/* Warp Zone */}
                <WarpZoneComponent />

                {/* Now Line */}
                <NowLine nowHour={nowHour} />

                {/* Countdown Banner */}
                {nextMilestoneInfo && (
                  <CountdownBanner info={nextMilestoneInfo} />
                )}

                {/* Time Blocks */}
                {blocks.map((block) => {
                  // Resolve target milestone label for tasks
                  let targetLabel: string | undefined;
                  if (block.type === 'task' && block.targetMilestoneId) {
                    const ms = milestoneLookup.get(block.targetMilestoneId);
                    if (ms) {
                      targetLabel = `${formatHour(ms.startHour)} ${ms.title.replace(/^[^\s]+\s/, '')}`;
                    }
                  }

                  // Is this milestone at risk?
                  const isAtRisk = block.type === 'milestone' && atRiskMilestoneIds.has(block.id);

                  return (
                    <TimeBlockComponent
                      key={block.id}
                      block={block}
                      nowHour={nowHour}
                      targetMilestoneLabel={targetLabel}
                      isAtRisk={isAtRisk}
                    />
                  );
                })}
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
