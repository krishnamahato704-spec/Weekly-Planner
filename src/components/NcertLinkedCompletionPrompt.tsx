import React from 'react';
import { Sparkles, Check, X, BookOpen, AlertCircle } from 'lucide-react';

interface NcertLinkedCompletionPromptProps {
  promptData: {
    taskId: string;
    taskTitle: string;
    chapterTitle: string;
    activity: 'reading' | 'notes' | 'revision';
    chapterId: string;
    className?: string;
    subject?: string;
  } | null;
  onConfirm: (alwaysAutoSync?: boolean) => void;
  onDismiss: () => void;
}

export const NcertLinkedCompletionPrompt: React.FC<NcertLinkedCompletionPromptProps> = ({
  promptData,
  onConfirm,
  onDismiss,
}) => {
  const [alwaysSync, setAlwaysSync] = React.useState(false);

  if (!promptData) return null;

  const activityLabels: Record<'reading' | 'notes' | 'revision', string> = {
    reading: 'Reading',
    notes: 'Notes',
    revision: 'Revision',
  };

  const actLabel = activityLabels[promptData.activity] || promptData.activity;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="ncert-sync-title"
    >
      <div
        className="modal-panel overflow-y-auto w-full max-w-md bg-white dark:bg-slate-900 border-2 border-indigo-500/80 dark:border-indigo-400 rounded-2xl shadow-2xl p-4 sm:p-5 space-y-4 animate-in slide-in-from-bottom-5 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <h3
                id="ncert-sync-title"
                className="text-sm sm:text-base font-bold text-slate-900 dark:text-white"
              >
                NCERT Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Synchronize Weekly Task with NCERT Tracker
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 -mr-1 -mt-1 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
            You completed:
          </span>
          <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm leading-snug">
            {promptData.taskTitle}
          </p>
          {promptData.className && promptData.subject && (
            <p className="text-[11px] text-indigo-600 dark:text-indigo-400 font-medium">
              {promptData.className} • {promptData.subject}
            </p>
          )}
        </div>

        <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
          Mark {actLabel} complete in the NCERT tracker?
        </p>

        {/* Optional Auto-Sync Checkbox */}
        <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-slate-600 dark:text-slate-400 pt-1">
          <input
            type="checkbox"
            checked={alwaysSync}
            onChange={(e) => setAlwaysSync(e.target.checked)}
            className="w-4 h-4 rounded text-indigo-600 border-slate-300 dark:border-slate-600 focus:ring-indigo-500 cursor-pointer"
          />
          <span>Always auto-sync completed NCERT weekly tasks</span>
        </label>

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onDismiss}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
          >
            Not Now
          </button>
          <button
            type="button"
            onClick={() => onConfirm(alwaysSync)}
            className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <Check className="w-4 h-4" />
            <span>Yes, Update NCERT</span>
          </button>
        </div>
      </div>
    </div>
  );
};
