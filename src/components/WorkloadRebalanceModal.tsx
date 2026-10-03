import { Dialog } from './ui/Dialog';
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
  const fieldId = React.useId();
  const dialogTitleId = React.useId();
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
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={dialogTitleId} className="modal-panel overflow-y-auto w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/50">
            <AlertTriangle aria-hidden="true" className="w-5 h-5" />
          </div>
          <div>
            <h2 id={dialogTitleId} className="text-base font-bold text-slate-950 dark:text-white">
              Workload Balancing Suggestion
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {overloadedDay.dayName} ({formatFriendlyDate(overloadedDay.dateStr)}) is overloaded
            </p>
          </div>
        </div>
        <button aria-label="Close dialog"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X aria-hidden="true" className="w-4 h-4" />
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
          <label htmlFor={`${fieldId}-field-1`} className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Select Task to Move
          </label>
          <select id={`${fieldId}-field-1`}
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
          >
            {overloadedDay.tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} ({t.estimatedMinutes ? `${t.estimatedMinutes} min` : 'untimed'})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={`${fieldId}-field-2`} className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
            Move to Day with Available Headroom
          </label>
          <select id={`${fieldId}-field-2`}
            value={targetDateStr}
            onChange={(e) => setTargetDateStr(e.target.value)}
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
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
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <span className="text-slate-600 dark:text-slate-400 min-w-0 flex-1">
              Move <strong>{selectedTask.title}</strong>
            </span>
            <div className="flex items-center gap-1.5 font-semibold text-indigo-600 dark:text-indigo-300 shrink-0">
              <span>{overloadedDay.dayName}</span>
              <ArrowRight aria-hidden="true" className="w-3.5 h-3.5" />
              <span>{targetDay.dayName}</span>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
        >
          <Check aria-hidden="true" className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Confirm Rebalance</span>
        </button>
      </div>
    </Dialog>
  );
};
