import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  WeekPlan,
  Task,
  Priority,
  MainTab,
  ProgramTab,
  SpacedRevisionSchedule,
  ReminderPreferences,
  ChapterRevisionDueInfo,
} from './types';
import { HANDWRITTEN_NOTEBOOK_TASKS, getSundaySep27Week } from './utils/sampleData';
import { INITIAL_PROGRAM_TABS } from './utils/academicProgramsData';
import { formatWeekTitle, getSunday, toDateKey, formatWeekRange, getNextSunday, parseDateKey } from './utils/dateUtils';
import { Navbar } from './components/Navbar';
import { CurrentWeekView } from './components/CurrentWeekView';
import { CalendarView } from './components/CalendarView';
import { ProgressBoard } from './components/ProgressBoard';
import { ProgramTrackView } from './components/ProgramTrackView';
import { NcertSocialScienceView } from './components/NcertSocialScienceView';
import { DashboardReportView } from './components/DashboardReportView';
import { AdvancedAnalyticsView } from './components/AdvancedAnalyticsView';
import { RevisionReminderCenterModal } from './components/RevisionReminderCenterModal';
import { UnifiedBackupModal, FullBackupData } from './components/UnifiedBackupModal';
import { NcertAddToWeeklyPlanModal } from './components/NcertAddToWeeklyPlanModal';
import { CleanSlateModal } from './components/CleanSlateModal';
import { NcertLinkedCompletionPrompt } from './components/NcertLinkedCompletionPrompt';
import { AddProgramModal } from './components/AddProgramModal';
import { NewWeekModal } from './components/NewWeekModal';
import { TaskModal } from './components/TaskModal';
import { NotebookReferenceModal } from './components/NotebookReferenceModal';
import { StandaloneExportModal } from './components/StandaloneExportModal';
import { UploadHandwrittenPlanModal } from './components/UploadHandwrittenPlanModal';
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
  ChapterNoteData,
  TOTAL_NCERT_TASKS,
  ALL_NCERT_CHAPTERS,
  NCERT_STORAGE_KEY,
  getAllFlatChapters,
  NcertFlatChapter,
} from './utils/ncertData';
import { Sparkles, Plus, GraduationCap } from 'lucide-react';
import { NavDestination } from './components/MobileNavDrawer';

const STORAGE_KEY = 'sunday_plan_tracker_storage_v3';
const PROGRAMS_STORAGE_KEY = 'sunday_plan_academic_programs_v3';
const THEME_KEY = 'sunday_plan_theme_v1';

export default function App() {
  // Weekly plans state
  const [weeks, setWeeks] = useState<WeekPlan[]>(() => {
    const saved =
      localStorage.getItem(STORAGE_KEY) ||
      localStorage.getItem('sunday_plan_tracker_storage_v2') ||
      localStorage.getItem('sunday_plan_tracker_storage_v1');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed to parse stored weekly tasks:', err);
      }
    }
    return [getSundaySep27Week()];
  });

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
  const [programs, setPrograms] = useState<ProgramTab[]>(() => {
    const saved =
      localStorage.getItem(PROGRAMS_STORAGE_KEY) ||
      localStorage.getItem('sunday_plan_academic_programs_v2') ||
      localStorage.getItem('sunday_plan_academic_programs_v1') ||
      localStorage.getItem('academicPrograms');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (
          Array.isArray(parsed) &&
          parsed.length >= 5 &&
          parsed.some((p: ProgramTab) => p.id === 'tab-canva')
        ) {
          return parsed;
        }
      } catch (err) {
        console.error('Failed to parse stored programs:', err);
      }
    }
    return INITIAL_PROGRAM_TABS;
  });

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
    const saved = localStorage.getItem(THEME_KEY);
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

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
    return localStorage.getItem('sunday_plan_auto_sync_ncert') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('sunday_plan_auto_sync_ncert', autoSyncNcert ? 'true' : 'false');
  }, [autoSyncNcert]);

  // Sync weeks to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(weeks));
  }, [weeks]);

  // Sync programs to localStorage
  useEffect(() => {
    localStorage.setItem(PROGRAMS_STORAGE_KEY, JSON.stringify(programs));
  }, [programs]);

  // Sync theme to DOM and localStorage
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem(THEME_KEY, 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem(THEME_KEY, 'light');
    }
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
  const triggerConfetti = () => {
    try {
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
    let completedTask: Task | null = null;
    let willBeCompleted = false;

    setWeeks((prevWeeks) =>
      prevWeeks.map((week) => {
        const hasTask = week.tasks.some((t) => t.id === taskId);
        if (!hasTask) return week;

        const updatedTasks = week.tasks.map((task) => {
          if (task.id === taskId) {
            willBeCompleted = !task.completed;
            completedTask = {
              ...task,
              completed: willBeCompleted,
              completedAt: willBeCompleted ? new Date().toISOString() : undefined,
            };
            return completedTask;
          }
          return task;
        });

        return { ...week, tasks: updatedTasks };
      })
    );

    if (willBeCompleted && completedTask) {
      const taskObj: Task = completedTask;
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
      prevWeeks.map((week) => ({
        ...week,
        tasks: week.tasks.filter((t) => t.id !== taskId),
      }))
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
        prevWeeks.map((week) => ({
          ...week,
          tasks: week.tasks.map((t) =>
            t.id === editingTask.id ? { ...t, ...taskData } : t
          ),
        }))
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
      prevWeeks.map((week) => ({
        ...week,
        tasks: week.tasks.map((t) =>
          t.id === taskId ? { ...t, scheduledDate: newDate } : t
        ),
      }))
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

    // 1. Roll over incomplete one-off tasks from previous active week
    if (newWeekData.carryOverTasks && activeWeek) {
      const carried = activeWeek.tasks
        .filter(
          (t) =>
            !t.completed &&
            !t.isRecurring &&
            (newWeekData.selectedTaskIds.length === 0 ||
              newWeekData.selectedTaskIds.includes(t.id))
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
        const alreadyIn = initialTasks.some(
          (it) => it.title.trim().toLowerCase() === rec.title.trim().toLowerCase()
        );

        if (!alreadyIn) {
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
  const handleRestoreFullBackup = (backup: FullBackupData) => {
    if (backup.weeks) setWeeks(backup.weeks);
    if (backup.programs) setPrograms(backup.programs);
    if (backup.ncertProgress) setNcertProgress(backup.ncertProgress);
    if (backup.ncertNotes) setNcertNotes(backup.ncertNotes);
    if (backup.revisionSchedule) setRevisionSchedule(backup.revisionSchedule);
    if (backup.reminderPreferences) setReminderPreferences(backup.reminderPreferences);
    showToast('Full backup restored successfully');
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

  return (
    <div className="min-h-screen bg-[#F1F4F9] dark:bg-[#080C14] bg-ambient-mesh text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors selection:bg-indigo-500 selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className="bg-slate-950/95 dark:bg-slate-900/95 text-white px-4 py-2.5 rounded-xl shadow-xl border border-slate-800 text-xs font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-400" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Primary Top Navbar */}
      <Navbar
        mainTab={mainTab}
        onSelectMainTab={setMainTab}
        currentSection={currentNavSection}
        onSelectDestination={handleSelectDestination}
        programs={programs}
        activeWeekTitle={activeWeek?.title}
        pendingTasksCount={pendingTasksCount}
        dueRevisionsCount={dueRevisionsCount}
        ncertPercent={ncertStats.percent}
        onOpenAddTask={() => {
          setEditingTask(null);
          setTaskModalInitialDate(undefined);
          setIsTaskModalOpen(true);
        }}
        onOpenAddProgramModal={() => setIsAddProgramModalOpen(true)}
        onOpenNewWeekModal={() => setIsNewWeekModalOpen(true)}
        onOpenNotebookModal={() => setIsNotebookModalOpen(true)}
        onOpenUploadScanModal={() => setIsUploadScanModalOpen(true)}
        onOpenExportModal={() => setIsExportModalOpen(true)}
        onOpenCleanSlateModal={() => setIsCleanSlateModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        onOpenRemindersCenter={() => setIsRemindersCenterOpen(true)}
        autoSyncNcert={autoSyncNcert}
        onToggleAutoSyncNcert={() => setAutoSyncNcert(!autoSyncNcert)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => setIsDarkMode(!isDarkMode)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* ======================================================== */}
        {/* TAB 1: WEEKLY PLANNING VIEW (Primary Dashboard)         */}
        {/* ======================================================== */}
        {mainTab === 'weekly_planning' && (
          <CurrentWeekView
            week={activeWeek}
            allWeeks={weeks}
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
            {/* Tracks Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
                  <GraduationCap className="w-4 h-4" />
                  <span>Academic Curriculum & Syllabus Tracker</span>
                </div>
                <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white">
                  Academic Tracks
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
                  Track 3-stage chapter progress (Reading & Notes, Deep Study, Revision) for B.Ed, M.A. History, CTET, UGC NET, and Canva.
                </p>
              </div>

              {/* Sub-navigation & Add Track button */}
              <div className="flex items-center gap-2">
                <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-bold">
                  <button
                    onClick={() => setAcademicSubView('track')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      academicSubView === 'track'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    Curriculum View
                  </button>
                  <button
                    onClick={() => setAcademicSubView('audit')}
                    className={`px-3 py-1.5 rounded-lg transition-all ${
                      academicSubView === 'audit'
                        ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    Audit Report
                  </button>
                </div>

                <button
                  onClick={() => setIsAddProgramModalOpen(true)}
                  className="px-3 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Track</span>
                </button>
              </div>
            </div>

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
                  triggerConfetti();
                }}
              />
            ) : (
              <DashboardReportView
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
              setNcertProgress(importedStore);
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
            {/* View Sub-Tabs */}
            <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 w-fit text-xs font-bold">
              <button
                onClick={() => setProgressSubView('analytics')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  progressSubView === 'analytics'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                Analytics & Velocity
              </button>
              <button
                onClick={() => setProgressSubView('velocity')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  progressSubView === 'velocity'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                Multi-Week History
              </button>
              <button
                onClick={() => setProgressSubView('audit')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  progressSubView === 'audit'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                Audit Report
              </button>
            </div>

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
      </main>

      {/* ======================================================== */}
      {/* GLOBAL MODALS                                            */}
      {/* ======================================================== */}

      {/* New Week Modal */}
      <NewWeekModal
        isOpen={isNewWeekModalOpen}
        onClose={() => setIsNewWeekModalOpen(false)}
        weeks={weeks}
        onCreateWeek={handleCreateNewWeek}
      />

      {/* Task Modal (Create & Edit) */}
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

      {/* Notebook Reference Modal */}
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

      {/* Upload Handwritten Plan Modal */}
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

      {/* Add Program Track Modal */}
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
      <StandaloneExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
      />

      {/* Unified Backup & Restore Modal */}
      <UnifiedBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        currentData={{
          weeks,
          activeWeekId,
          programs,
          ncertProgress,
          ncertNotes,
          studySessions: [],
          goals: loadStudyGoals(),
          dailyCapacity: loadDailyCapacity(),
          revisionSchedule,
          reminderPreferences,
        }}
        onImportFullBackup={handleRestoreFullBackup}
        onResetWeeklyTasks={() => {
          setWeeks([getSundaySep27Week()]);
          showToast('Weekly tasks reset to default week');
        }}
        onResetNcertProgress={() => {
          setNcertProgress({});
          showToast('NCERT progress reset');
        }}
        onResetStudyHistory={() => {
          showToast('History cleared');
        }}
        onResetEntirePlanner={() => {
          setWeeks([getSundaySep27Week()]);
          setPrograms(INITIAL_PROGRAM_TABS);
          setNcertProgress({});
          setNcertNotes({});
          showToast('Entire planner reset');
        }}
        onShowToast={showToast}
      />

      {/* Revision Reminder Center Modal */}
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
          const flatList = getAllFlatChapters();
          dueList.forEach((info) => {
            const ch = flatList.find((c) => c.id === info.chapterId);
            if (ch) {
              const newTask: Task = {
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
              };
              setWeeks((prev) =>
                prev.map((w) =>
                  w.id === activeWeek.id ? { ...w, tasks: [newTask, ...w.tasks] } : w
                )
              );
            }
          });
          showToast(`Planned ${dueList.length} revisions into active week!`);
          setIsRemindersCenterOpen(false);
        }}
      />

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
      <CleanSlateModal
        isOpen={isCleanSlateModalOpen}
        onClose={() => setIsCleanSlateModalOpen(false)}
        onConfirm={() => {
          localStorage.removeItem(STORAGE_KEY);
          localStorage.removeItem(PROGRAMS_STORAGE_KEY);
          localStorage.removeItem(NCERT_STORAGE_KEY);
          setWeeks([getSundaySep27Week()]);
          setActiveWeekId('2026-09-27');
          setPrograms(INITIAL_PROGRAM_TABS);
          setNcertProgress({});
          setNcertNotes({});
          setIsCleanSlateModalOpen(false);
          showToast('Reset to clean initial state');
        }}
      />
    </div>
  );
}
