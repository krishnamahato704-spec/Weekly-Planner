import { Dialog } from './ui/Dialog';
import React, { useState } from 'react';
import { CheckCircle2, Clock, X, Check, Bookmark, Sparkles, BookOpen } from 'lucide-react';
import { ActiveStudySession } from '../types';
import { formatDurationFriendly } from '../utils/studySessionUtils';

interface FinishStudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeSession: ActiveStudySession;
  elapsedSeconds: number;
  onSaveSession: (options: {
    markTaskComplete: boolean;
    sessionNotes?: string;
  }) => void;
}

export const FinishStudySessionModal: React.FC<FinishStudySessionModalProps> = ({
  isOpen,
  onClose,
  activeSession,
  elapsedSeconds,
  onSaveSession,
}) => {
  const fieldId = React.useId();
  const dialogTitleId = React.useId();
  const [sessionNotes, setSessionNotes] = useState('');

  if (!isOpen) return null;

  const minutesStudied = Math.max(1, Math.round(elapsedSeconds / 60));
  const friendlyTime = formatDurationFriendly(elapsedSeconds);

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={dialogTitleId} className="modal-panel overflow-y-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-200 dark:border-emerald-900/50">
            <CheckCircle2 aria-hidden="true" className="w-5 h-5 stroke-[2.5]" />
          </div>
          <div>
            <h2
              id={dialogTitleId}
              className="text-base sm:text-lg font-bold text-slate-950 dark:text-white"
            >
              Study Session Complete
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Great job staying focused!
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          aria-label="Close dialog"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>

      {/* Task Info & Time studied */}
      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-800/60 space-y-2">
        <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 uppercase tracking-wider">
          {activeSession.category || 'Study Task'}
          {activeSession.ncertRef && ` • Class ${activeSession.ncertRef.classNum} • ${activeSession.ncertRef.subject}`}
        </div>
        <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
          {activeSession.taskTitle}
        </p>
        <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-xs">
          <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <Clock aria-hidden="true" className="w-3.5 h-3.5 text-indigo-500" />
            <span>Time studied:</span>
          </span>
          <span className="font-bold text-sm text-slate-900 dark:text-white tabular-nums">
            {friendlyTime} ({minutesStudied} min)
          </span>
        </div>
      </div>

      {/* Session reflection notes (optional) */}
      <div>
        <label htmlFor={`${fieldId}-field-1`} className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
          Session Notes (Optional)
        </label>
        <textarea id={`${fieldId}-field-1`}
          rows={2}
          value={sessionNotes}
          onChange={(e) => setSessionNotes(e.target.value)}
          placeholder="Key concepts covered, questions for teacher, pages read..."
          className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
        />
      </div>

      {/* Action Buttons: Mark Task Complete vs Save Session Only */}
      <div className="space-y-2 pt-1">
        <button
          type="button"
          onClick={() => onSaveSession({ markTaskComplete: true, sessionNotes: sessionNotes.trim() || undefined })}
          className="w-full py-2.5 px-4 text-xs sm:text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 min-h-[44px]"
        >
          <Check aria-hidden="true" className="w-4 h-4 stroke-[3]" />
          <span>Mark Task Complete & Save Session</span>
        </button>

        <button
          type="button"
          onClick={() => onSaveSession({ markTaskComplete: false, sessionNotes: sessionNotes.trim() || undefined })}
          className="w-full py-2 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
        >
          <Bookmark aria-hidden="true" className="w-3.5 h-3.5 text-slate-400" />
          <span>Save Session Only (Leave Task Incomplete)</span>
        </button>
      </div>
    </Dialog>
  );
};
