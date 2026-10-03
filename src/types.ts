export type Priority = 'High' | 'Medium' | 'Low';

export interface Task {
  id: string;
  title: string;
  category: string;
  priority: Priority;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
  carriedOverFrom?: string; // week ID if carried over
  isRecurring?: boolean; // automatically repeats in next weekly cycles
  notes?: string;
  scheduledDate?: string; // YYYY-MM-DD
  startTime?: string; // e.g. "19:00"
  estimatedMinutes?: number; // e.g. 15, 20, 30, 45, 60, 90, or custom
  ncertRef?: {
    classNum: number;
    subject: string;
    bookTitle: string;
    bookId?: string;
    chapterId: string;
    chapterTitle: string;
    activity: 'reading' | 'notes' | 'revision';
  };
  // External Calendar Sync Architecture (P3.2)
  externalCalendarProvider?: 'google_calendar' | string;
  externalCalendarId?: string;
  externalEventId?: string;
  lastSyncedAt?: string;
  syncStatus?: 'synced' | 'pending' | 'failed' | 'conflict';
}

export interface WeekPlan {
  id: string; // e.g. "2026-09-27" (Sunday date in YYYY-MM-DD)
  sundayDate: string; // ISO string or YYYY-MM-DD
  title: string; // e.g. "Week of Sunday, Sep 27"
  focusGoal?: string;
  tasks: Task[];
  createdAt: string;
  isArchived?: boolean;
}

export type TaskFilter = 'all' | 'remaining' | 'completed';

// 3-Stage Checklist as handwritten by user:
// 1st: Reading & Notes
// 2nd: Deep Study
// 3rd: Revision
export interface StageChecklist {
  readingNotes: boolean;
  readingNotesAt?: string;
  deepStudy: boolean;
  deepStudyAt?: string;
  revision: boolean;
  revisionAt?: string;
}

export interface ChapterItem {
  id: string;
  chapterNumber: number;
  title: string;
  readingNotes: boolean;
  deepStudy: boolean;
  revision: boolean;
  isFinished: boolean;
  finishedAt?: string;
  notes?: string;
}

export interface SubjectModule {
  id: string;
  code?: string; // e.g. 'MPS E4', 'MHI 103', 'Paper 1', etc.
  name: string;
  description?: string;
  chapters: ChapterItem[];
}

export interface SchoolInternshipTask {
  id: string;
  title: string; // e.g. 'Lesson Plan', 'Reflective Journal', etc.
  targetCount: number; // e.g. 50, 20, 20, 1, 4
  currentCount: number;
  status: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  finishedAt?: string;
}

export type ProgramType = 'bed' | 'ma' | 'ctet' | 'ugc_net' | 'canva' | 'custom';

export interface ProgramTab {
  id: string;
  type: ProgramType;
  title: string; // e.g. 'B.Ed 3rd Sem', 'M.A. History', etc.
  subtitle?: string;
  badge?: string;
  color: string;
  siTasks?: SchoolInternshipTask[]; // Specific to B.Ed School Internship
  subjects?: SubjectModule[]; // For MA, CTET, UGC NET, or custom subjects
  createdAt: string;
}

export type MainTab = 'today' | 'weekly_planning' | 'calendar' | 'academic_tracks' | 'ncert' | 'progress';
export type ActiveTabId = 'today' | 'weekly_planning' | 'calendar' | 'academic_tracks' | 'ncert_tracker' | 'sunday_plan' | 'dashboard_report' | 'progress_board' | string;
export type ViewMode = 'current' | 'history' | 'analytics';

export interface StudySession {
  id: string;
  taskId?: string;
  taskTitle: string;
  startedAt: string; // ISO string
  endedAt: string; // ISO string
  durationSeconds: number;
  category?: string;
  ncertRef?: {
    classNum: number;
    subject: string;
    bookTitle: string;
    bookId?: string;
    chapterId: string;
    chapterTitle: string;
    activity: 'reading' | 'notes' | 'revision';
  };
  notes?: string;
  isManual?: boolean;
}

export interface ActiveStudySession {
  taskId?: string;
  taskTitle: string;
  category?: string;
  startedAt: number; // Date.now() timestamp ms
  accumulatedSeconds: number; // Seconds elapsed prior to current running stint
  isPaused: boolean;
  lastPausedAt?: number;
  ncertRef?: {
    classNum: number;
    subject: string;
    bookTitle: string;
    bookId?: string;
    chapterId: string;
    chapterTitle: string;
    activity: 'reading' | 'notes' | 'revision';
  };
}

// Spaced Revision System (P3.3)
export interface SpacedRevisionSchedule {
  intervalsDays: number[]; // default [1, 3, 7, 14, 30]
  enabled: boolean;
}

export type RevisionDueStatus = 'not_ready' | 'upcoming' | 'due_today' | 'overdue' | 'completed_cycle';

export interface ChapterRevisionDueInfo {
  chapterId: string;
  chapterTitle: string;
  classNum: number;
  subject: string;
  bookTitle: string;
  lastRevisedAt?: string;
  nextRevisionDue?: string; // YYYY-MM-DD
  daysRemaining?: number;
  status: RevisionDueStatus;
  revisionCount: number;
  currentIntervalDays?: number;
}

// Goals and Targets (P3.6)
export interface StudyGoals {
  weeklyStudyMinutesGoal: number; // default: 600 (10 hours)
  weeklyTasksGoal: number; // default: 15
  weeklyNcertChaptersGoal: number; // default: 5
  weeklyRevisionSessionsGoal: number; // default: 8
}

// Workload Balancing & Daily Capacity (P3.7)
export interface DailyCapacityConfig {
  weekdayCapacityMinutes: number; // default: 150 (2h 30m)
  weekendCapacityMinutes: number; // default: 240 (4h)
}

// Google Calendar Integration Architecture (P3.2)
export interface GoogleCalendarIntegrationConfig {
  connected: boolean;
  accountEmail?: string;
  syncPlannerToGoogle: 'off' | 'timed_only' | 'all';
  syncGoogleToPlanner: boolean;
  syncDirection: 'planner_to_google' | 'google_to_planner' | 'two_way';
  lastSyncedAt?: string;
  status: 'not_connected' | 'connecting' | 'connected' | 'error';
}

// In-app Reminders & Notifications (P3.4)
export interface ReminderPreferences {
  inAppRemindersEnabled: boolean;
  thresholdDays: number; // 0 (today only), 3, or 7
  includeInTodayDashboard: boolean;
  browserNotificationsEnabled: boolean;
}


