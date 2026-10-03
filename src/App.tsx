import React, { lazy, Suspense, useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { useTimeout } from './hooks/useTimeout';
import { updateTaskInWeeks } from './utils/taskUtils';
import { readStored, readStoredText, writeStored, writeStoredText, removeStored, allowStorageReplacement, restoreStored, downloadRecoveryData } from './utils/storage';
import { validateWeeks, validatePrograms, validateBackup } from './utils/dataValidation';
import { mergeBackups } from './utils/backup';
import { loadStudySessions, STUDY_SESSIONS_STORAGE_KEY, ACTIVE_SESSION_STORAGE_KEY } from './utils/studySessionUtils';
import { STUDY_GOALS_STORAGE_KEY, DAILY_CAPACITY_STORAGE_KEY, GOOGLE_CALENDAR_STORAGE_KEY, loadGoogleCalendarConfig, DEFAULT_STUDY_GOALS, DEFAULT_DAILY_CAPACITY, DEFAULT_GOOGLE_CALENDAR_CONFIG } from './utils/calendarGoalsUtils';
import { REVISION_SCHEDULE_STORAGE_KEY, REMINDER_PREFS_STORAGE_KEY, DEFAULT_REVISION_SCHEDULE, DEFAULT_REMINDER_PREFERENCES } from './utils/spacedRevisionUtils';
import { StorageStatus } from './components/ui/Recovery';
import {
  WeekPlan,
  Task,
  Priority,
  MainTab,
  ProgramTab,
  SpacedRevisionSchedule,
  ReminderPreferences,
} from './types';
import { getSundaySep27Week } from './utils/sampleData';
import { INITIAL_PROGRAM_TABS } from './utils/academicProgramsData';
import { formatWeekTitle, getSunday, toDateKey, formatWeekRange, getNextSunday, parseDateKey } from './utils/dateUtils';
import { Navbar } from './components/Navbar';
import { CurrentWeekView } from './components/CurrentWeekView';
import { WorkspaceFooter } from './components/workspace/WorkspaceFooter';
import { PageHeader, SegmentedControl } from './components/ui/Primitives';
import type { FullBackupData } from './components/UnifiedBackupModal';
import {
  loadRevisionSchedule,
  saveRevisionSchedule,
  loadReminderPreferences,
  saveReminderPreferences,
  getAllDueRevisions,
} from './utils/spacedRevisionUtils';
import {
  loadStudyGoals,
  loadDailyCapacity,
} from './utils/calendarGoalsUtils';
import {
  loadNcertProgress,
  saveNcertProgress,
  loadNcertNotes,
  saveNcertNotes,
  NcertProgressStore,
  NcertNotesStore,
  TOTAL_NCERT_TASKS,
  NCERT_STORAGE_KEY,
  NCERT_NOTES_STORAGE_KEY,
  migrateNcertProgressStore,
  getAllFlatChapters,
  NcertFlatChapter,
} from './utils/ncertData';
import { Sparkles, Plus } from 'lucide-react';
import type { NavDestination } from './components/MobileNavDrawer';

const CalendarView = lazy(() => import('./components/CalendarView').then((module) => ({ default: module.CalendarView })));
const ProgressBoard = lazy(() => import('./components/ProgressBoard').then((module) => ({ default: module.ProgressBoard })));
const ProgramTrackView = lazy(() => import('./components/ProgramTrackView').then((module) => ({ default: module.ProgramTrackView })));
const NcertSocialScienceView = lazy(() => import('./components/NcertSocialScienceView').then((module) => ({ default: module.NcertSocialScienceView })));
const DashboardReportView = lazy(() => import('./components/DashboardReportView').then((module) => ({ default: module.DashboardReportView })));
const AdvancedAnalyticsView = lazy(() => import('./components/AdvancedAnalyticsView').then((module) => ({ default: module.AdvancedAnalyticsView })));
const RevisionReminderCenterModal = lazy(() => import('./components/RevisionReminderCenterModal').then((module) => ({ default: module.RevisionReminderCenterModal })));
const UnifiedBackupModal = lazy(() => import('./components/UnifiedBackupModal').then((module) => ({ default: module.UnifiedBackupModal })));
const NcertAddToWeeklyPlanModal = lazy(() => import('./components/NcertAddToWeeklyPlanModal').then((module) => ({ default: module.NcertAddToWeeklyPlanModal })));
const CleanSlateModal = lazy(() => import('./components/CleanSlateModal').then((module) => ({ default: module.CleanSlateModal })));
const NcertLinkedCompletionPrompt = lazy(() => import('./components/NcertLinkedCompletionPrompt').then((module) => ({ default: module.NcertLinkedCompletionPrompt })));
const AddProgramModal = lazy(() => import('./components/AddProgramModal').then((module) => ({ default: module.AddProgramModal })));
const NewWeekModal = lazy(() => import('./components/NewWeekModal').then((module) => ({ default: module.NewWeekModal })));
const TaskModal = lazy(() => import('./components/TaskModal').then((module) => ({ default: module.TaskModal })));
const NotebookReferenceModal = lazy(() => import('./components/NotebookReferenceModal').then((module) => ({ default: module.NotebookReferenceModal })));
const StandaloneExportModal = lazy(() => import('./components/StandaloneExportModal').then((module) => ({ default: module.StandaloneExportModal })));
const UploadHandwrittenPlanModal = lazy(() => import('./components/UploadHandwrittenPlanModal').then((module) => ({ default: module.UploadHandwrittenPlanModal })));

const STORAGE_KEY = 'sunday_plan_tracker_storage_v3';
const PROGRAMS_STORAGE_KEY = 'sunday_plan_academic_programs_v3';
const THEME_KEY = 'sunday_plan_theme_v1';
const WEEK_KEYS = [STORAGE_KEY, 'sunday_plan_tracker_storage_v2', 'sunday_plan_tracker_storage_v1'];
const PROGRAM_KEYS = [PROGRAMS_STORAGE_KEY, 'sunday_plan_academic_programs_v2', 'sunday_plan_academic_programs_v1', 'academicPrograms'];
const NCERT_KEYS = [NCERT_STORAGE_KEY, 'ncertSocialScienceProgress_v2', 'ncertSocialScienceProgress_v1', 'ncertSocialScienceProgress'];

export default function App() {
  const [dataRevision, setDataRevision] = useState(0);
  // Weekly plans state
  const [weeks, setWeeks] = useState<WeekPlan[]>(() => readStored(
    [STORAGE_KEY, 'sunday_plan_tracker_storage_v2', 'sunday_plan_tracker_storage_v1'],
    value => { const plans = validateWeeks(value); if (!plans.length) throw new Error('Empty weekly plans'); return plans; },
    [getSundaySep27Week()],
  ));

  // Track active week ID
  const [activeWeekId, setActiveWeekId] = useState<string>(() => {
    if (weeks.some((w) => w.id === '2026-09-27')) {
      return '2026-09-27';
    }
    if (weeks.length > 0) {
      const sorted = [...weeks].sort((a, b) => b.sundayDate.localeCompare(a.sundayDate));
      return sorted[0].id;
    }
    return '2026-09-27';
  });

  // Academic Program Tabs
  const [programs, setPrograms] = useState<ProgramTab[]>(() => readStored(
    [PROGRAMS_STORAGE_KEY, 'sunday_plan_academic_programs_v2', 'sunday_plan_academic_programs_v1', 'academicPrograms'],
    value => { const tabs = validatePrograms(value); if (!tabs.length) throw new Error('Empty programs'); return tabs; },
    INITIAL_PROGRAM_TABS,
  ));

  // Main Tabs: 'weekly_planning' (default) | 'academic_tracks' | 'ncert' | 'calendar' | 'progress'
  const [mainTab, setMainTab] = useState<MainTab>('weekly_planning');

  // Currently selected program id within academic tracks
  const [selectedProgramId, setSelectedProgramId] = useState<string>(() => {
    return programs.length > 0 ? programs[0].id : 'bed-sem3';
  });

  // Sub-views
  const [academicSubView, setAcademicSubView] = useState<'track' | 'audit'>('track');
  const [progressSubView, setProgressSubView] = useState<'analytics' | 'velocity' | 'audit'>('analytics');

  // Dark mode
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = readStoredText(THEME_KEY);
    if (saved) return saved === 'dark';
    return true;
  });

  // Spaced Revision & Reminders
  const [revisionSchedule, setRevisionSchedule] = useState<SpacedRevisionSchedule>(() =>
    loadRevisionSchedule()
  );
  const [reminderPreferences, setReminderPreferences] = useState<ReminderPreferences>(() =>
    loadReminderPreferences()
  );

  useEffect(() => {
    saveRevisionSchedule(revisionSchedule);
  }, [revisionSchedule]);

  useEffect(() => {
    saveReminderPreferences(reminderPreferences);
  }, [reminderPreferences]);

  // NCERT Progress & Notes State
  const [ncertProgress, setNcertProgress] = useState<NcertProgressStore>(() => loadNcertProgress());
  const [ncertNotes, setNcertNotes] = useState<NcertNotesStore>(() => loadNcertNotes());

  useEffect(() => {
    saveNcertProgress(ncertProgress);
  }, [ncertProgress]);

  useEffect(() => {
    saveNcertNotes(ncertNotes);
  }, [ncertNotes]);

  // Modals state
  const [isNewWeekModalOpen, setIsNewWeekModalOpen] = useState(false);
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [taskModalInitialDate, setTaskModalInitialDate] = useState<string | undefined>(undefined);
  const [isNotebookModalOpen, setIsNotebookModalOpen] = useState(false);
  const [isUploadScanModalOpen, setIsUploadScanModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isAddProgramModalOpen, setIsAddProgramModalOpen] = useState(false);
  const [isCleanSlateModalOpen, setIsCleanSlateModalOpen] = useState(false);
  const [isRemindersCenterOpen, setIsRemindersCenterOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [isNcertAddToWeeklyOpen, setIsNcertAddToWeeklyOpen] = useState(false);
  const [ncertAddToWeeklyChapter, setNcertAddToWeeklyChapter] = useState<NcertFlatChapter | null>(null);
  const [ncertAddToWeeklyPrefill, setNcertAddToWeeklyPrefill] = useState<'reading' | 'notes' | 'revision'>('reading');

  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { schedule: scheduleToast } = useTimeout();
  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    scheduleToast(() => setToastMessage(null), 3500);
  }, [scheduleToast]);

  // Prompt for linked completion between Weekly Planner and NCERT Tracker
  const [linkedNcertPrompt, setLinkedNcertPrompt] = useState<{
    taskId: string;
    taskTitle: string;
    chapterId: string;
    chapterTitle: string;
    activity: 'reading' | 'notes' | 'revision';
    className?: string;
    subject?: string;
  } | null>(null);

  // Auto-sync preference for linked NCERT tasks
  const [autoSyncNcert, setAutoSyncNcert] = useState<boolean>(() => {
    return readStoredText('sunday_plan_auto_sync_ncert') === 'true';
  });

  useEffect(() => {
    writeStoredText('sunday_plan_auto_sync_ncert', autoSyncNcert ? 'true' : 'false');
  }, [autoSyncNcert]);

  // Sync weeks to localStorage
  useEffect(() => {
    writeStored(STORAGE_KEY, weeks);
  }, [weeks]);

  // Sync programs to localStorage
  useEffect(() => {
    writeStored(PROGRAMS_STORAGE_KEY, programs);
  }, [programs]);

  // Sync theme to DOM and localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      writeStoredText(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      writeStoredText(THEME_KEY, 'light');
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--canvas').trim());
  }, [isDarkMode]);

  // Active week lookup
  const activeWeek = useMemo(() => {
    return weeks.find((w) => w.id === activeWeekId) || weeks[0] || getSundaySep27Week();
  }, [weeks, activeWeekId]);

  // All tasks across all weeks
  const allTasks = useMemo(() => {
    return weeks.flatMap((w) => w.tasks);
  }, [weeks]);

  // Pending tasks count in active week
  const pendingTasksCount = useMemo(() => {
    return activeWeek ? activeWeek.tasks.filter((t) => !t.completed).length : 0;
  }, [activeWeek]);

  // NCERT completion calculation
  const ncertStats = useMemo(() => {
    let completedStages = 0;
    Object.values(ncertProgress).forEach((prog) => {
      if (prog.reading) completedStages++;
      if (prog.notes) completedStages++;
      if (prog.revision) completedStages++;
    });
    const percent = Math.min(100, Math.round((completedStages / TOTAL_NCERT_TASKS) * 100));
    return { completedStages, percent };
  }, [ncertProgress]);

  // Spaced revisions due lookup
  const dueRevisions = useMemo(() => {
    return getAllDueRevisions(ncertProgress, {}, ncertNotes, revisionSchedule, reminderPreferences.thresholdDays);
  }, [ncertProgress, ncertNotes, revisionSchedule, reminderPreferences.thresholdDays]);

  const dueRevisionsCount = dueRevisions.length;

  // Selected program for ProgramTrackView
  const currentSelectedProgram = useMemo(() => {
    return programs.find((p) => p.id === selectedProgramId) || programs[0] || INITIAL_PROGRAM_TABS[0];
  }, [programs, selectedProgramId]);

  // Existing categories for task modals
  const existingCategories = useMemo(() => {
    const cats = new Set<string>();
    weeks.forEach((w) => w.tasks.forEach((t) => cats.add(t.category)));
    programs.forEach((p) => cats.add(p.title));
    return Array.from(cats).filter(Boolean);
  }, [weeks, programs]);

  // Trigger celebration confetti
  const triggerConfetti = async () => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    try {
      const { default: confetti } = await import('canvas-confetti');
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    } catch {
      // Ignore if blocked
    }
  };

  // Task Toggle Handler
  const handleToggleTask = (taskId: string) => {
    const taskObj = allTasks.find((task) => task.id === taskId);
    if (!taskObj) return;
    const willBeCompleted = !taskObj.completed;
    const completedAt = willBeCompleted ? new Date().toISOString() : undefined;
    setWeeks((prevWeeks) => updateTaskInWeeks(prevWeeks, taskId, (task) => ({
      ...task, completed: willBeCompleted, completedAt,
    })));

    // Linked actions belong to the event handler, not a replayable state updater.
    if (willBeCompleted) {
      if (taskObj.ncertRef) {
        const { chapterId, activity, chapterTitle, classNum, subject } = taskObj.ncertRef;
        if (autoSyncNcert) {
          setNcertProgress((prev) => {
            const current = prev[chapterId] || { reading: false, notes: false, revision: false };
            return {
              ...prev,
              [chapterId]: {
                ...current,
                [activity]: true,
                [`${activity}At`]: new Date().toISOString(),
              },
            };
          });
          showToast(`Synced "${chapterTitle}" ${activity} to NCERT Tracker!`);
        } else {
          setLinkedNcertPrompt({
            taskId: taskObj.id,
            taskTitle: taskObj.title,
            chapterId,
            chapterTitle,
            activity,
            className: `Class ${classNum}`,
            subject,
          });
        }
      }
    }
  };

  // Delete task
  const handleDeleteTask = (taskId: string) => {
    setWeeks((prevWeeks) =>
      updateTaskInWeeks(prevWeeks, taskId, () => null)
    );
    showToast('Task removed from weekly plan');
  };

  // Edit task modal trigger
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Save task (create or edit)
  const handleSaveTask = (taskData: {
    title: string;
    category: string;
    priority: Priority;
    notes?: string;
    scheduledDate?: string;
    isRecurring?: boolean;
  }) => {
    if (editingTask) {
      setWeeks((prevWeeks) =>
        updateTaskInWeeks(prevWeeks, editingTask.id, (task) => ({ ...task, ...taskData }))
      );
      setEditingTask(null);
      showToast('Task updated successfully');
    } else {
      const newTask: Task = {
        id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title: taskData.title,
        category: taskData.category,
        priority: taskData.priority,
        completed: false,
        isRecurring: taskData.isRecurring,
        createdAt: new Date().toISOString(),
        notes: taskData.notes,
        scheduledDate: taskData.scheduledDate || taskModalInitialDate || activeWeek.sundayDate,
      };

      setWeeks((prevWeeks) =>
        prevWeeks.map((week) =>
          week.id === activeWeek.id ? { ...week, tasks: [newTask, ...week.tasks] } : week
        )
      );
      showToast(
        taskData.isRecurring
          ? 'New weekly recurring task created (will repeat automatically)'
          : 'New weekly task created'
      );
    }
    setTaskModalInitialDate(undefined);
  };

  // Quick add task
  const handleQuickAddTask = (title: string, category: string, priority: Priority) => {
    const newTask: Task = {
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      title,
      category,
      priority,
      completed: false,
      createdAt: new Date().toISOString(),
      scheduledDate: activeWeek.sundayDate,
    };

    setWeeks((prevWeeks) =>
      prevWeeks.map((week) =>
        week.id === activeWeek.id ? { ...week, tasks: [newTask, ...week.tasks] } : week
      )
    );
    showToast('Task added to active week');
  };

  // Reschedule task
  const handleRescheduleTask = (taskId: string, newDate: string) => {
    setWeeks((prevWeeks) =>
      updateTaskInWeeks(prevWeeks, taskId, (task) => ({ ...task, scheduledDate: newDate }))
    );
    showToast(`Task rescheduled to ${newDate}`);
  };

  // Create new weekly plan with automatic recurring tasks and carry-over
  const handleCreateNewWeek = (newWeekData: {
    sundayDate: string;
    focusGoal: string;
    carryOverTasks: boolean;
    selectedTaskIds: string[];
    includeRecurringTasks: boolean;
  }) => {
    const initialTasks: Task[] = [];
    const selectedTaskIds = new Set(newWeekData.selectedTaskIds);

    // 1. Roll over incomplete one-off tasks from previous active week
    if (newWeekData.carryOverTasks && activeWeek) {
      const carried = activeWeek.tasks
        .filter(
          (t) =>
            !t.completed &&
            !t.isRecurring &&
            (selectedTaskIds.size === 0 || selectedTaskIds.has(t.id))
        )
        .map((t) => ({
          ...t,
          id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          completed: false,
          carriedOverFrom: activeWeek.id,
          createdAt: new Date().toISOString(),
          scheduledDate: newWeekData.sundayDate,
        }));
      initialTasks.push(...carried);
    }

    // 2. Automatically propagate weekly recurring routines (e.g. English 100 vocab + 50 idioms)
    if (newWeekData.includeRecurringTasks) {
      const recurringMap = new Map<string, Task>();
      const initialTitles = new Set(initialTasks.map((task) => task.title.trim().toLowerCase()));

      // Collect recurring tasks from active week and across all weeks
      weeks.forEach((w) => {
        w.tasks.forEach((t) => {
          if (t.isRecurring) {
            const key = t.title.trim().toLowerCase();
            if (!recurringMap.has(key)) {
              recurringMap.set(key, t);
            }
          }
        });
      });

      recurringMap.forEach((rec) => {
        // Only add if not already in initialTasks
        const titleKey = rec.title.trim().toLowerCase();
        if (!initialTitles.has(titleKey)) {
          initialTitles.add(titleKey);
          initialTasks.push({
            id: `rec-task-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
            title: rec.title,
            category: rec.category,
            priority: rec.priority,
            completed: false,
            isRecurring: true,
            notes: rec.notes,
            ncertRef: rec.ncertRef,
            createdAt: new Date().toISOString(),
            scheduledDate: newWeekData.sundayDate,
          });
        }
      });
    }

    const newWeek: WeekPlan = {
      id: newWeekData.sundayDate,
      sundayDate: newWeekData.sundayDate,
      title: formatWeekTitle(newWeekData.sundayDate),
      focusGoal: newWeekData.focusGoal || undefined,
      tasks: initialTasks,
      createdAt: new Date().toISOString(),
    };

    setWeeks((prev) => [newWeek, ...prev]);
    setActiveWeekId(newWeek.id);
    setMainTab('weekly_planning');
    setIsNewWeekModalOpen(false);
    showToast(`New week "${newWeek.title}" created with ${initialTasks.length} tasks!`);
  };

  // Transfer remaining incomplete tasks from a given week to the next chronological week
  const handleTransferRemainingTasksToNextWeek = (sourceWeekId: string) => {
    const sourceWeek = weeks.find((w) => w.id === sourceWeekId);
    if (!sourceWeek) return;

    // Remaining incomplete tasks
    const remainingTasks = sourceWeek.tasks.filter((t) => !t.completed);
    if (remainingTasks.length === 0) {
      showToast('All tasks in this week are already completed! Nothing to transfer.');
      return;
    }

    // Sort weeks chronologically
    const sortedWeeks = [...weeks].sort((a, b) => a.sundayDate.localeCompare(b.sundayDate));
    const currentIndex = sortedWeeks.findIndex((w) => w.id === sourceWeekId);

    let targetWeek: WeekPlan | null = null;
    let isBrandNewWeek = false;

    if (currentIndex >= 0 && currentIndex < sortedWeeks.length - 1) {
      // An existing next week exists
      targetWeek = sortedWeeks[currentIndex + 1];
    } else {
      // Need to generate the next consecutive week
      const nextSundayDate = toDateKey(getNextSunday(parseDateKey(sourceWeek.sundayDate)));
      targetWeek = {
        id: nextSundayDate,
        sundayDate: nextSundayDate,
        title: formatWeekTitle(nextSundayDate),
        tasks: [],
        createdAt: new Date().toISOString(),
      };
      isBrandNewWeek = true;
    }

    // Clone remaining tasks for target week, preventing duplicates
    const existingTitles = new Set(targetWeek.tasks.map((t) => t.title.trim().toLowerCase()));
    const tasksToAdd: Task[] = [];

    remainingTasks.forEach((t) => {
      const titleKey = t.title.trim().toLowerCase();
      if (!existingTitles.has(titleKey)) {
        tasksToAdd.push({
          ...t,
          id: `transferred-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          completed: false,
          carriedOverFrom: sourceWeek.id,
          createdAt: new Date().toISOString(),
          scheduledDate: targetWeek!.sundayDate,
        });
        existingTitles.add(titleKey);
      }
    });

    if (tasksToAdd.length === 0 && !isBrandNewWeek) {
      showToast('All remaining tasks are already present in the next week.');
      setActiveWeekId(targetWeek.id);
      return;
    }

    if (isBrandNewWeek) {
      const newWeekWithTasks: WeekPlan = {
        ...targetWeek,
        tasks: tasksToAdd,
      };
      setWeeks((prev) => [newWeekWithTasks, ...prev]);
      setActiveWeekId(newWeekWithTasks.id);
      showToast(`Created ${newWeekWithTasks.title} with ${tasksToAdd.length} transferred task${tasksToAdd.length > 1 ? 's' : ''}!`);
    } else {
      const updatedTargetId = targetWeek.id;
      setWeeks((prev) =>
        prev.map((w) =>
          w.id === updatedTargetId
            ? { ...w, tasks: [...w.tasks, ...tasksToAdd] }
            : w
        )
      );
      setActiveWeekId(updatedTargetId);
      showToast(`Transferred ${tasksToAdd.length} task${tasksToAdd.length > 1 ? 's' : ''} to ${targetWeek.title}!`);
    }
  };

  // Add NCERT Chapter directly to Weekly Plan
  const handleConfirmNcertToWeekly = (data: {
    title: string;
    category: string;
    priority: Priority;
    notes?: string;
    scheduledDate?: string;
    startTime?: string;
    estimatedMinutes?: number;
    ncertRef: {
      classNum: number;
      subject: string;
      bookTitle: string;
      bookId?: string;
      chapterId: string;
      chapterTitle: string;
      activity: 'reading' | 'notes' | 'revision';
    };
  }) => {
    const newTask: Task = {
      id: `ncert-task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: data.title,
      category: data.category,
      priority: data.priority,
      completed: false,
      createdAt: new Date().toISOString(),
      scheduledDate: data.scheduledDate || activeWeek.sundayDate,
      notes: data.notes,
      ncertRef: data.ncertRef,
    };

    setWeeks((prevWeeks) =>
      prevWeeks.map((w) => (w.id === activeWeek.id ? { ...w, tasks: [newTask, ...w.tasks] } : w))
    );
    showToast(`Added ${data.title} to weekly tasks!`);
    setIsNcertAddToWeeklyOpen(false);
  };

  // Full backup restore
  const handleRestoreFullBackup = (input: FullBackupData, mode: 'replace' | 'merge') => {
    const incoming = validateBackup(input);
    incoming.ncertProgress = migrateNcertProgressStore(incoming.ncertProgress);
    const backup = mode === 'merge' ? mergeBackups({ weeks, activeWeekId, programs, ncertProgress, ncertNotes, studySessions: loadStudySessions() }, incoming) : incoming;
    const values: Record<string, unknown> = { [STORAGE_KEY]: backup.weeks, [PROGRAMS_STORAGE_KEY]: backup.programs, [NCERT_STORAGE_KEY]: backup.ncertProgress };
    if (backup.ncertNotes) values[NCERT_NOTES_STORAGE_KEY] = backup.ncertNotes;
    if (backup.studySessions) values[STUDY_SESSIONS_STORAGE_KEY] = backup.studySessions;
    if (backup.goals) values[STUDY_GOALS_STORAGE_KEY] = backup.goals;
    if (backup.dailyCapacity) values[DAILY_CAPACITY_STORAGE_KEY] = backup.dailyCapacity;
    if (backup.calendarConfig) values[GOOGLE_CALENDAR_STORAGE_KEY] = backup.calendarConfig;
    if (backup.revisionSchedule) values[REVISION_SCHEDULE_STORAGE_KEY] = backup.revisionSchedule;
    if (backup.reminderPreferences) values[REMINDER_PREFS_STORAGE_KEY] = backup.reminderPreferences;
    restoreStored(values);
    allowStorageReplacement([...WEEK_KEYS, ...PROGRAM_KEYS, ...NCERT_KEYS, ...(backup.ncertNotes ? ['ncertChapterNotes'] : [])]);
    setWeeks(backup.weeks);
    setActiveWeekId(backup.activeWeekId);
    setPrograms(backup.programs);
    setSelectedProgramId(backup.programs[0].id);
    setNcertProgress(backup.ncertProgress);
    if (backup.ncertNotes) setNcertNotes(backup.ncertNotes);
    if (backup.revisionSchedule) setRevisionSchedule(backup.revisionSchedule);
    if (backup.reminderPreferences) setReminderPreferences(backup.reminderPreferences);
    if (backup.preferences?.isDarkMode !== undefined) setIsDarkMode(backup.preferences.isDarkMode);
    if (backup.preferences?.autoSyncNcert !== undefined) setAutoSyncNcert(backup.preferences.autoSyncNcert);
    setDataRevision(value => value + 1);
  };
  const resetPlannerData = (section: 'weekly' | 'ncert' | 'study' | 'entire') => {
    if (section === 'entire') {
      handleRestoreFullBackup({ weeks: [getSundaySep27Week()], activeWeekId: '2026-09-27', programs: INITIAL_PROGRAM_TABS, ncertProgress: {}, ncertNotes: {}, studySessions: [], goals: DEFAULT_STUDY_GOALS, dailyCapacity: DEFAULT_DAILY_CAPACITY, calendarConfig: DEFAULT_GOOGLE_CALENDAR_CONFIG, revisionSchedule: DEFAULT_REVISION_SCHEDULE, reminderPreferences: DEFAULT_REMINDER_PREFERENCES, preferences: { isDarkMode, autoSyncNcert: false } }, 'replace');
      removeStored(ACTIVE_SESSION_STORAGE_KEY);
      [...WEEK_KEYS.slice(1), ...PROGRAM_KEYS.slice(1), ...NCERT_KEYS.slice(1), 'ncertChapterNotes'].forEach(removeStored);
    } else if (section === 'weekly') {
      const resetWeeks = weeks.map(week => ({ ...week, tasks: week.tasks.map(task => ({ ...task, completed: false, completedAt: undefined })) }));
      restoreStored({ [STORAGE_KEY]: resetWeeks });
      allowStorageReplacement(WEEK_KEYS);
      WEEK_KEYS.slice(1).forEach(removeStored);
      setWeeks(resetWeeks);
    } else if (section === 'ncert') {
      restoreStored({ [NCERT_STORAGE_KEY]: {} });
      allowStorageReplacement(NCERT_KEYS);
      NCERT_KEYS.slice(1).forEach(removeStored);
      setNcertProgress({});
    } else {
      restoreStored({ [STUDY_SESSIONS_STORAGE_KEY]: [] });
      setDataRevision(value => value + 1);
    }
  };

  // Navigation Destination Selector
  const handleSelectDestination = (dest: NavDestination) => {
    if (dest === 'weekly_planning') {
      setMainTab('weekly_planning');
    } else if (dest === 'calendar') {
      setMainTab('calendar');
    } else if (dest === 'academic_tracks') {
      setMainTab('academic_tracks');
      setAcademicSubView('track');
    } else if (dest === 'ncert') {
      setMainTab('ncert');
    } else if (dest === 'analytics') {
      setMainTab('progress');
      setProgressSubView('analytics');
    } else if (dest === 'velocity') {
      setMainTab('progress');
      setProgressSubView('velocity');
    } else if (dest === 'audit') {
      setMainTab('progress');
      setProgressSubView('audit');
    }
  };

  // Determine current active section for navbar highlight
  const currentNavSection: NavDestination = useMemo(() => {
    if (mainTab === 'weekly_planning') return 'weekly_planning';
    if (mainTab === 'calendar') return 'calendar';
    if (mainTab === 'academic_tracks') return 'academic_tracks';
    if (mainTab === 'ncert') return 'ncert';
    if (mainTab === 'progress') {
      if (progressSubView === 'velocity') return 'velocity';
      if (progressSubView === 'audit') return 'audit';
      return 'analytics';
    }
    return 'weekly_planning';
  }, [mainTab, progressSubView]);

  const viewName = mainTab === 'academic_tracks' && academicSubView === 'audit' ? 'Academic Audit' : {
    weekly_planning: 'Weekly Planning', calendar: 'Study Calendar', academic_tracks: 'Academic Tracks',
    ncert: 'NCERT Study Tracker', analytics: 'Progress Analytics', velocity: 'Weekly History', audit: 'Academic Audit',
  }[currentNavSection];
  const previousView = useRef(viewName);
  useEffect(() => {
    document.title = `${viewName} | WeeklyPlan`;
    if (previousView.current !== viewName) document.getElementById('main-content')?.focus({ preventScroll: true });
    previousView.current = viewName;
  }, [viewName]);

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to content</a>
      <StorageStatus />
      {/* Toast Notification */}
      {toastMessage && (
        <div className="app-toast" role="status" aria-live="polite">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Primary Top Navbar */}
      <Navbar
        currentSection={currentNavSection}
        onSelectDestination={handleSelectDestination}
        pendingTasksCount={pendingTasksCount}
        dueRevisionsCount={dueRevisionsCount}
        ncertPercent={ncertStats.percent}
        onOpenAddTask={() => {
          setEditingTask(null);
          setTaskModalInitialDate(undefined);
          setIsTaskModalOpen(true);
        }}
        onOpenNotebookModal={() => setIsNotebookModalOpen(true)}
        onOpenUploadScanModal={() => setIsUploadScanModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenRemindersCenter={() => setIsRemindersCenterOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Area */}
      <main id="main-content" tabIndex={-1} aria-label={viewName} className="app-main space-y-6">
        <Suspense key={dataRevision} fallback={<div role="status" className="p-6 text-center text-slate-500 dark:text-slate-400">Loading view…</div>}>
        {/* ======================================================== */}
        {/* TAB 1: WEEKLY PLANNING VIEW (Primary Dashboard)         */}
        {/* ======================================================== */}
        {mainTab === 'weekly_planning' && (
          <CurrentWeekView
            week={activeWeek}
            allWeeks={weeks}
            programs={programs}
            onOpenProgram={id => { setSelectedProgramId(id); setMainTab('academic_tracks'); setAcademicSubView('track'); }}
            onViewHistory={() => { setMainTab('progress'); setProgressSubView('velocity'); }}
            onSelectWeekId={setActiveWeekId}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onEditTask={handleEditTask}
            onOpenAddTaskModal={() => {
              setEditingTask(null);
              setTaskModalInitialDate(undefined);
              setIsTaskModalOpen(true);
            }}
            onQuickAddTask={handleQuickAddTask}
            onOpenNewWeekModal={() => setIsNewWeekModalOpen(true)}
            onOpenNotebookModal={() => setIsNotebookModalOpen(true)}
            onTriggerConfetti={triggerConfetti}
            onTransferRemainingToNextWeek={handleTransferRemainingTasksToNextWeek}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 2: STUDY CALENDAR VIEW (Weekly Blocks & Completed)   */}
        {/* ======================================================== */}
        {mainTab === 'calendar' && (
          <CalendarView
            allTasks={allTasks}
            onToggleTask={handleToggleTask}
            onEditTask={handleEditTask}
            onOpenAddTaskModal={(date) => {
              setEditingTask(null);
              setTaskModalInitialDate(date);
              setIsTaskModalOpen(true);
            }}
            onRescheduleTask={handleRescheduleTask}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 3: ACADEMIC TRACKS VIEW                             */}
        {/* ======================================================== */}
        {mainTab === 'academic_tracks' && (
          <div className="space-y-6">
            <PageHeader eyebrow="Your study tracks" title="Academic Tracks"
              description="Follow each chapter from reading and deep study to revision."
              actions={<>
                <select className="field w-auto max-w-full" aria-label="Select academic track" value={currentSelectedProgram.id} onChange={event => setSelectedProgramId(event.target.value)}>
                  {programs.map(program => <option key={program.id} value={program.id}>{program.title}</option>)}
                </select>
                <button type="button" className="button button-primary" onClick={() => setIsAddProgramModalOpen(true)}><Plus size={16} />Add Track</button>
              </>} />
            <div className="w-fit max-w-full"><SegmentedControl label="Academic view" value={academicSubView} onChange={setAcademicSubView}
              options={[{ value: 'track', label: 'Curriculum View' }, { value: 'audit', label: 'Audit Report' }]} /></div>

            {academicSubView === 'track' ? (
              <ProgramTrackView
                program={currentSelectedProgram}
                onUpdateProgram={(updatedProg) => {
                  setPrograms((prev) =>
                    prev.map((p) => (p.id === updatedProg.id ? updatedProg : p))
                  );
                }}
                onSendTaskToWeeklyPlan={(title, category, notes) => {
                  const newTask: Task = {
                    id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                    title,
                    category,
                    priority: 'Medium',
                    completed: false,
                    createdAt: new Date().toISOString(),
                    scheduledDate: activeWeek.sundayDate,
                    notes,
                  };
                  setWeeks((prev) =>
                    prev.map((w) =>
                      w.id === activeWeek.id ? { ...w, tasks: [newTask, ...w.tasks] } : w
                    )
                  );
                  showToast(`Added "${title}" to weekly plan!`);
                }}
                onTriggerConfetti={triggerConfetti}
                onFinishTaskAlert={(title) => {
                  showToast(`Target cleared: ${title}!`);
                }}
              />
            ) : (
              <DashboardReportView
                headingLevel={2}
                weeks={weeks}
                programs={programs}
                onSelectTab={(progId) => {
                  setSelectedProgramId(progId);
                  setAcademicSubView('track');
                }}
                ncertPercent={ncertStats.percent}
              />
            )}
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 4: NCERT SOCIAL SCIENCE VIEW                         */}
        {/* ======================================================== */}
        {mainTab === 'ncert' && (
          <NcertSocialScienceView
            progressStore={ncertProgress}
            notesStore={ncertNotes}
            onToggleActivity={(chapterId, activity) => {
              setNcertProgress((prev) => {
                const cur = prev[chapterId] || { reading: false, notes: false, revision: false };
                const willBe = !cur[activity];
                return {
                  ...prev,
                  [chapterId]: {
                    ...cur,
                    [activity]: willBe,
                    [`${activity}At`]: willBe ? new Date().toISOString() : undefined,
                  },
                };
              });
            }}
            onResetProgress={() => {
              setNcertProgress({});
              showToast('NCERT progress reset');
            }}
            onImportProgress={(importedStore) => {
              const validated = migrateNcertProgressStore(importedStore);
              restoreStored({ [NCERT_STORAGE_KEY]: validated });
              allowStorageReplacement(NCERT_KEYS);
              setNcertProgress(validated);
              showToast('NCERT progress imported successfully');
            }}
            onSaveChapterNotes={(chapterId, data) => {
              setNcertNotes((prev) => ({ ...prev, [chapterId]: data }));
              showToast('Chapter notes saved');
            }}
            activeWeekTitle={activeWeek.title}
            onAddWeeklyTask={(taskData) => {
              const newTask: Task = {
                id: `ncert-task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                title: taskData.title,
                category: taskData.category,
                priority: taskData.priority,
                completed: false,
                createdAt: new Date().toISOString(),
                scheduledDate: taskData.scheduledDate || activeWeek.sundayDate,
                notes: taskData.notes,
                ncertRef: taskData.ncertRef,
              };
              setWeeks((prev) =>
                prev.map((w) =>
                  w.id === activeWeek.id ? { ...w, tasks: [newTask, ...w.tasks] } : w
                )
              );
              showToast(`Added ${taskData.title} to weekly tasks!`);
            }}
          />
        )}

        {/* ======================================================== */}
        {/* TAB 5: PROGRESS & ANALYTICS VIEW                         */}
        {/* ======================================================== */}
        {mainTab === 'progress' && (
          <div className="space-y-6">
            <div className="w-fit max-w-full"><SegmentedControl label="Progress view" value={progressSubView} onChange={setProgressSubView}
              options={[{ value: 'analytics', label: 'Analytics & Velocity' }, { value: 'velocity', label: 'Multi-Week History' }, { value: 'audit', label: 'Audit Report' }]} /></div>

            {progressSubView === 'analytics' && (
              <AdvancedAnalyticsView
                weeks={weeks}
                ncertProgress={ncertProgress}
              />
            )}

            {progressSubView === 'velocity' && (
              <ProgressBoard
                weeks={weeks}
                isDarkMode={isDarkMode}
                onSelectWeekToView={(weekId) => {
                  setActiveWeekId(weekId);
                  setMainTab('weekly_planning');
                }}
                onCarryOverFromWeek={(sourceWeekId) => {
                  const source = weeks.find((w) => w.id === sourceWeekId);
                  if (source) {
                    const incomplete = source.tasks.filter((t) => !t.completed);
                    const newTasks = incomplete.map((t) => ({
                      ...t,
                      id: `carried-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                      completed: false,
                      carriedOverFrom: sourceWeekId,
                      createdAt: new Date().toISOString(),
                      scheduledDate: activeWeek.sundayDate,
                    }));
                    setWeeks((prev) =>
                      prev.map((w) =>
                        w.id === activeWeek.id ? { ...w, tasks: [...newTasks, ...w.tasks] } : w
                      )
                    );
                    showToast(`Carried over ${newTasks.length} tasks to ${activeWeek.title}!`);
                  }
                }}
                hasPastDemoWeeks={weeks.length > 1}
              />
            )}

            {progressSubView === 'audit' && (
              <DashboardReportView
                weeks={weeks}
                programs={programs}
                onSelectTab={(progId) => {
                  setSelectedProgramId(progId);
                  setMainTab('academic_tracks');
                  setAcademicSubView('track');
                }}
                ncertPercent={ncertStats.percent}
              />
            )}
          </div>
        )}
        </Suspense>
      </main>
      <WorkspaceFooter onOpenBackup={() => setIsBackupModalOpen(true)} />

      {/* ======================================================== */}
      {/* GLOBAL MODALS                                            */}
      {/* ======================================================== */}

      <Suspense fallback={<div role="status" className="fixed inset-0 z-50 grid place-items-center bg-black/50 text-white">Loading dialog…</div>}>
      {/* New Week Modal */}
      {isNewWeekModalOpen && (
      <NewWeekModal
        isOpen={isNewWeekModalOpen}
        onClose={() => setIsNewWeekModalOpen(false)}
        weeks={weeks}
        onCreateWeek={handleCreateNewWeek}
      />
      )}

      {/* Task Modal (Create & Edit) */}
      {isTaskModalOpen && (
      <TaskModal
        isOpen={isTaskModalOpen}
        onClose={() => {
          setIsTaskModalOpen(false);
          setEditingTask(null);
          setTaskModalInitialDate(undefined);
        }}
        onSave={handleSaveTask}
        initialTask={editingTask}
        existingCategories={existingCategories}
      />
      )}

      {/* Notebook Reference Modal */}
      {isNotebookModalOpen && (
      <NotebookReferenceModal
        isOpen={isNotebookModalOpen}
        onClose={() => setIsNotebookModalOpen(false)}
        activeWeekTitle={activeWeek.title}
        onImportTasks={(importedTasks) => {
          setWeeks((prev) =>
            prev.map((w) =>
              w.id === activeWeek.id
                ? {
                    ...w,
                    tasks: [
                      ...w.tasks,
                      ...importedTasks.map((t, idx) => ({
                        id: `imported-${Date.now()}-${idx}`,
                        title: t.title,
                        category: t.category,
                        priority: t.priority as Priority,
                        completed: false,
                        createdAt: new Date().toISOString(),
                        notes: t.notes,
                        scheduledDate: activeWeek.sundayDate,
                      })),
                    ],
                  }
                : w
            )
          );
          setIsNotebookModalOpen(false);
          showToast('Imported handwritten notebook tasks into active week!');
        }}
      />
      )}

      {/* Upload Handwritten Plan Modal */}
      {isUploadScanModalOpen && (
      <UploadHandwrittenPlanModal
        isOpen={isUploadScanModalOpen}
        onClose={() => setIsUploadScanModalOpen(false)}
        currentWeekTitle={activeWeek.title}
        onImportToCurrentWeek={(importedTasks) => {
          setWeeks((prev) =>
            prev.map((w) =>
              w.id === activeWeek.id
                ? {
                    ...w,
                    tasks: [
                      ...w.tasks,
                      ...importedTasks.map((t, idx) => ({
                        id: `scan-${Date.now()}-${idx}`,
                        title: t.title,
                        category: t.category || 'Study',
                        priority: (t.priority as Priority) || 'Medium',
                        completed: false,
                        createdAt: new Date().toISOString(),
                        notes: t.notes,
                        scheduledDate: activeWeek.sundayDate,
                      })),
                    ],
                  }
                : w
            )
          );
          setIsUploadScanModalOpen(false);
          showToast('Tasks imported from scanned handwritten plan!');
        }}
        onCreateNewWeekWithTasks={(weekData) => {
          const newWeek: WeekPlan = {
            id: weekData.sundayDate,
            sundayDate: weekData.sundayDate,
            title: formatWeekTitle(weekData.sundayDate),
            focusGoal: weekData.focusGoal,
            tasks: weekData.tasks.map((t, idx) => ({
              id: `scan-week-${Date.now()}-${idx}`,
              title: t.title,
              category: t.category || 'Study',
              priority: (t.priority as Priority) || 'Medium',
              completed: false,
              createdAt: new Date().toISOString(),
              notes: t.notes,
              scheduledDate: weekData.sundayDate,
            })),
            createdAt: new Date().toISOString(),
          };
          setWeeks((prev) => [newWeek, ...prev]);
          setActiveWeekId(newWeek.id);
          setIsUploadScanModalOpen(false);
          showToast(`Created week "${newWeek.title}" from scanned plan!`);
        }}
      />
      )}

      {/* Add Program Track Modal */}
      {isAddProgramModalOpen && (
      <AddProgramModal
        isOpen={isAddProgramModalOpen}
        onClose={() => setIsAddProgramModalOpen(false)}
        onAddProgram={(newProg) => {
          setPrograms((prev) => [...prev, newProg]);
          setSelectedProgramId(newProg.id);
          setMainTab('academic_tracks');
          showToast(`Academic track "${newProg.title}" created!`);
        }}
      />
      )}

      {/* NCERT Add to Weekly Plan Modal */}
      {ncertAddToWeeklyChapter && (
        <NcertAddToWeeklyPlanModal
          isOpen={isNcertAddToWeeklyOpen}
          onClose={() => {
            setIsNcertAddToWeeklyOpen(false);
            setNcertAddToWeeklyChapter(null);
          }}
          chapter={ncertAddToWeeklyChapter}
          initialActivity={ncertAddToWeeklyPrefill}
          activeWeekTitle={activeWeek.title}
          activeWeekTasks={activeWeek.tasks}
          onConfirmAdd={handleConfirmNcertToWeekly}
        />
      )}

      {/* Standalone Export Modal */}
      {isExportModalOpen && (
      <StandaloneExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />
      )}

      {/* Unified Backup & Restore Modal */}
      {isBackupModalOpen && (
      <UnifiedBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentData={{
          weeks,
          activeWeekId,
          programs,
          ncertProgress,
          ncertNotes,
          studySessions: loadStudySessions(),
          goals: loadStudyGoals(),
          dailyCapacity: loadDailyCapacity(),
          revisionSchedule,
          reminderPreferences,
          calendarConfig: loadGoogleCalendarConfig(),
          preferences: { isDarkMode, autoSyncNcert },
        }}
        onImportFullBackup={handleRestoreFullBackup}
        onResetWeeklyTasks={() => {
          resetPlannerData('weekly');
          showToast('Weekly tasks reset to default week');
        }}
        onResetNcertProgress={() => {
          resetPlannerData('ncert');
          showToast('NCERT progress reset');
        }}
        onResetStudyHistory={() => {
          resetPlannerData('study');
          showToast('History cleared');
        }}
        onResetEntirePlanner={() => {
          resetPlannerData('entire');
          showToast('Entire planner reset');
        }}
        onShowToast={showToast}
      />
      )}

      {/* Revision Reminder Center Modal */}
      {isRemindersCenterOpen && (
      <RevisionReminderCenterModal
        isOpen={isRemindersCenterOpen}
        onClose={() => setIsRemindersCenterOpen(false)}
        dueRevisions={dueRevisions}
        schedule={revisionSchedule}
        onSaveSchedule={setRevisionSchedule}
        reminderPrefs={reminderPreferences}
        onSaveReminderPrefs={setReminderPreferences}
        onPlanRevision={(info) => {
          const ch = getAllFlatChapters().find((c) => c.id === info.chapterId);
          if (ch) {
            setNcertAddToWeeklyChapter(ch);
            setNcertAddToWeeklyPrefill('revision');
            setIsNcertAddToWeeklyOpen(true);
            setIsRemindersCenterOpen(false);
          }
        }}
        onPlanAllRevisions={(dueList) => {
          const chapterIds = new Set(getAllFlatChapters().map((chapter) => chapter.id));
          const newTasks = dueList.filter((info) => chapterIds.has(info.chapterId)).map<Task>((info) => ({
                id: `rev-task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
                title: `Revise: ${info.chapterTitle}`,
                category: `NCERT Class ${info.classNum}`,
                priority: 'High',
                completed: false,
                createdAt: new Date().toISOString(),
                scheduledDate: activeWeek.sundayDate,
                ncertRef: {
                  classNum: info.classNum,
                  subject: info.subject,
                  bookTitle: info.bookTitle,
                  chapterId: info.chapterId,
                  chapterTitle: info.chapterTitle,
                  activity: 'revision',
                },
          })).reverse();
          if (newTasks.length) {
            setWeeks((prev) => prev.map((week) => week.id === activeWeek.id
              ? { ...week, tasks: [...newTasks, ...week.tasks] } : week));
          }
          showToast(`Planned ${newTasks.length} revisions into active week!`);
          setIsRemindersCenterOpen(false);
        }}
      />
      )}

      {/* Linked NCERT Sync Prompt */}
      {linkedNcertPrompt && (
        <NcertLinkedCompletionPrompt
          promptData={linkedNcertPrompt}
          onConfirm={(alwaysAutoSync) => {
            if (alwaysAutoSync) setAutoSyncNcert(true);
            const { chapterId, activity } = linkedNcertPrompt;
            setNcertProgress((prev) => {
              const cur = prev[chapterId] || { reading: false, notes: false, revision: false };
              return {
                ...prev,
                [chapterId]: {
                  ...cur,
                  [activity]: true,
                  [`${activity}At`]: new Date().toISOString(),
                },
              };
            });
            showToast(`NCERT chapter ${activity} updated!`);
            setLinkedNcertPrompt(null);
          }}
          onDismiss={() => {
            setLinkedNcertPrompt(null);
          }}
        />
      )}

      {/* Clean Slate Modal */}
      {isCleanSlateModalOpen && (
      <CleanSlateModal
        isOpen={isCleanSlateModalOpen}
        onClose={() => setIsCleanSlateModalOpen(false)}
        onConfirm={() => {
          try {
            downloadRecoveryData();
            resetPlannerData('entire');
            setIsCleanSlateModalOpen(false);
            showToast('Reset to clean initial state');
          } catch { showToast('The reset could not be saved. Existing data is preserved.'); }
        }}
      />
      )}
      </Suspense>
    </div>
  );
}
