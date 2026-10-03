import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Check,
  Calendar,
  Clock,
  CheckCircle2,
  ChevronDown,
  Sparkles,
  BookOpen,
  GraduationCap,
  Layers,
  RotateCcw,
  ArrowRight,
  ArrowUpDown,
} from 'lucide-react';
import { Task, WeekPlan, TaskFilter, Priority } from '../types';
import { CompletionGauge } from './CompletionGauge';
import { formatWeekRange } from '../utils/dateUtils';
import { selectTasks, summarizeTasks } from '../utils/taskUtils';

interface CurrentWeekViewProps {
  week: WeekPlan;
  allWeeks: WeekPlan[];
  onSelectWeekId: (id: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onOpenAddTaskModal: () => void;
  onQuickAddTask: (title: string, category: string, priority: Priority) => void;
  onOpenNewWeekModal: () => void;
  onOpenNotebookModal: () => void;
  onTriggerConfetti: () => void;
  onRestoreSep27Week?: () => void;
  onTransferRemainingToNextWeek?: (fromWeekId: string) => void;
}

export const CurrentWeekView: React.FC<CurrentWeekViewProps> = ({
  week,
  allWeeks,
  onSelectWeekId,
  onToggleTask,
  onDeleteTask,
  onEditTask,
  onOpenAddTaskModal,
  onQuickAddTask,
  onOpenNewWeekModal,
  onTriggerConfetti,
  onTransferRemainingToNextWeek,
}) => {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'incomplete_first' | 'title'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Study');
  const [quickPriority, setQuickPriority] = useState<Priority>('Medium');

  const stats = useMemo(() => summarizeTasks(week.tasks), [week.tasks]);
  const { total: totalTasks, completed: completedTasks, remaining: remainingTasks,
    percentage: completionPercentage, carriedOver: carriedOverTasksCount } = stats;
  const { High: highPriorityCount, Medium: medPriorityCount, Low: lowPriorityCount } = stats.pendingByPriority;
  const weekOptions = useMemo(() => allWeeks.map((plan) => ({
    id: plan.id,
    title: plan.title,
    total: plan.tasks.length,
    completed: plan.tasks.reduce((count, task) => count + Number(!!task.completed), 0),
  })), [allWeeks]);

  const handleQuickAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    onQuickAddTask(quickTitle.trim(), quickCategory, quickPriority);
    setQuickTitle('');
  };

  const sortedTasks = useMemo(
    () => selectTasks(week.tasks, filter, priorityFilter, searchQuery, sortBy),
    [week.tasks, filter, priorityFilter, searchQuery, sortBy],
  );

  const handleCyclePriority = (e: React.MouseEvent, task: Task) => {
    e.stopPropagation();
    const cycleMap: Record<Priority, Priority> = {
      High: 'Medium',
      Medium: 'Low',
      Low: 'High',
    };
    const nextPriority = cycleMap[task.priority] || 'Medium';
    onEditTask({ ...task, priority: nextPriority });
  };

  const renderTaskBadge = (task: Task) => {
    if (task.ncertRef) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
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
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
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
      {/* Week Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <Calendar className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              {formatWeekRange(week.sundayDate)}
            </span>
            <span aria-hidden="true">·</span>
            <span>Weekly Study Cycle</span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums font-mono font-bold text-slate-900 dark:text-white">
              {totalTasks} weekly tasks
            </span>
          </div>

          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            {week.title}
          </h1>

          {week.focusGoal ? (
            <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 pt-1 flex items-center gap-1.5">
              <span className="text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider text-[10px]">
                Weekly Target:
              </span>
              <span className="font-medium">{week.focusGoal}</span>
            </div>
          ) : (
            <p className="text-xs text-slate-500 dark:text-slate-400 pt-1">
              Active weekly execution checklist for academic syllabus and exam deliverables.
            </p>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Week Selector Dropdown */}
          <div className="relative">
            <select
              value={week.id}
              onChange={(e) => onSelectWeekId(e.target.value)}
              className="text-xs sm:text-sm pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] text-slate-900 dark:text-white font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs appearance-none cursor-pointer"
            >
              {weekOptions.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.title} ({w.completed}/{w.total})
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {remainingTasks > 0 && onTransferRemainingToNextWeek && (
            <button
              onClick={() => onTransferRemainingToNextWeek(week.id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-bold text-amber-900 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-300 dark:border-amber-800 rounded-xl transition-all shadow-2xs"
              title="Automatically transfer all remaining incomplete tasks to the next weekly cycle"
            >
              <RotateCcw className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span>Transfer {remainingTasks} to Next Week</span>
              <ArrowRight className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            </button>
          )}

          <button
            onClick={onOpenNewWeekModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            <span>+ New Week</span>
          </button>

          <button
            onClick={onOpenAddTaskModal}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all active:scale-[0.98]"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>
      </div>

      {/* Metrics Cards: 3 Focused Modules */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
        {/* Module 1: Circular Gauge & Progress */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-4 min-w-0">
            <CompletionGauge percentage={completionPercentage} size={76} strokeWidth={7} />
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-950 dark:text-white truncate">
                {completionPercentage === 100 && totalTasks > 0
                  ? 'All Goals Finished!'
                  : completionPercentage >= 50
                  ? 'Strong Progress'
                  : 'Weekly Planning'}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {completedTasks} of {totalTasks} tasks completed
              </p>
            </div>
          </div>

          {completionPercentage === 100 && (
            <button
              onClick={onTriggerConfetti}
              className="p-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors"
              title="Celebrate 100%!"
            >
              <Sparkles className="w-5 h-5 animate-pulse" />
            </button>
          )}
        </div>

        {/* Module 2: Weekly Velocity & Execution Rate */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] flex flex-col justify-between shadow-2xs gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              Weekly Execution
            </span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">
              {completionPercentage}% complete
            </span>
          </div>

          <div>
            <div className="text-xl sm:text-2xl font-extrabold text-slate-950 dark:text-white">
              {completedTasks}{' '}
              <span className="text-xs font-normal text-slate-400">
                / {totalTasks} total tasks
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {remainingTasks} task{remainingTasks !== 1 ? 's' : ''} left in this weekly block
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>

        {/* Module 3: Priority Spectrum */}
        <div className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] flex flex-col justify-between shadow-2xs gap-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider text-[10px]">
              Pending Priority Split
            </span>
            <span className="text-xs text-slate-400">{remainingTasks} remaining</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-xl bg-rose-50/70 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-center">
              <span className="text-[10px] font-bold text-rose-600 dark:text-rose-400 block uppercase">
                High
              </span>
              <span className="text-base font-extrabold text-rose-700 dark:text-rose-300">
                {highPriorityCount}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 text-center">
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block uppercase">
                Medium
              </span>
              <span className="text-base font-extrabold text-amber-700 dark:text-amber-300">
                {medPriorityCount}
              </span>
            </div>

            <div className="p-2 rounded-xl bg-sky-50/70 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 text-center">
              <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 block uppercase">
                Low
              </span>
              <span className="text-base font-extrabold text-sky-700 dark:text-sky-300">
                {lowPriorityCount}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Focus on high priority academic targets first
          </div>
        </div>
      </div>

      {/* Quick Add Bar */}
      <form
        onSubmit={handleQuickAddSubmit}
        className="p-3 sm:p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shadow-2xs"
      >
        <div className="relative flex-1 w-full min-w-0">
          <input
            type="text"
            value={quickTitle}
            onChange={(e) => setQuickTitle(e.target.value)}
            placeholder="+ Quick add a task directly to this weekly plan..."
            className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
          />
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={quickCategory}
            onChange={(e) => setQuickCategory(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
          >
            <option value="Study">Study</option>
            <option value="Exam Prep">Exam Prep</option>
            <option value="Research">Research</option>
            <option value="Skills">Skills</option>
            <option value="B.Ed SI">B.Ed SI</option>
            <option value="Work">Work</option>
            <option value="Personal">Personal</option>
          </select>

          <select
            value={quickPriority}
            onChange={(e) => setQuickPriority(e.target.value as Priority)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <button
            type="submit"
            disabled={!quickTitle.trim()}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-xl transition-colors shrink-0 shadow-xs min-h-[42px] flex items-center justify-center"
          >
            Add Task
          </button>
        </div>
      </form>

      {/* Transferred Tasks Banner if any */}
      {carriedOverTasksCount > 0 && (
        <div className="p-3.5 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/40 flex items-center justify-between gap-3 text-xs text-amber-900 dark:text-amber-200 shadow-2xs">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300 flex items-center justify-center shrink-0">
              <RotateCcw className="w-3.5 h-3.5" />
            </div>
            <span>
              <strong>{carriedOverTasksCount} task{carriedOverTasksCount > 1 ? 's were' : ' was'} automatically transferred</strong> from previous weekly cycle.
            </span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 rounded-lg border border-amber-200/60 dark:border-amber-900/50">
            Transferred & Active
          </span>
        </div>
      )}

      {/* Task List Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'all'
                ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            All Tasks ({totalTasks})
          </button>

          <button
            onClick={() => setFilter('remaining')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'remaining'
                ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Remaining ({remainingTasks})
          </button>

          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
              filter === 'completed'
                ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-2xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            Completed ({completedTasks})
          </button>
        </div>

        {/* Priority, Sort and Search */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs font-semibold px-2.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] text-slate-700 dark:text-slate-200 text-xs font-semibold">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-semibold focus:outline-none cursor-pointer text-slate-700 dark:text-slate-200"
            >
              <option value="default">Default Order</option>
              <option value="priority">Priority (High → Low)</option>
              <option value="incomplete_first">Incomplete First</option>
              <option value="title">Title (A → Z)</option>
            </select>
          </div>

          <div className="relative w-full sm:w-52 min-w-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search weekly tasks..."
              className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1420] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-slate-300 dark:border-slate-800 rounded-2xl bg-white/50 dark:bg-slate-900/30">
            <CheckCircle2 className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              No tasks found
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {searchQuery
                ? 'Try clearing your search query.'
                : 'Add a new task using the quick entry bar above.'}
            </p>
          </div>
        ) : (
          sortedTasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-start justify-between gap-3.5 p-4 rounded-2xl border transition-all duration-200 ${
                task.completed
                  ? 'border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-950/30 opacity-75'
                  : 'border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] hover:border-indigo-300 dark:hover:border-indigo-800 hover:shadow-xs'
              }`}
            >
              {/* Checkbox and Task Title */}
              <div className="flex items-start gap-3.5 flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => onToggleTask(task.id)}
                  className={`mt-0.5 w-5 h-5 rounded-lg flex items-center justify-center border-2 transition-all shrink-0 ${
                    task.completed
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 bg-white dark:bg-slate-900'
                  }`}
                  aria-label={task.completed ? 'Mark task incomplete' : 'Mark task complete'}
                >
                  {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span
                      onClick={() => onToggleTask(task.id)}
                      className={`text-sm font-bold cursor-pointer transition-colors ${
                        task.completed
                          ? 'line-through text-slate-400 dark:text-slate-500'
                          : 'text-slate-950 dark:text-white hover:text-indigo-600 dark:hover:text-indigo-400'
                      }`}
                    >
                      {task.title}
                    </span>

                    {task.carriedOverFrom && (
                      <span className="text-[10px] text-amber-700 dark:text-amber-300 font-bold bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200 dark:border-amber-900/60 inline-flex items-center gap-1">
                        <RotateCcw className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                        <span>Transferred from Prev Week</span>
                      </span>
                    )}
                  </div>

                  {task.notes && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
                      {task.notes}
                    </p>
                  )}

                  {/* Clean unboxed metadata */}
                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pt-0.5 flex-wrap">
                    {renderTaskBadge(task)}
                    <span aria-hidden="true">·</span>
                    <button
                      type="button"
                      onClick={(e) => handleCyclePriority(e, task)}
                      title="Click to cycle priority (High → Medium → Low)"
                      className={`font-semibold hover:underline cursor-pointer transition-colors ${
                        task.priority === 'High'
                          ? 'text-rose-600 dark:text-rose-400'
                          : task.priority === 'Medium'
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      {task.priority} Priority
                    </button>
                    {task.isRecurring && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="inline-flex items-center gap-1 text-indigo-600 dark:text-indigo-400 font-bold text-[11px]" title="Automatically duplicates to every new weekly plan">
                          <RotateCcw className="w-3 h-3" />
                          <span>Weekly Recurring</span>
                        </span>
                      </>
                    )}
                    {task.completed && task.completedAt && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold">
                          Completed
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => onEditTask(task)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Edit task"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onDeleteTask(task.id)}
                  className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                  title="Delete task"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
