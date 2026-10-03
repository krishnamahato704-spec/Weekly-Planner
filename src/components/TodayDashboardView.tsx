import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  Plus,
  ArrowRight,
  RotateCcw,
  Sparkles,
  BookOpen,
  Check,
  ChevronRight,
  Flame,
  Target,
} from 'lucide-react';
import { Task, Priority, StudyGoals, ChapterRevisionDueInfo, ActiveStudySession } from '../types';
import { NextTaskRecommendation } from '../utils/nextTasksEngine';
import {
  getGreeting,
  getTodayDateString,
  formatFriendlyDate,
  formatDurationFriendly,
  formatMinutesFriendly,
} from '../utils/studySessionUtils';

interface TodayDashboardViewProps {
  todayTasks: Task[];
  overdueTasks: Task[];
  dueRevisions: ChapterRevisionDueInfo[];
  nextRecommendations: NextTaskRecommendation[];
  activeStudySession: ActiveStudySession | null;
  studyGoals: StudyGoals;
  actualSecondsToday: number;
  todaySessionCount: number;
  weeklyActualSeconds: number;
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onStartStudySession: (task: Task) => void;
  onStartFromRecommendation: (rec: NextTaskRecommendation) => void;
  onPlanRecommendation: (rec: NextTaskRecommendation) => void;
  onMoveToToday: (taskId: string) => void;
  onRescheduleTask: (task: Task) => void;
  onOpenAddTaskModal: () => void;
  onOpenManualSessionModal: () => void;
  onOpenRemindersCenter: () => void;
}

export const TodayDashboardView: React.FC<TodayDashboardViewProps> = ({
  todayTasks,
  overdueTasks,
  dueRevisions,
  nextRecommendations,
  activeStudySession,
  studyGoals,
  actualSecondsToday,
  todaySessionCount,
  weeklyActualSeconds,
  onToggleTask,
  onEditTask,
  onStartStudySession,
  onStartFromRecommendation,
  onPlanRecommendation,
  onMoveToToday,
  onRescheduleTask,
  onOpenAddTaskModal,
  onOpenManualSessionModal,
  onOpenRemindersCenter,
}) => {
  const greeting = getGreeting();
  const todayStr = getTodayDateString();
  const formattedToday = formatFriendlyDate(todayStr);

  const [showAllRecommendations, setShowAllRecommendations] = useState(false);

  // Today metrics
  const totalTodayTasks = todayTasks.length;
  const completedTodayTasks = todayTasks.filter((t) => t.completed).length;
  const remainingTodayTasks = totalTodayTasks - completedTodayTasks;
  const completionPercent = totalTodayTasks > 0 ? Math.round((completedTodayTasks / totalTodayTasks) * 100) : 0;

  // Planned study time
  let totalPlannedMinutes = 0;
  let untimedCount = 0;
  todayTasks.forEach((t) => {
    if (t.estimatedMinutes) {
      totalPlannedMinutes += t.estimatedMinutes;
    } else {
      untimedCount += 1;
    }
  });

  // Sort today tasks: 1) timed tasks chronologically, 2) untimed tasks, 3) completed tasks last
  const sortedTodayTasks = [...todayTasks].sort((a, b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    if (a.startTime && b.startTime) return a.startTime.localeCompare(b.startTime);
    if (a.startTime && !b.startTime) return -1;
    if (!a.startTime && b.startTime) return 1;
    return 0;
  });

  // Weekly Goal progress
  const weeklyGoalSeconds = studyGoals.weeklyStudyMinutesGoal * 60;
  const weeklyGoalPercent = weeklyGoalSeconds > 0
    ? Math.min(100, Math.round((weeklyActualSeconds / weeklyGoalSeconds) * 100))
    : 0;

  // Recommendations slice
  const displayedRecommendations = showAllRecommendations
    ? nextRecommendations
    : nextRecommendations.slice(0, 4);

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-300">
      {/* ======================================================== */}
      {/* 1. TODAY HEADER & DAILY SUMMARY                          */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              {greeting}
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white mt-0.5">
              {formattedToday}
            </h1>
            {/* Compact Daily Overview */}
            <div className="flex items-center gap-2 sm:gap-3 text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 flex-wrap">
              <span className="font-semibold text-slate-900 dark:text-white">
                {totalTodayTasks} {totalTodayTasks === 1 ? 'task' : 'tasks'}
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
              <span>
                {formatMinutesFriendly(totalPlannedMinutes)} planned
                {untimedCount > 0 && ` (+${untimedCount} untimed)`}
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {completedTodayTasks} completed
              </span>
              <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
              <span>{remainingTodayTasks} remaining</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={onOpenManualSessionModal}
              className="px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors min-h-[44px]"
            >
              + Log Time
            </button>
            <button
              type="button"
              onClick={onOpenAddTaskModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors min-h-[44px]"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Compact Daily Progress & Study Time Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          {/* Box 1: Today Completion Gauge */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span>Today's Completion</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {completedTodayTasks} / {totalTodayTasks} ({completionPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-indigo-600 rounded-full transition-all duration-300"
                style={{ width: `${completionPercent}%` }}
              />
            </div>
          </div>

          {/* Box 2: Actual Study Time Today (P2.4) */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                <span>Study Time Today</span>
              </span>
              <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                {formatDurationFriendly(actualSecondsToday)}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400">
              {todaySessionCount} {todaySessionCount === 1 ? 'focus session' : 'focus sessions'} logged today
            </div>
          </div>

          {/* Box 3: Weekly Goal Tracking (P3.6) */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60">
            <div className="flex items-center justify-between font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              <span className="flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-emerald-500" />
                <span>Weekly Study Goal</span>
              </span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatDurationFriendly(weeklyActualSeconds)} / {studyGoals.weeklyStudyMinutesGoal / 60}h ({weeklyGoalPercent}%)
              </span>
            </div>
            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${weeklyGoalPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. OVERDUE TASKS BANNER (If any overdue)                 */}
      {/* ======================================================== */}
      {overdueTasks.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h2 className="text-sm font-bold text-rose-950 dark:text-rose-200">
                Overdue Tasks ({overdueTasks.length})
              </h2>
            </div>
            <span className="text-xs text-rose-700 dark:text-rose-300 font-medium">
              Scheduled for earlier dates
            </span>
          </div>

          <div className="space-y-2">
            {overdueTasks.map((task) => (
              <div
                key={task.id}
                className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="font-bold text-slate-900 dark:text-white">
                    {task.title}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {task.category} • Overdue from {task.scheduledDate ? formatFriendlyDate(task.scheduledDate) : 'past'}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => onMoveToToday(task.id)}
                    className="px-2.5 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                  >
                    Move to Today
                  </button>
                  <button
                    type="button"
                    onClick={() => onRescheduleTask(task)}
                    className="px-2.5 py-1 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => onToggleTask(task.id)}
                    className="px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
                  >
                    Complete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. REVISION DUE TODAY (Spaced Revision P3.4 & P3.9)       */}
      {/* ======================================================== */}
      {dueRevisions.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <h2 className="text-sm font-bold text-amber-950 dark:text-amber-200">
                Spaced Revision Due ({dueRevisions.length})
              </h2>
            </div>
            <button
              type="button"
              onClick={onOpenRemindersCenter}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              <span>View All Due</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {dueRevisions.slice(0, 2).map((rev) => (
              <div
                key={rev.chapterId}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 flex flex-col justify-between gap-2.5 text-xs shadow-2xs"
              >
                <div>
                  <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    Class {rev.classNum} • {rev.subject}
                  </div>
                  <div className="font-bold text-sm text-slate-900 dark:text-white leading-snug">
                    {rev.chapterTitle}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                    {rev.status === 'due_today' ? 'Due today for retention' : `Overdue by ${Math.abs(rev.daysRemaining || 1)} days`} • Revision #{rev.revisionCount + 1}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      onPlanRecommendation({
                        id: `rec-ncert-rev-${rev.chapterId}`,
                        source: 'ncert',
                        title: `${rev.chapterTitle} — Revision`,
                        subtitle: `Class ${rev.classNum} • ${rev.subject}`,
                        category: 'NCERT',
                        priority: 'High',
                        estimatedMinutes: 30,
                        reason: 'Revision due today',
                        priorityRank: 6,
                        ncertRef: {
                          classNum: rev.classNum,
                          subject: rev.subject,
                          bookTitle: rev.bookTitle,
                          chapterId: rev.chapterId,
                          chapterTitle: rev.chapterTitle,
                          activity: 'revision',
                        },
                      });
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 rounded-lg transition-colors"
                  >
                    Plan Revision
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. TODAY'S TASK LIST                                     */}
      {/* ======================================================== */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CalendarIcon className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
              Today's Schedule
            </h2>
          </div>
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            {completedTodayTasks} of {totalTodayTasks} completed
          </span>
        </div>

        {sortedTodayTasks.length === 0 ? (
          /* Empty State (P2.1) */
          <div className="p-8 sm:p-12 text-center rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-white/50 dark:bg-slate-900/30 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                You have no tasks planned for today
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                Add a task for today or pick an activity from your recommended next tasks below.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={onOpenAddTaskModal}
                className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors min-h-[44px]"
              >
                + Add Task for Today
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2.5">
            {sortedTodayTasks.map((task) => {
              const isActive = activeStudySession && activeStudySession.taskId === task.id;

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 transition-all ${
                    task.completed
                      ? 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/60 dark:border-slate-800/60 opacity-60'
                      : isActive
                      ? 'bg-indigo-50/40 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-700 ring-2 ring-indigo-500/20 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800 hover:border-indigo-300 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3.5 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 mt-0.5 transition-all ${
                        task.completed
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500'
                      }`}
                      aria-label={task.completed ? 'Mark incomplete' : 'Mark complete'}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    <div className="min-w-0 flex-1">
                      {/* Time, duration & Status tags */}
                      <div className="flex items-center gap-2 flex-wrap text-[11px] font-bold text-indigo-600 dark:text-indigo-400 mb-0.5">
                        {task.startTime && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-indigo-500" />
                            <span>{task.startTime}</span>
                          </span>
                        )}
                        {task.estimatedMinutes && (
                          <span>• {task.estimatedMinutes} min</span>
                        )}
                        {isActive && (
                          <span className="inline-flex items-center gap-1 text-emerald-600 font-bold bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.2 rounded-md animate-pulse">
                            ● In Progress
                          </span>
                        )}
                        {task.ncertRef && (
                          <span className="text-slate-500 dark:text-slate-400">
                            NCERT • Class {task.ncertRef.classNum} • {task.ncertRef.subject}
                          </span>
                        )}
                      </div>

                      <div
                        onClick={() => onEditTask(task)}
                        className={`text-sm sm:text-base font-bold cursor-pointer leading-snug ${
                          task.completed
                            ? 'line-through text-slate-400'
                            : 'text-slate-900 dark:text-white hover:text-indigo-600'
                        }`}
                      >
                        {task.title}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span>{task.category}</span>
                        <span aria-hidden="true">·</span>
                        <span
                          className={`font-semibold ${
                            task.priority === 'High'
                              ? 'text-rose-600 dark:text-rose-400'
                              : task.priority === 'Medium'
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-sky-600 dark:text-sky-400'
                          }`}
                        >
                          {task.priority} Priority
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Start Study Session & Complete */}
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {!task.completed && (
                      <button
                        type="button"
                        onClick={() => onStartStudySession(task)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 shadow-xs min-h-[44px] ${
                          isActive
                            ? 'bg-emerald-600 text-white animate-pulse'
                            : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                        }`}
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>{isActive ? 'Session Active' : 'Start'}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onToggleTask(task.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors min-h-[44px]"
                    >
                      {task.completed ? 'Undo' : 'Complete'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 5. SMART NEXT TASKS (Deterministic Planner Recommendations) */}
      {/* ======================================================== */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                Recommended Next Tasks
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministic suggestions based on study continuity and prerequisites
              </p>
            </div>
          </div>

          {nextRecommendations.length > 4 && (
            <button
              type="button"
              onClick={() => setShowAllRecommendations((prev) => !prev)}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {showAllRecommendations ? 'Show Less' : `View More (${nextRecommendations.length})`}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {displayedRecommendations.map((rec) => (
            <div
              key={rec.id}
              className="p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex flex-col justify-between gap-3 shadow-2xs"
            >
              <div>
                {/* Reason Tag */}
                <div className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-md bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 mb-2">
                  <Sparkles className="w-3 h-3 text-indigo-500" />
                  <span>{rec.reason}</span>
                </div>

                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {rec.subtitle}
                  {rec.estimatedMinutes && ` • ${rec.estimatedMinutes} min`}
                </div>
                <div className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                  {rec.title}
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                <button
                  type="button"
                  onClick={() => onPlanRecommendation(rec)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/60 dark:hover:bg-slate-700 rounded-xl transition-colors"
                >
                  Plan for Later
                </button>
                <button
                  type="button"
                  onClick={() => onStartFromRecommendation(rec)}
                  className="px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Start Now</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
