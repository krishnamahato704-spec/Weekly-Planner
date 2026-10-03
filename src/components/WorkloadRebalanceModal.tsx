import React, { useState } from 'react';
import { AlertTriangle, ArrowRight, Check, X, Calendar, Clock } from 'lucide-react';
import { Task } from '../types';
import { DayWorkloadSummary } from '../utils/calendarGoalsUtils';
import { formatMinutesFriendly, formatFriendlyDate } from '../utils/studySessionUtils';

interface WorkloadRebalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  overloadedDay: DayWorkloadSummary;
  allWeekWorkloads: DayWorkloadSummary[];
  onMoveTaskDate: (taskId: string, targetDateStr: string) => void;
}

export const WorkloadRebalanceModal: React.FC<WorkloadRebalanceModalProps> = ({
  isOpen,
  onClose,
  overloadedDay,
  allWeekWorkloads,
  onMoveTaskDate,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(
    overloadedDay.tasks[0]?.id || ''
  );
  // Pick candidate day that has remaining capacity
  const candidateDays = allWeekWorkloads.filter(
    (w) => w.dateStr !== overloadedDay.dateStr && w.totalPlannedMinutes < w.capacityMinutes
  );
  const [targetDateStr, setTargetDateStr] = useState<string>(
    candidateDays[0]?.dateStr || allWeekWorkloads.find((w) => w.dateStr !== overloadedDay.dateStr)?.dateStr || ''
  );

  if (!isOpen) return null;

  const selectedTask = overloadedDay.tasks.find((t) => t.id === selectedTaskId);
  const targetDay = allWeekWorkloads.find((w) => w.dateStr === targetDateStr);

  const handleConfirm = () => {
    if (!selectedTaskId || !targetDateStr) return;
    onMoveTaskDate(selectedTaskId, targetDateStr);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/50">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Workload Balancing Suggestion
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {overloadedDay.dayName} ({formatFriendlyDate(overloadedDay.dateStr)}) is overloaded
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Overload Notice Card */}
        <div className="p-3.5 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 space-y-1">
          <p className="font-semibold">
            {overloadedDay.dayName} has {formatMinutesFriendly(overloadedDay.totalPlannedMinutes)} planned
          </p>
          <p className="text-amber-800 dark:text-amber-300">
            Your preferred capacity is {formatMinutesFriendly(overloadedDay.capacityMinutes)}. Exceeded by {formatMinutesFriendly(overloadedDay.overloadMinutes)}.
          </p>
        </div>

        {/* Task to Rebalance */}
        <div className="space-y-3 text-xs">
          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Select Task to Move
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
            >
              {overloadedDay.tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.estimatedMinutes ? `${t.estimatedMinutes} min` : 'untimed'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Move to Day with Available Headroom
            </label>
            <select
              value={targetDateStr}
              onChange={(e) => setTargetDateStr(e.target.value)}
              className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[42px]"
            >
              {allWeekWorkloads
                .filter((w) => w.dateStr !== overloadedDay.dateStr)
                .map((w) => {
                  const remaining = Math.max(0, w.capacityMinutes - w.totalPlannedMinutes);
                  return (
                    <option key={w.dateStr} value={w.dateStr}>
                      {w.dayName} ({formatFriendlyDate(w.dateStr)}) — {formatMinutesFriendly(w.totalPlannedMinutes)} planned (
                      {remaining > 0 ? `${formatMinutesFriendly(remaining)} free capacity` : 'full'})
                    </option>
                  );
                })}
            </select>
          </div>

          {selectedTask && targetDay && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 truncate flex-1">
                Move <strong>{selectedTask.title}</strong>
              </span>
              <div className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-400 shrink-0">
                <span>{overloadedDay.dayName}</span>
                <ArrowRight className="w-3.5 h-3.5" />
                <span>{targetDay.dayName}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[40px]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[40px]"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Confirm Rebalance</span>
          </button>
        </div>
      </div>
    </div>
  );
};
