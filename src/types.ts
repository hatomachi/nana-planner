export type BlockType = 'milestone' | 'task';

export interface TimeBlock {
  id: string;
  type: BlockType;
  title: string;
  /** Start time in decimal hours (e.g. 10.5 = 10:30) */
  startHour: number;
  /** Duration in hours (e.g. 1.5 = 1h30m) */
  durationHours: number;
  /** Whether the task has been completed */
  completed?: boolean;
  /** ID of the milestone this task is targeting (tasks only) */
  targetMilestoneId?: string;
}

export interface WarpZone {
  /** Start hour of the warp zone */
  startHour: number;
  /** End hour of the warp zone (can exceed 24 for next day) */
  endHour: number;
  /** Collapsed height in pixels */
  collapsedHeight: number;
  /** Label to display */
  label: string;
}
