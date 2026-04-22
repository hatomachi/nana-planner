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
  // Today's section: TIMELINE_START_HOUR .. TIMELINE_END_HOUR
  if (hour <= TIMELINE_END_HOUR) {
    return (hour - TIMELINE_START_HOUR) * HOUR_HEIGHT;
  }

  // Inside warp zone
  const todaySectionHeight =
    (TIMELINE_END_HOUR - TIMELINE_START_HOUR) * HOUR_HEIGHT;

  if (hour <= WARP_ZONE.endHour) {
    // Map linearly within the collapsed zone
    const progress =
      (hour - WARP_ZONE.startHour) / (WARP_ZONE.endHour - WARP_ZONE.startHour);
    return todaySectionHeight + progress * WARP_ZONE.collapsedHeight;
  }

  // Tomorrow's section
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
    // Inside warp — clamp to boundary
    rawHour = WARP_ZONE.startHour;
  } else {
    rawHour = NEXT_DAY_START_HOUR + (px - warpEnd) / HOUR_HEIGHT;
  }

  // Snap to 15-min
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
 * hour can exceed 24 (represents next day).
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
 *
 * Example: from 18:00 (hour=18) to next day 10:00 (hour=34)
 *   → working time = (19-18) + (34-33) = 2 hours
 *   (warp zone 19→33 is excluded)
 */
export function getEffectiveWorkingHours(fromHour: number, toHour: number): number {
  if (toHour <= fromHour) return 0;

  const warpStart = WARP_ZONE.startHour;
  const warpEnd = WARP_ZONE.endHour;

  // Both before warp
  if (toHour <= warpStart) {
    return toHour - fromHour;
  }

  // Both after warp
  if (fromHour >= warpEnd) {
    return toHour - fromHour;
  }

  // fromHour is before warp, toHour is inside warp
  if (fromHour < warpStart && toHour <= warpEnd) {
    return warpStart - fromHour;
  }

  // fromHour is before warp, toHour is after warp
  if (fromHour < warpStart && toHour > warpEnd) {
    return (warpStart - fromHour) + (toHour - warpEnd);
  }

  // fromHour is inside warp
  if (fromHour >= warpStart && fromHour < warpEnd) {
    if (toHour <= warpEnd) return 0;
    return toHour - warpEnd;
  }

  return toHour - fromHour;
}

/**
 * Format a duration in hours to a human-readable countdown string.
 * e.g. 2.5 → "2時間30分", 0.25 → "15分"
 */
export function formatDuration(hours: number): string {
  if (hours <= 0) return '0分';
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  if (h === 0) return `${m}分`;
  if (m === 0) return `${h}時間`;
  return `${h}時間${m}分`;
}

export interface NextMilestoneInfo {
  milestone: TimeBlock;
  /** Effective working hours until the milestone start */
  effectiveHoursRemaining: number;
  /** Raw hours until the milestone (including non-working time) */
  rawHoursRemaining: number;
  /** Urgency level: 'critical' (<1h), 'warning' (<2h), 'normal' */
  urgency: 'critical' | 'warning' | 'normal';
}

/**
 * Find the next milestone after the given nowHour
 * and compute the effective remaining working time.
 */
export function getNextMilestone(
  blocks: TimeBlock[],
  nowHour: number
): NextMilestoneInfo | null {
  // Get all milestones that haven't started yet
  const upcoming = blocks
    .filter((b) => b.type === 'milestone' && b.startHour > nowHour)
    .sort((a, b) => a.startHour - b.startHour);

  if (upcoming.length === 0) return null;

  const milestone = upcoming[0];
  const rawHoursRemaining = milestone.startHour - nowHour;
  const effectiveHoursRemaining = getEffectiveWorkingHours(nowHour, milestone.startHour);

  let urgency: NextMilestoneInfo['urgency'] = 'normal';
  if (effectiveHoursRemaining < 1) urgency = 'critical';
  else if (effectiveHoursRemaining < 2) urgency = 'warning';

  return {
    milestone,
    effectiveHoursRemaining,
    rawHoursRemaining,
    urgency,
  };
}

