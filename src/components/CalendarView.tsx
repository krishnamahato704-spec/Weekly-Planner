import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  RotateCcw,
  BookOpen,
  GraduationCap,
  Sparkles,
  ArrowRight,
  Filter,
  Check,
  X,
  Layers,
  CalendarCheck,
  CircleDot,
  CheckCheck,
  ListTodo,
} from 'lucide-react';
import { Task, Priority } from '../types';
import { formatFriendlyDate, getTodayDateString } from '../utils/studySessionUtils';

interface CalendarViewProps {
  allTasks: Task[];
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onOpenAddTaskModal: (initialDate?: string) => void;
  onRescheduleTask: (taskId: string, newDate: string, newTime?: string) => void;
}

type CalendarViewMode = 'weekly_block' | 'month_overview';

export const CalendarView: React.FC<CalendarViewProps> = ({
  allTasks,
  onToggleTask,
  onEditTask,
  onOpenAddTaskModal,
  onRescheduleTask,
}) => {
  const todayStr = getTodayDateString();
  const [viewMode, setViewMode] = useState<CalendarViewMode>('weekly_block');
  const [currentDateStr, setCurrentDateStr] = useState<string>(todayStr);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Reschedule dialog state
  const [rescheduleTask, setRescheduleTask] = useState<Task | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState<string>('');

  const categories = useMemo(() => {
    return Array.from(new Set(allTasks.map((t) => t.category))).filter(Boolean);
  }, [allTasks]);

  // Calculate Monday-to-Sunday dates for the active week block
  const getCurrentDateObj = () => {
    const [y, m, d] = currentDateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const getWeekDates = (centerDateStr: string): string[] => {
    const [y, m, d] = centerDateStr.split('-').map(Number);
    const date = new Date(y, m - 1, d);
    const day = date.getDay(); // 0 is Sun, 1 is Mon
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(date);
    monday.setDate(date.getDate() + diffToMonday);

    const week: string[] = [];
    for (let i = 0; i < 7; i++) {
      const nextDay = new Date(monday);
      nextDay.setDate(monday.getDate() + i);
      const year = nextDay.getFullYear();
      const month = String(nextDay.getMonth() + 1).padStart(2, '0');
      const dayNum = String(nextDay.getDate()).padStart(2, '0');
      week.push(`${year}-${month}-${dayNum}`);
    }
    return week;
  };

  const weekDates = useMemo(() => getWeekDates(currentDateStr), [currentDateStr]);
  const weekStartStr = weekDates[0];
  const weekEndStr = weekDates[6];

  // Month weekly blocks generator
  const getMonthWeeklyBlocks = (centerDateStr: string) => {
    const [y, m] = centerDateStr.split('-').map(Number);
    const firstDay = new Date(y, m - 1, 1);
    const lastDay = new Date(y, m, 0);

    const startDay = firstDay.getDay();
    const diffToMonday = startDay === 0 ? -6 : 1 - startDay;
    const currentMonday = new Date(firstDay);
    currentMonday.setDate(firstDay.getDate() + diffToMonday);

    const weeksList: {
      weekIndex: number;
      startDate: string;
      endDate: string;
      dates: string[];
      label: string;
    }[] = [];

    let count = 1;
    while (currentMonday <= lastDay || weeksList.length < 4) {
      const dates: string[] = [];
      const mondayClone = new Date(currentMonday);
      for (let i = 0; i < 7; i++) {
        const d = new Date(mondayClone);
        d.setDate(mondayClone.getDate() + i);
        const yStr = d.getFullYear();
        const mStr = String(d.getMonth() + 1).padStart(2, '0');
        const dStr = String(d.getDate()).padStart(2, '0');
        dates.push(`${yStr}-${mStr}-${dStr}`);
      }

      const sStr = dates[0];
      const eStr = dates[6];
      weeksList.push({
        weekIndex: count,
        startDate: sStr,
        endDate: eStr,
        dates,
        label: `Week ${count} (${formatFriendlyDate(sStr).split(',')[1]?.trim() || sStr} – ${formatFriendlyDate(eStr).split(',')[1]?.trim() || eStr})`,
      });

      currentMonday.setDate(currentMonday.getDate() + 7);
      count++;
      if (count > 6) break;
    }

    return {
      monthName: new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(firstDay),
      weeksList,
    };
  };

  const monthBlocks = useMemo(() => getMonthWeeklyBlocks(currentDateStr), [currentDateStr]);

  // Navigate periods
  const handlePrev = () => {
    const d = getCurrentDateObj();
    if (viewMode === 'weekly_block') {
      d.setDate(d.getDate() - 7);
    } else {
      d.setMonth(d.getMonth() - 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setCurrentDateStr(`${year}-${month}-${day}`);
  };

  const handleNext = () => {
    const d = getCurrentDateObj();
    if (viewMode === 'weekly_block') {
      d.setDate(d.getDate() + 7);
    } else {
      d.setMonth(d.getMonth() + 1);
    }
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setCurrentDateStr(`${year}-${month}-${day}`);
  };

  const handleToday = () => {
    setCurrentDateStr(todayStr);
  };

  // Filter tasks for current week block
  const weekTasks = useMemo(() => {
    return allTasks.filter((t) => {
      const inWeek = t.scheduledDate ? weekDates.includes(t.scheduledDate) : true;
      if (!inWeek) return false;
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (statusFilter === 'completed' && !t.completed) return false;
      if (statusFilter === 'pending' && t.completed) return false;
      return true;
    });
  }, [allTasks, weekDates, selectedCategory, statusFilter]);

  // Weekly Completion Metrics
  const completedTasks = useMemo(() => weekTasks.filter((t) => t.completed), [weekTasks]);
  const pendingTasks = useMemo(() => weekTasks.filter((t) => !t.completed), [weekTasks]);
  const totalCount = weekTasks.length;
  const completedCount = completedTasks.length;
  const completionPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const openRescheduleModal = (task: Task) => {
    setRescheduleTask(task);
    setRescheduleDate(task.scheduledDate || todayStr);
  };

  const handleConfirmReschedule = () => {
    if (!rescheduleTask || !rescheduleDate) return;
    onRescheduleTask(rescheduleTask.id, rescheduleDate);
    setRescheduleTask(null);
  };

  const renderTaskBadge = (task: Task) => {
    if (task.ncertRef) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
          <BookOpen className="w-3 h-3 text-indigo-500" />
          <span>Class {task.ncertRef.classNum} NCERT</span>
        </span>
      );
    }
    if (
      task.category.includes('B.Ed') ||
      task.category.includes('CTET') ||
      task.category.includes('M.A.') ||
      task.category.includes('UGC NET')
    ) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700 dark:text-teal-300">
          <GraduationCap className="w-3 h-3 text-teal-500" />
          <span>{task.category}</span>
        </span>
      );
    }
    return (
      <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
        {task.category}
      </span>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header & Weekly Block Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-[#0F1420] p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-indigo-600 dark:text-indigo-400">
                Weekly Planning Block
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                {formatFriendlyDate(weekStartStr)} – {formatFriendlyDate(weekEndStr)}
              </span>
            </div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white mt-0.5">
              Weekly Task & Completion Calendar
            </h1>
          </div>
        </div>

        {/* View mode and period switchers */}
        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          {/* Previous / Current / Next controls */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/60">
            <button
              onClick={handlePrev}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Previous Week"
              aria-label="Previous Week"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400"
            >
              Current Week
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white rounded-lg hover:bg-white dark:hover:bg-slate-700 transition-colors"
              title="Next Week"
              aria-label="Next Week"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/90 rounded-xl p-1 border border-slate-200/60 dark:border-slate-700/60 text-xs font-bold">
            <button
              onClick={() => setViewMode('weekly_block')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'weekly_block'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Weekly Block</span>
            </button>
            <button
              onClick={() => setViewMode('month_overview')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                viewMode === 'month_overview'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Month Overview</span>
            </button>
          </div>

          <button
            onClick={() => onOpenAddTaskModal(weekStartStr)}
            className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Add Weekly Task</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: WEEKLY BLOCK VIEW (Primary)                      */}
      {/* ======================================================== */}
      {viewMode === 'weekly_block' && (
        <div className="space-y-6">
          {/* Weekly Task Completion Progress Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl border border-indigo-900/40 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[11px] uppercase font-bold tracking-wider text-indigo-300">
                  Weekly Execution Summary
                </span>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight mt-1">
                  {completedCount} of {totalCount} Weekly Tasks Completed
                </h2>
                <p className="text-xs text-indigo-200/80 mt-1">
                  {completedCount === totalCount && totalCount > 0
                    ? '🎉 Outstanding! All scheduled weekly tasks are 100% finished.'
                    : `${pendingTasks.length} tasks remaining for this 7-day cycle.`}
                </p>
              </div>

              {/* Metrics Summary Blocks */}
              <div className="flex items-center gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 text-center min-w-[100px]">
                  <div className="text-[10px] text-indigo-200 uppercase font-bold">Progress</div>
                  <div className="text-xl font-black text-emerald-400">{completionPercent}%</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 text-center min-w-[100px]">
                  <div className="text-[10px] text-indigo-200 uppercase font-bold">Remaining</div>
                  <div className="text-xl font-black text-amber-300">{pendingTasks.length}</div>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl px-4 py-3 border border-white/10 text-center min-w-[100px]">
                  <div className="text-[10px] text-indigo-200 uppercase font-bold">Done</div>
                  <div className="text-xl font-black text-teal-300">{completedCount}</div>
                </div>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="space-y-1.5 pt-1">
              <div className="w-full bg-white/20 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-400 to-teal-300 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#0F1420] p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 shadow-2xs">
            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === 'all'
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                All Tasks ({totalCount})
              </button>
              <button
                onClick={() => setStatusFilter('pending')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                In Progress ({pendingTasks.length})
              </button>
              <button
                onClick={() => setStatusFilter('completed')}
                className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all ${
                  statusFilter === 'completed'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                Completed ({completedCount})
              </button>
            </div>

            {/* Category Dropdown Filter */}
            {categories.length > 0 && (
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="text-xs font-semibold px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Categories</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Dedicated Weekly Task Blocks Container */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left Block (7 Cols): Active Weekly Action Items */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <ListTodo className="w-4 h-4 text-indigo-500" />
                  <span>Weekly Action Items ({pendingTasks.length})</span>
                </h3>
              </div>

              {pendingTasks.length === 0 ? (
                <div className="bg-white dark:bg-[#0F1420] rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <CheckCheck className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    No Pending Weekly Tasks
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    All tasks for this weekly block are completed, or you can add new tasks to this week.
                  </p>
                  <button
                    onClick={() => onOpenAddTaskModal(weekStartStr)}
                    className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Task to Week</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingTasks.map((task) => (
                    <div
                      key={task.id}
                      className="group bg-white dark:bg-[#0F1420] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-800 transition-all flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onToggleTask(task.id)}
                          className="mt-0.5 w-5 h-5 rounded-lg border-2 border-slate-300 dark:border-slate-600 hover:border-indigo-500 dark:hover:border-indigo-400 flex items-center justify-center transition-colors shrink-0 bg-white dark:bg-slate-800"
                          title="Mark as Completed"
                        >
                          <span className="sr-only">Complete task</span>
                        </button>

                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span
                              onClick={() => onToggleTask(task.id)}
                              className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors cursor-pointer"
                            >
                              {task.title}
                            </span>
                          </div>

                          {task.notes && (
                            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                              {task.notes}
                            </p>
                          )}

                          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5 flex-wrap">
                            {renderTaskBadge(task)}
                            <span aria-hidden="true">·</span>
                            <span
                              className={`font-semibold ${
                                task.priority === 'High'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : task.priority === 'Medium'
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              {task.priority} Priority
                            </span>
                            {task.isRecurring && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-[10px]">
                                  <RotateCcw className="w-2.5 h-2.5" />
                                  <span>Recurring</span>
                                </span>
                              </>
                            )}
                            {task.carriedOverFrom && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold text-[10px]">
                                  <RotateCcw className="w-2.5 h-2.5 text-amber-500" />
                                  <span>Transferred</span>
                                </span>
                              </>
                            )}
                            {task.scheduledDate && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="flex items-center gap-1 text-slate-600 dark:text-slate-400">
                                  <CalendarIcon className="w-3 h-3" />
                                  <span>{formatFriendlyDate(task.scheduledDate).split(',')[0]}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openRescheduleModal(task)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Reschedule to another week / date"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onEditTask(task)}
                          className="px-2.5 py-1 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-semibold"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Block (5 Cols): Dedicated Tasks Completed This Week Block */}
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-bold text-slate-950 dark:text-white uppercase tracking-wider flex items-center gap-2">
                  <CheckCheck className="w-4 h-4 text-emerald-500" />
                  <span>Tasks Completed This Week ({completedCount})</span>
                </h3>
              </div>

              {completedTasks.length === 0 ? (
                <div className="bg-slate-50 dark:bg-[#0F1420]/60 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 p-8 text-center text-xs text-slate-400 space-y-1">
                  <p className="font-semibold text-slate-600 dark:text-slate-300">No tasks completed yet</p>
                  <p>Check off weekly action items as you finish them to build momentum.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {completedTasks.map((task) => (
                    <div
                      key={task.id}
                      className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 rounded-2xl p-3.5 space-y-1.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <button
                            onClick={() => onToggleTask(task.id)}
                            className="w-4 h-4 rounded-md bg-emerald-600 text-white flex items-center justify-center shrink-0"
                            title="Mark as Incomplete"
                          >
                            <Check className="w-3 h-3 stroke-[3]" />
                          </button>
                          <span className="text-xs font-bold text-slate-900 dark:text-white line-through opacity-80 truncate">
                            {task.title}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pl-6.5">
                        <span>{task.category}</span>
                        {task.completedAt && (
                          <span className="font-mono text-[10px]">
                            {new Date(task.completedAt).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                            })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: MULTI-WEEK MONTH OVERVIEW                        */}
      {/* ======================================================== */}
      {viewMode === 'month_overview' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0F1420] rounded-2xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-2xs flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              {monthBlocks.monthName} — Weekly Planning Blocks
            </h2>
            <span className="text-xs text-slate-500 font-medium">
              Click any weekly block to open its full completion checklist
            </span>
          </div>

          <div className="space-y-3">
            {monthBlocks.weeksList.map((block) => {
              const blockTasks = allTasks.filter((t) =>
                t.scheduledDate ? block.dates.includes(t.scheduledDate) : false
              );
              const bCompleted = blockTasks.filter((t) => t.completed).length;
              const bTotal = blockTasks.length;
              const bPercent = bTotal > 0 ? Math.round((bCompleted / bTotal) * 100) : 0;
              const isCurrentSelected = block.startDate === weekStartStr;

              return (
                <div
                  key={block.startDate}
                  onClick={() => {
                    setCurrentDateStr(block.startDate);
                    setViewMode('weekly_block');
                  }}
                  className={`cursor-pointer rounded-2xl p-5 border transition-all space-y-3 ${
                    isCurrentSelected
                      ? 'bg-indigo-50/70 dark:bg-indigo-950/30 border-indigo-400 dark:border-indigo-700 shadow-sm'
                      : 'bg-white dark:bg-[#0F1420] border-slate-200/80 dark:border-slate-800/80 hover:border-indigo-300 dark:hover:border-indigo-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {block.label}
                        </span>
                        {isCurrentSelected && (
                          <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded-full">
                            Current Block
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {bTotal === 0
                          ? 'No tasks scheduled in this week block'
                          : `${bCompleted} of ${bTotal} tasks completed`}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {bPercent}% Done
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600" />
                    </div>
                  </div>

                  {bTotal > 0 && (
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all"
                        style={{ width: `${bPercent}%` }}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {rescheduleTask && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
          role="dialog"
          aria-modal="true"
        >
          <div
            className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reschedule Weekly Task
              </h3>
              <button
                onClick={() => setRescheduleTask(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {rescheduleTask.title}
              </div>
              <div className="text-slate-500">{rescheduleTask.category}</div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Target Week Date
                </label>
                <input
                  type="date"
                  value={rescheduleDate}
                  onChange={(e) => setRescheduleDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setRescheduleTask(null)}
                className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReschedule}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
