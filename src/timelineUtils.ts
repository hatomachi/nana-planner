import {
  HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  WARP_ZONE,
  NEXT_DAY_START_HOUR,
  NEXT_DAY_END_HOUR,
} from './data';
import type { TimeBlock } from './types';

/**
 * Convert a decimal hour to a pixel Y position on the timeline.
 * Accounts for warp zones (collapsed non-working hours).
 */
export function hourToPixel(hour: number): number {
  if (hour <= TIMELINE_END_HOUR) {
    return (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT;
  }

  const todaySectionHeight =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT;

  if (hour <= WARP_ZONE.endHour) {
    const progress =
      (hour - WARP_ZONE.startHour) / (WARP_ZONE.endHour - WARP_ZONE.startHour);
    return todaySectionHeight + progress * WARP_ZONE.collapsedHeight;
  }

  const afterWarp = todaySectionHeight + WARP_ZONE.collapsedHeight;
  return afterWarp + (hour - NEXT_DAY_START_HOUR) * HOUR_HEIGHT;
}

/**
 * Convert a pixel Y position back to a decimal hour.
 * Snaps to 15-minute increments.
 */
export function pixelToHour(px: number): number {
  const todaySectionHeight =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT;
  const warpEnd = todaySectionHeight + WARP_ZONE.collapsedHeight;

  let rawHour: number;

  if (px <= todaySectionHeight) {
    rawHour = TIMELINE_START_HOUR + px / HOUR_HEIGHT;
  } else if (px <= warpEnd) {
    rawHour = WARP_ZONE.startHour;
  } else {
    rawHour = NEXT_DAY_START_HOUR + (px - warpEnd) / HOUR_HEIGHT;
  }

  return Math.round(rawHour * 4) / 4;
}

/**
 * Get the total height of the timeline in pixels.
 */
export function getTotalTimelineHeight(): number {
  const todaySection =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT;
  const tomorrowSection =
    (NEXT_DAY_END_HOUR - NEXT_DAY_START_HOUR) * HOUR_HEIGHT;
  return todaySection + WARP_ZONE.collapsedHeight + tomorrowSection;
}

/**
 * Format a decimal hour to HH:MM string.
 */
export function formatHour(hour: number): string {
  const normalizedHour = hour >= 24 ? hour - 24 : hour;
  const h = Math.floor(normalizedHour);
  const m = Math.round((normalizedHour - h) * 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Check if a given hour falls within the warp (non-working) zone.
 */
export function isInWarpZone(hour: number): boolean {
  return hour >= WARP_ZONE.startHour && hour < WARP_ZONE.endHour;
}

/**
 * Clamp hour to valid timeline range, skipping warp zone.
 */
export function clampHour(hour: number): number {
  if (hour < TIMELINE_START_HOUR) return TIMELINE_START_HOUR;
  if (hour >= TIMELINE_END_HOUR && hour < NEXT_DAY_START_HOUR)
    return TIMELINE_END_HOUR;
  if (hour > NEXT_DAY_END_HOUR) return NEXT_DAY_END_HOUR;
  return hour;
}

/**
 * Calculate the effective working hours between two time points,
 * excluding the warp (non-working) zone.
 */
export function getEffectiveWorkingHours(fromHour: number, toHour: number): number {
  if (toHour <= fromHour) return 0;

  const warpStart = WARP_ZONE.startHour;
  const warpEnd = WARP_ZONE.endHour;

  if (toHour <= warpStart) return toHour - fromHour;
  if (fromHour >= warpEnd) return toHour - fromHour;
  if (fromHour < warpStart && toHour <= warpEnd) return warpStart - fromHour;
  if (fromHour < warpStart && toHour > warpEnd) return (warpStart - fromHour) + (toHour - warpEnd);
  if (fromHour >= warpStart && fromHour < warpEnd) {
    if (toHour <= warpEnd) return 0;
    return toHour - warpEnd;
  }

  return toHour - fromHour;
}

/**
 * Format a duration in hours to a human-readable countdown string.
 */
export function formatDuration(hours: number): string {
  if (hours <= 0) return '0分';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

// ─── Net Usable Time (milestone-aware) ───

/**
 * Calculate the "Net Usable Time" between fromHour and toHour.
 * This is the effective working hours MINUS the duration of any
 * milestones (fixed appointments) that sit in between.
 *
 * Example: now=11, milestone at 16, but there's a 1h meeting at 13-14
 *   → effective working hours = 5h
 *   → minus 1h meeting = 4h net usable
 */
export function getNetUsableTime(
  fromHour: number,
  toHour: number,
  blocks: TimeBlock[]
): number {
  const effectiveHours = getEffectiveWorkingHours(fromHour, toHour);

  // Sum up all milestone durations that overlap with [fromHour, toHour]
  const milestoneDrain = blocks
    .filter((b) => b.type === 'milestone')
    .reduce((total, ms) => {
      const msEnd = ms.startHour + ms.durationHours;
      // Overlap calculation: max(0, min(toHour, msEnd) - max(fromHour, msStart))
      const overlapStart = Math.max(fromHour, ms.startHour);
      const overlapEnd = Math.min(toHour, msEnd);
      const overlap = Math.max(0, overlapEnd - overlapStart);

      // But we also need to check if this overlap is inside the warp zone
      // If so, it doesn't actually consume usable time
      if (isInWarpZone(ms.startHour)) return total;

      return total + overlap;
    }, 0);

  return Math.max(0, effectiveHours - milestoneDrain);
}

export interface NextMilestoneInfo {
  milestone: TimeBlock;
  /** Effective working hours until the milestone start (excl. warp) */
  effectiveHoursRemaining: number;
  /** Net usable hours = effective minus intervening milestones */
  netUsableHours: number;
  /** Raw hours until the milestone (including non-working time) */
  rawHoursRemaining: number;
  /** Urgency level based on netUsableHours */
  urgency: 'critical' | 'warning' | 'normal';
  /** Tasks that target this milestone and are overdue or at risk */
  atRiskTaskIds: string[];
}

/**
 * Find the next milestone after the given nowHour and compute
 * the net usable remaining working time.
 */
export function getNextMilestone(
  blocks: TimeBlock[],
  nowHour: number
): NextMilestoneInfo | null {
  const upcoming = blocks
    .filter((b) => b.type === 'milestone' && b.startHour > nowHour)
    .sort((a, b) => a.startHour - b.startHour);

  if (upcoming.length === 0) return null;

  const milestone = upcoming[0];
  const rawHoursRemaining = milestone.startHour - nowHour;
  const effectiveHoursRemaining = getEffectiveWorkingHours(nowHour, milestone.startHour);
  const netUsableHours = getNetUsableTime(nowHour, milestone.startHour, blocks);

  // Find tasks targeting this milestone that are overdue
  const atRiskTaskIds = blocks
    .filter((b) => {
      if (b.type !== 'task' || b.completed) return false;
      if (b.targetMilestoneId !== milestone.id) return false;
      const taskEnd = b.startHour + b.durationHours;
      return nowHour > taskEnd; // past the end time
    })
    .map((b) => b.id);

  let urgency: NextMilestoneInfo['urgency'] = 'normal';
  if (netUsableHours < 1) urgency = 'critical';
  else if (netUsableHours < 2) urgency = 'warning';

  return {
    milestone,
    effectiveHoursRemaining,
    netUsableHours,
    rawHoursRemaining,
    urgency,
    atRiskTaskIds,
  };
}
