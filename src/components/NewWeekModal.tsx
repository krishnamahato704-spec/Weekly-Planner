import { Dialog } from './ui/Dialog';
import React, { useState, useEffect, useMemo } from 'react';
import { X, Calendar, ArrowRight, CheckCircle2, AlertCircle, RotateCcw, Repeat } from 'lucide-react';
import { Task, WeekPlan } from '../types';
import { getNextSunday, getSunday, toDateKey, formatWeekTitle, parseDateKey } from '../utils/dateUtils';

interface NewWeekModalProps {
  isOpen: boolean;
  onClose: () => void;
  weeks: WeekPlan[];
  onCreateWeek: (newWeekData: {
    sundayDate: string;
    focusGoal: string;
    carryOverTasks: boolean;
    selectedTaskIds: string[];
    includeRecurringTasks: boolean;
  }) => void;
}

export const NewWeekModal: React.FC<NewWeekModalProps> = ({
  isOpen,
  onClose,
  weeks,
  onCreateWeek,
}) => {
  const fieldId = React.useId();
  const dialogTitleId = React.useId();
  // Determine suggested next Sunday date
  const latestWeek = useMemo(() => weeks.reduce<WeekPlan | null>((latest, week) =>
    !latest || week.sundayDate > latest.sundayDate ? week : latest, null), [weeks]);

  const defaultDateKey = latestWeek
    ? toDateKey(getNextSunday(parseDateKey(latestWeek.sundayDate)))
    : toDateKey(getSunday(new Date()));

  const [sundayDate, setSundayDate] = useState(defaultDateKey);
  const [focusGoal, setFocusGoal] = useState('');
  const [carryOver, setCarryOver] = useState(true);
  const [includeRecurring, setIncludeRecurring] = useState(true);

  // Incomplete tasks from previous week (excluding recurring tasks to avoid duplicates)
  const previousWeekTasks = useMemo(() => latestWeek
    ? latestWeek.tasks.filter((t) => !t.completed && !t.isRecurring)
    : [], [latestWeek]);

  // Recurring tasks from latest week or across all weeks
  const recurringTasks = useMemo(() => latestWeek
    ? latestWeek.tasks.filter((t) => t.isRecurring)
    : [], [latestWeek]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>(
    previousWeekTasks.map((t) => t.id)
  );

  useEffect(() => {
    if (isOpen) {
      const nextDate = latestWeek
        ? toDateKey(getNextSunday(parseDateKey(latestWeek.sundayDate)))
        : toDateKey(getSunday(new Date()));
      setSundayDate(nextDate);
      setFocusGoal('');
      setCarryOver(true);
      setIncludeRecurring(true);
      if (latestWeek) {
        setSelectedTaskIds(latestWeek.tasks.filter((t) => !t.completed && !t.isRecurring).map((t) => t.id));
      }
    }
  }, [isOpen, latestWeek]);

  if (!isOpen) return null;

  const toggleTaskSelection = (id: string) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (select: boolean) => {
    if (select) {
      setSelectedTaskIds(previousWeekTasks.map((t) => t.id));
    } else {
      setSelectedTaskIds([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreateWeek({
      sundayDate,
      focusGoal: focusGoal.trim(),
      carryOverTasks: carryOver,
      selectedTaskIds: carryOver ? selectedTaskIds : [],
      includeRecurringTasks: includeRecurring,
    });
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={dialogTitleId} className="modal-panel overflow-y-auto w-full max-w-xl bg-white dark:bg-[#0F1420] rounded-2xl border border-slate-200/90 dark:border-slate-800 shadow-2xl flex flex-col ">
      {/* Modal Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
            <Calendar aria-hidden="true" className="w-4 h-4" />
          </div>
          <div>
            <h2 id={dialogTitleId} className="text-base font-bold text-slate-950 dark:text-white">
              Start New Weekly Plan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Kick off a fresh 7-day cycle with automatic recurring routines
            </p>
          </div>
        </div>
        <button aria-label="Close dialog"
          onClick={onClose}
          className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>

      {/* Modal Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
        {/* Target Sunday Date */}
        <div>
          <label htmlFor={`${fieldId}-field-1`} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Sunday Start Date <span className="text-rose-500">*</span>
          </label>
          <input id={`${fieldId}-field-1`}
            type="date"
            required
            value={sundayDate}
            onChange={(e) => setSundayDate(e.target.value)}
            className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Planning for: <strong className="text-slate-800 dark:text-slate-200">{formatWeekTitle(sundayDate)}</strong>
          </p>
        </div>

        {/* Weekly Focus Goal */}
        <div>
          <label htmlFor={`${fieldId}-field-2`} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Weekly Focus / Main Objective (Optional)
          </label>
          <input id={`${fieldId}-field-2`} type="text" value={focusGoal} onChange={(e) => setFocusGoal(e.target.value)} placeholder="e.g. Finish NCERT Class 7, Action Research & English vocabulary..." className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs" maxLength={20000}/>
        </div>

        {/* Section 1: Weekly Recurring Routines (Auto Updates) */}
        <div className="p-4 rounded-2xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={includeRecurring}
                onChange={(e) => setIncludeRecurring(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Include Weekly Recurring Tasks
                  </span>
                  <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/60 px-2 py-0.2 rounded-full">
                    {recurringTasks.length} active
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Automatically copies repeating routines into the new week in a fresh, uncompleted state
                </span>
              </div>
            </label>
          </div>

          {includeRecurring && recurringTasks.length > 0 && (
            <div className="pt-2 border-t border-indigo-100/80 dark:border-indigo-900/30 space-y-1.5">
              {recurringTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-slate-900 border border-indigo-100 dark:border-indigo-900/40 text-xs"
                >
                  <RotateCcw aria-hidden="true" className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300 shrink-0" />
                  <span className="font-semibold text-slate-900 dark:text-white truncate flex-1">
                    {task.title}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 shrink-0">
                    {task.category}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 2: Carry Over Remaining Incomplete Tasks */}
        <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={carryOver}
                onChange={(e) => setCarryOver(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 dark:border-slate-600 focus:ring-indigo-500"
              />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">
                    Automatically Transfer Remaining Incomplete Tasks
                  </span>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-950/60 px-2 py-0.2 rounded-full">
                    {previousWeekTasks.length} remaining
                  </span>
                </div>
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  Transfers all unfinished tasks from the previous week directly into this new weekly plan
                </span>
              </div>
            </label>

            {carryOver && previousWeekTasks.length > 0 && (
              <div className="text-xs text-slate-500 dark:text-slate-400 space-x-2">
                <button
                  type="button"
                  onClick={() => handleSelectAll(true)}
                  className="hover:underline text-indigo-600 dark:text-indigo-300 font-semibold"
                >
                  Select All
                </button>
                <span>·</span>
                <button
                  type="button"
                  onClick={() => handleSelectAll(false)}
                  className="hover:underline"
                >
                  Clear
                </button>
              </div>
            )}
          </div>

          {carryOver && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-800">
              {previousWeekTasks.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                  Great news! There were no incomplete one-off tasks in the previous week.
                </p>
              ) : (
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {previousWeekTasks.map((task) => {
                    const isSelected = selectedTaskIds.includes(task.id);
                    return (
                      <label
                        key={task.id}
                        className={`flex items-start gap-2.5 p-2 rounded-xl text-xs cursor-pointer transition-colors border ${
                          isSelected
                            ? 'bg-white dark:bg-slate-800 border-indigo-300 dark:border-indigo-800 text-slate-900 dark:text-white font-medium shadow-2xs'
                            : 'bg-transparent border-transparent text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTaskSelection(task.id)}
                          className="mt-0.5 w-3.5 h-3.5 text-indigo-600 rounded border-slate-300"
                        />
                        <span className="flex-1 min-w-0">
                          <span className="block">{task.title}</span>
                          <span className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                            <span>{task.category}</span>
                            <span>·</span>
                            <span>{task.priority} Priority</span>
                          </span>
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-all flex items-center gap-2"
          >
            <span>Create Weekly Plan</span>
            <ArrowRight aria-hidden="true" className="w-4 h-4" />
          </button>
        </div>
      </form>
    </Dialog>
  );
};
