import { Dialog } from './ui/Dialog';
import React from 'react';
import { AlertCircle, Clock, X, ArrowRight, Play, Square } from 'lucide-react';
import { ActiveStudySession } from '../types';
import { calculateActiveElapsedSeconds, formatDurationHMS } from '../utils/studySessionUtils';

interface ActiveSessionConflictModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: ActiveStudySession;
  newTaskTitle: string;
  onContinueCurrent: () => void;
  onFinishCurrentAndStartNew: () => void;
}

export const ActiveSessionConflictModal: React.FC<ActiveSessionConflictModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  newTaskTitle,
  onContinueCurrent,
  onFinishCurrentAndStartNew,
}) => {
  const dialogTitleId = React.useId();
  if (!isOpen) return null;

  const elapsed = calculateActiveElapsedSeconds(activeSession);
  const formattedTime = formatDurationHMS(elapsed);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={dialogTitleId} className="modal-panel overflow-y-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 border border-amber-200 dark:border-amber-900/50">
          <AlertCircle aria-hidden="true" className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 id={dialogTitleId} className="text-base font-bold text-slate-950 dark:text-white">
            Active Study Session in Progress
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            You already have a study timer running
          </p>
        </div>
        <button aria-label="Close dialog"
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>

      {/* Current running session card */}
      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-xs">
        <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
          <span>Currently studying:</span>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formattedTime}
          </span>
        </div>
        <div className="font-bold text-sm text-slate-900 dark:text-white truncate">
          {activeSession.taskTitle}
        </div>
      </div>

      {/* Target new task */}
      <div className="text-xs text-slate-600 dark:text-slate-300">
        You attempted to start: <strong className="text-slate-900 dark:text-white">{newTaskTitle}</strong>.
        Would you like to finish the current session first or continue focusing on it?
      </div>

      {/* Action Choices */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onContinueCurrent}
          className="w-full py-2.5 px-4 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Play aria-hidden="true" className="w-3.5 h-3.5 fill-white" />
          <span>Continue Current Session</span>
        </button>

        <button
          type="button"
          onClick={onFinishCurrentAndStartNew}
          className="w-full py-2 px-4 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <Square aria-hidden="true" className="w-3.5 h-3.5" />
          <span>Finish Current & Start New</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-center"
        >
          Cancel
        </button>
      </div>
    </Dialog>
  );
};
