import {
  SpacedRevisionSchedule,
  ChapterRevisionDueInfo,
  RevisionDueStatus,
  ReminderPreferences,
} from '../types';
import {
  NcertProgressStore,
  RevisionHistoryStore,
  ChapterNotesStore,
  getAllFlatChapters,
  NcertFlatChapter,
} from './ncertData';
import { getTodayDateString } from './studySessionUtils';

export const REVISION_SCHEDULE_STORAGE_KEY = 'sunday_plan_revision_schedule_v1';
export const REMINDER_PREFS_STORAGE_KEY = 'sunday_plan_reminder_prefs_v1';

export const DEFAULT_REVISION_SCHEDULE: SpacedRevisionSchedule = {
  intervalsDays: [1, 3, 7, 14, 30],
  enabled: true,
};

export const DEFAULT_REMINDER_PREFERENCES: ReminderPreferences = {
  inAppRemindersEnabled: true,
  thresholdDays: 3, // Show revisions due within 3 days
  includeInTodayDashboard: true,
  browserNotificationsEnabled: false,
};

export const loadRevisionSchedule = (): SpacedRevisionSchedule => {
  try {
    const saved = localStorage.getItem(REVISION_SCHEDULE_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && Array.isArray(parsed.intervalsDays) && parsed.intervalsDays.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load revision schedule:', err);
  }
  return DEFAULT_REVISION_SCHEDULE;
};

export const saveRevisionSchedule = (schedule: SpacedRevisionSchedule): void => {
  try {
    localStorage.setItem(REVISION_SCHEDULE_STORAGE_KEY, JSON.stringify(schedule));
  } catch (err) {
    console.error('Failed to save revision schedule:', err);
  }
};

export const loadReminderPreferences = (): ReminderPreferences => {
  try {
    const saved = localStorage.getItem(REMINDER_PREFS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.inAppRemindersEnabled === 'boolean') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load reminder preferences:', err);
  }
  return DEFAULT_REMINDER_PREFERENCES;
};

export const saveReminderPreferences = (prefs: ReminderPreferences): void => {
  try {
    localStorage.setItem(REMINDER_PREFS_STORAGE_KEY, JSON.stringify(prefs));
  } catch (err) {
    console.error('Failed to save reminder preferences:', err);
  }
};

/**
 * Calculates due revision information for a single chapter.
 */
export const calculateChapterRevisionDue = (
  chapter: NcertFlatChapter,
  progressStore: NcertProgressStore,
  revisionHistory: RevisionHistoryStore = {},
  notesStore: ChapterNotesStore = {},
  schedule: SpacedRevisionSchedule = DEFAULT_REVISION_SCHEDULE,
  todayStr: string = getTodayDateString(),
): ChapterRevisionDueInfo => {
  const progress = progressStore[chapter.id];
  const history: any[] =
    Array.isArray(progress?.revisionHistory) && progress!.revisionHistory!.length > 0
      ? progress!.revisionHistory!
      : revisionHistory[chapter.id] || [];
  const notesData = notesStore[chapter.id];

  // If Reading or Notes not complete, it is not ready for scheduled spaced revision
  if (!progress?.reading || !progress?.notes) {
    return {
      chapterId: chapter.id,
      chapterTitle: chapter.title,
      classNum: chapter.classNum,
      subject: chapter.subject,
      bookTitle: chapter.bookTitle,
      status: 'not_ready',
      revisionCount: history.length,
    };
  }

  const revisionCount = history.length;
  const intervals = schedule.intervalsDays;

  // Determine baseline date:
  let baselineDateStr = todayStr;
  let lastRevisedAt: string | undefined = undefined;

  if (revisionCount > 0) {
    const latestEvent = history[history.length - 1];
    const eventDate = latestEvent.completedAt
      ? latestEvent.completedAt.split('T')[0]
      : latestEvent.date || todayStr;
    baselineDateStr = eventDate;
    lastRevisedAt = eventDate;
  } else if (progress.notesAt) {
    baselineDateStr = progress.notesAt.split('T')[0];
  } else if (notesData?.updatedAt) {
    baselineDateStr = notesData.updatedAt.split('T')[0];
  }

  // Determine interval index
  const intervalIndex = Math.min(revisionCount, intervals.length - 1);
  const intervalDays = intervals[intervalIndex];

  // Calculate target due date
  const dueDate = addDaysToDateString(baselineDateStr, intervalDays);
  const daysDiff = calculateDaysFromToday(dueDate, todayStr);

  let status: RevisionDueStatus = 'upcoming';
  if (daysDiff < 0) {
    status = 'overdue';
  } else if (daysDiff === 0) {
    status = 'due_today';
  } else {
    status = 'upcoming';
  }

  return {
    chapterId: chapter.id,
    chapterTitle: chapter.title,
    classNum: chapter.classNum,
    subject: chapter.subject,
    bookTitle: chapter.bookTitle,
    lastRevisedAt,
    nextRevisionDue: dueDate,
    daysRemaining: daysDiff,
    status,
    revisionCount,
    currentIntervalDays: intervalDays,
  };
};

/**
 * Returns all NCERT chapters that have revisions due today or overdue
 */
export const getAllDueRevisions = (
  progressStore: NcertProgressStore,
  revisionHistory: RevisionHistoryStore,
  notesStore: ChapterNotesStore,
  schedule: SpacedRevisionSchedule = DEFAULT_REVISION_SCHEDULE,
  thresholdDays: number = 0
): ChapterRevisionDueInfo[] => {
  const chapters = getAllFlatChapters();
  const dueList: ChapterRevisionDueInfo[] = [];
  const todayStr = getTodayDateString();

  for (const ch of chapters) {
    const dueInfo = calculateChapterRevisionDue(ch, progressStore, revisionHistory, notesStore, schedule, todayStr);
    if (dueInfo.status === 'due_today' || dueInfo.status === 'overdue') {
      dueList.push(dueInfo);
    } else if (thresholdDays > 0 && dueInfo.status === 'upcoming' && typeof dueInfo.daysRemaining === 'number' && dueInfo.daysRemaining <= thresholdDays) {
      dueList.push(dueInfo);
    }
  }

  // Sort: overdue first (most days overdue), then due_today, then upcoming
  return dueList.sort((a, b) => {
    const aRem = a.daysRemaining ?? 999;
    const bRem = b.daysRemaining ?? 999;
    return aRem - bRem;
  });
};

function addDaysToDateString(dateStr: string, days: number): string {
  try {
    const parts = dateStr.split('-');
    const y = parseInt(parts[0], 10);
    const m = parseInt(parts[1], 10) - 1;
    const d = parseInt(parts[2], 10);
    const date = new Date(y, m, d);
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return dateStr;
  }
}

function calculateDaysFromToday(targetDateStr: string, todayStr: string): number {
  try {
    const targetParts = targetDateStr.split('-').map(Number);
    const todayParts = todayStr.split('-').map(Number);
    const dTarget = new Date(targetParts[0], targetParts[1] - 1, targetParts[2]);
    const dToday = new Date(todayParts[0], todayParts[1] - 1, todayParts[2]);
    const diffMs = dTarget.getTime() - dToday.getTime();
    return Math.round(diffMs / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
}
