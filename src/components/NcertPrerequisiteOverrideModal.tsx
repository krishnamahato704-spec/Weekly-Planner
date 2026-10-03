import React from 'react';
import { AlertTriangle, X, Check, Lock } from 'lucide-react';

interface NcertPrerequisiteOverrideModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterTitle: string;
  activity: 'notes' | 'revision';
  onConfirmOverride: () => void;
}

export const NcertPrerequisiteOverrideModal: React.FC<NcertPrerequisiteOverrideModalProps> = ({
  isOpen,
  onClose,
  chapterTitle,
  activity,
  onConfirmOverride,
}) => {
  if (!isOpen) return null;

  const activityName = activity === 'notes' ? 'Notes' : 'Revision';
  const prerequisiteName = activity === 'notes' ? 'Reading' : 'Reading and Notes';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="override-modal-title"
    >
      <div
        className="modal-panel overflow-y-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/50">
            <Lock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="override-modal-title"
              className="text-base font-bold text-slate-950 dark:text-white"
            >
              Override Prerequisite?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {chapterTitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-300 leading-relaxed space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
            <span>Recommended Learning Sequence</span>
          </p>
          <p>
            <strong>{activityName}</strong> normally comes after{' '}
            <strong>{prerequisiteName}</strong> in the NCERT study workflow.
          </p>
          <p className="text-[11px] text-amber-800/80 dark:text-amber-300/80">
            If you already completed this study work outside the app, you can confirm this override to update your progress.
          </p>
        </div>

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
            onClick={() => {
              onConfirmOverride();
              onClose();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Mark {activityName} Complete Anyway</span>
          </button>
        </div>
      </div>
    </div>
  );
};
