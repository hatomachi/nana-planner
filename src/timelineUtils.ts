import {
  HOUR_HEIGHT,
  TIMELINE_START_HOUR,
  TIMELINE_END_HOUR,
  WARP_ZONE,
  NEXT_DAY_START_HOUR,
  NEXT_DAY_END_HOUR,
} from './data';

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
