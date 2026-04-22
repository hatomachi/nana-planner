import type { TimeBlock, WarpZone } from './types';

export const HOUR_HEIGHT = 100; // pixels per hour

/** Timeline visible range: 9:00 → 19:00 today, then warp, then 9:00 → 19:00 tomorrow */
export const TIMELINE_START_HOUR = 9;
export const TIMELINE_END_HOUR = 19; // displays up to 19:00 (7pm)

export const WARP_ZONE: WarpZone = {
  startHour: 19,
  endHour: 33, // 9:00 next day = 24+9 = 33
  collapsedHeight: 64,
  label: '🌙 14時間のインターバル ☀️',
};

/** Next-day block runs from 33 (9:00) to 43 (19:00) */
export const NEXT_DAY_START_HOUR = 33;
export const NEXT_DAY_END_HOUR = 43;

export const initialBlocks: TimeBlock[] = [
  {
    id: 'milestone-1',
    type: 'milestone',
    title: '🏢 グループ定例',
    startHour: 16,
    durationHours: 1,
    completed: false,
  },
  {
    id: 'milestone-2',
    type: 'milestone',
    title: '📋 週次報告',
    startHour: 38, // next day 14:00
    durationHours: 1,
    completed: false,
  },
  {
    id: 'task-1',
    type: 'task',
    title: '📝 委託会社への指示書作成',
    startHour: 10,
    durationHours: 1.5,
    completed: false,
  },
  {
    id: 'task-2',
    type: 'task',
    title: '📊 月次レポート更新',
    startHour: 12,
    durationHours: 1,
    completed: false,
  },
  {
    id: 'task-3',
    type: 'task',
    title: '💬 チャット返信まとめ',
    startHour: 14,
    durationHours: 0.5,
    completed: true,
  },
  {
    id: 'task-4',
    type: 'task',
    title: '🔍 新規案件の調査',
    startHour: 34, // next day 10:00
    durationHours: 2,
    completed: false,
  },
];
