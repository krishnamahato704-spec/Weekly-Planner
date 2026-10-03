import React from 'react';
import { Calendar, Check, X, BookOpen, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface NcertToWeeklySyncPromptProps {
  task: Task | null;
  activityLabel: string;
  chapterTitle: string;
  onConfirmCompleteWeeklyTask: () => void;
  onDismiss: () => void;
}

export const NcertToWeeklySyncPrompt: React.FC<NcertToWeeklySyncPromptProps> = ({
  task,
  activityLabel,
  chapterTitle,
  onConfirmCompleteWeeklyTask,
  onDismiss,
}) => {
  if (!task) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ncert-to-weekly-sync-title"
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="ncert-to-weekly-sync-title"
                className="text-sm sm:text-base font-bold text-slate-950 dark:text-white"
              >
                Weekly Planner Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                NCERT {activityLabel} was marked complete
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Dismiss prompt"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1.5 text-xs">
          <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
            <AlertCircle className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>A Weekly Planner task exists for this activity:</span>
          </div>
          <p className="font-bold text-slate-900 dark:text-white pl-5 text-xs sm:text-sm">
            "{task.title}"
          </p>
          {task.notes && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 pl-5">
              {task.notes}
            </p>
          )}
        </div>

        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          Would you like to mark this task complete in your active Weekly Plan as well?
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onDismiss}
            className="px-3.5 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
          >
            Keep Weekly Task
          </button>
          <button
            type="button"
            onClick={onConfirmCompleteWeeklyTask}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Mark Weekly Task Complete</span>
          </button>
        </div>
      </div>
    </div>
  );
};
