import { Dialog } from './ui/Dialog';
import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Plus,
  BookOpen,
  CheckSquare,
  Sparkles,
  AlertTriangle,
  ExternalLink,
  CheckCircle2,
  Clock,
  Lock
} from 'lucide-react';
import { Priority, Task } from '../types';
import { NcertFlatChapter, NcertProgressStore, isChapterComplete } from '../utils/ncertData';

interface NcertAddToWeeklyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapter: NcertFlatChapter | null;
  initialActivity?: 'reading' | 'notes' | 'revision';
  progressStore?: NcertProgressStore;
  activeWeekTitle: string;
  activeWeekTasks?: Task[];
  onConfirmAdd: (data: {
    title: string;
    category: string;
    priority: Priority;
    notes?: string;
    source?: 'ncert';
    scheduledDate?: string;
    startTime?: string;
    estimatedMinutes?: number;
    ncertRef: {
      classNum: number;
      subject: string;
      bookTitle: string;
      bookId?: string;
      chapterId: string;
      chapterTitle: string;
      activity: 'reading' | 'notes' | 'revision';
    };
  }) => void;
  onViewExistingTask?: (taskId: string) => void;
}

export const NcertAddToWeeklyPlanModal: React.FC<NcertAddToWeeklyPlanModalProps> = ({
  isOpen,
  onClose,
  chapter,
  initialActivity,
  progressStore = {},
  activeWeekTitle,
  activeWeekTasks = [],
  onConfirmAdd,
  onViewExistingTask,
}) => {
  const fieldId = React.useId();
  const dialogTitleId = React.useId();
  const [selectedActivity, setSelectedActivity] = useState<'reading' | 'notes' | 'revision'>('reading');
  const [priority, setPriority] = useState<Priority>('High');
  const [customNotes, setCustomNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [durationPreset, setDurationPreset] = useState<number | 'custom' | null>(45);
  const [customMinutes, setCustomMinutes] = useState('');

  // Compute smart default activity when opened
  useEffect(() => {
    if (!chapter) return;

    if (initialActivity) {
      setSelectedActivity(initialActivity);
      return;
    }

    const p = progressStore[chapter.id];
    if (!p || !p.reading) {
      setSelectedActivity('reading');
    } else if (!p.notes) {
      setSelectedActivity('notes');
    } else {
      setSelectedActivity('revision');
    }
  }, [isOpen, chapter, initialActivity, progressStore]);

  if (!isOpen || !chapter) return null;

  const p = progressStore[chapter.id];
  const allStagesDone = isChapterComplete(p);

  // Prerequisite check for planning (P1.2)
  const isNotesPrereqMissing = selectedActivity === 'notes' && !p?.reading;
  const isRevisionPrereqMissing = selectedActivity === 'revision' && (!p?.reading || !p?.notes);

  const activityLabels: Record<'reading' | 'notes' | 'revision', string> = {
    reading: 'Reading',
    notes: 'Notes',
    revision: 'Revision',
  };

  const activityIcons: Record<'reading' | 'notes' | 'revision', string> = {
    reading: '📖',
    notes: '✍️',
    revision: '🔄',
  };

  const formattedTaskTitle = `${chapter.title} — ${activityLabels[selectedActivity]}`;
  const metadataSubtitle = `NCERT • Class ${chapter.classNum} • ${chapter.subject}`;

  const existingIncompleteTask = activeWeekTasks.find(
    (t) =>
      !t.completed &&
      t.ncertRef?.chapterId === chapter.id &&
      t.ncertRef?.activity === selectedActivity
  );

  const DURATION_PRESETS = [15, 20, 30, 45, 60, 90];

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    let finalMinutes: number | undefined;
    if (durationPreset === 'custom') {
      const parsed = parseInt(customMinutes, 10);
      if (!isNaN(parsed) && parsed > 0) finalMinutes = parsed;
    } else if (typeof durationPreset === 'number') {
      finalMinutes = durationPreset;
    }

    onConfirmAdd({
      title: formattedTaskTitle,
      category: 'NCERT Social Science',
      priority,
      notes: customNotes.trim() ? customNotes.trim() : `Book: ${chapter.bookTitle} (Ch ${chapter.chapterNumber})`,
      source: 'ncert',
      scheduledDate: scheduledDate || undefined,
      startTime: startTime || undefined,
      estimatedMinutes: finalMinutes,
      ncertRef: {
        classNum: chapter.classNum,
        subject: chapter.subject,
        bookTitle: chapter.bookTitle,
        bookId: chapter.bookId,
        chapterId: chapter.id,
        chapterTitle: chapter.title,
        activity: selectedActivity,
      },
    });
    onClose();
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={dialogTitleId} className="modal-panel overflow-y-auto w-full sm:max-w-lg bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-y-auto">
      {/* Header */}
      <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs z-10">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold shrink-0">
            <Plus aria-hidden="true" className="w-4 h-4" />
          </div>
          <div>
            <h2
              id={dialogTitleId}
              className="text-base font-bold text-slate-900 dark:text-white"
            >
              Plan NCERT Task
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Schedule study target into <span className="font-semibold text-slate-700 dark:text-slate-300">{activeWeekTitle}</span>
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          aria-label="Close dialog"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>

      {/* Content Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
        {/* Chapter Context Display */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300">
              {chapter.className}
            </span>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-slate-200/80 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {chapter.subject}
            </span>
            {allStagesDone && (
              <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                <CheckCircle2 aria-hidden="true" className="w-3 h-3" />
                100% Complete in Tracker
              </span>
            )}
          </div>

          <div className="pt-0.5">
            <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
              <BookOpen aria-hidden="true" className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="truncate">{chapter.bookTitle}</span>
            </span>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white mt-0.5 leading-snug">
              Chapter {chapter.chapterNumber}: {chapter.title}
            </h3>
          </div>
        </div>

        {/* Activity Selection: What do you want to work on? */}
        <div>
          <label className="block text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
            What do you want to work on?
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {(['reading', 'notes', 'revision'] as const).map((act) => {
              const isSelected = selectedActivity === act;
              const isStageFinished = p ? p[act] : false;

              return (
                <button
                  key={act}
                  type="button"
                  onClick={() => setSelectedActivity(act)}
                  className={`p-3 rounded-xl border text-left sm:text-center transition-all flex sm:flex-col items-center justify-between sm:justify-center gap-2 min-h-[48px] ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold ring-2 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium'
                  }`}
                >
                  <div className="flex items-center sm:flex-col gap-2 sm:gap-1">
                    <span className="text-xl sm:text-2xl">{activityIcons[act]}</span>
                    <span className="text-xs sm:text-sm font-semibold">{activityLabels[act]}</span>
                  </div>

                  {isStageFinished ? (
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md">
                      Done in NCERT
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 dark:text-slate-400">
                      Pending
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Prerequisite Sequence Warning (P1.2) */}
        {(isNotesPrereqMissing || isRevisionPrereqMissing) && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-300 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertTriangle aria-hidden="true" className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>Prerequisite Sequence Warning</span>
            </div>
            <p>
              {isNotesPrereqMissing
                ? 'Reading is not yet marked complete for this chapter. Normally Notes comes after Reading.'
                : 'Reading & Notes are not yet completed for this chapter. Normally Revision comes after Notes.'}
            </p>
            <p className="text-[11px] text-amber-800/80 dark:text-amber-400/80">
              You may still schedule this task now if you are already ahead.
            </p>
          </div>
        )}

        {/* Task Preview Card */}
        <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-1">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-500 dark:text-slate-400">
            Task Preview (Will appear in Weekly Planner)
          </div>
          <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-300">
            {metadataSubtitle}
          </div>
          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
            {formattedTaskTitle}
          </div>
          {(startTime || durationPreset) && (
            <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-1">
              <Clock aria-hidden="true" className="w-3 h-3 text-indigo-500" />
              <span>
                {startTime && `${startTime} · `}
                {durationPreset === 'custom' ? `${customMinutes || '...'} min` : durationPreset ? `${durationPreset} min` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Scheduling: Date, Time, Duration (P1.1) */}
        <div className="p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Clock aria-hidden="true" className="w-3.5 h-3.5 text-indigo-500" />
              <span>Schedule & Duration (Optional)</span>
            </span>
            {(scheduledDate || startTime || durationPreset !== 45) && (
              <button
                type="button"
                onClick={() => {
                  setScheduledDate('');
                  setStartTime('');
                  setDurationPreset(null);
                  setCustomMinutes('');
                }}
                className="text-[11px] text-slate-400 hover:text-rose-500 font-medium"
              >
                Clear Schedule
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor={`${fieldId}-field-1`} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Scheduled Date / Day
              </label>
              <input id={`${fieldId}-field-1`}
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>

            <div>
              <label htmlFor={`${fieldId}-field-2`} className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                Start Time
              </label>
              <input id={`${fieldId}-field-2`}
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
          </div>

          {/* Duration choices */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1.5">
              Estimated Duration
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {DURATION_PRESETS.map((m) => (
                <button aria-pressed={durationPreset === m}
                  key={m}
                  type="button"
                  onClick={() => {
                    setDurationPreset(m);
                    setCustomMinutes('');
                  }}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                    durationPreset === m
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 font-bold'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                  }`}
                >
                  {m} min
                </button>
              ))}
              <button aria-pressed={durationPreset === 'custom'}
                type="button"
                onClick={() => setDurationPreset('custom')}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg border transition-colors ${
                  durationPreset === 'custom'
                    ? 'bg-indigo-50 border-indigo-300 text-indigo-700 dark:bg-indigo-950/60 dark:border-indigo-800 dark:text-indigo-300 font-bold'
                    : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                }`}
              >
                Custom
              </button>
            </div>

            {durationPreset === 'custom' && (
              <div className="mt-2 flex items-center gap-2">
                <><label className="sr-only" htmlFor={`${fieldId}-field-3`}>Duration in minutes</label><input id={`${fieldId}-field-3`}
                  type="number"
                  min="1"
                  max="600"
                  placeholder="e.g. 40"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-28 px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                /></>
                <span className="text-xs text-slate-500 dark:text-slate-400">minutes</span>
              </div>
            )}
          </div>
        </div>

        {/* Duplicate Protection Warning */}
        {existingIncompleteTask && (
          <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800/60 space-y-2">
            <div className="flex items-start gap-2.5">
              <AlertTriangle aria-hidden="true" className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900 dark:text-amber-200 leading-snug">
                <span className="font-bold">
                  This {activityLabels[selectedActivity]} task is already in your Weekly Plan.
                </span>
                <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                  "{existingIncompleteTask.title}" is currently pending in {activeWeekTitle}.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              {onViewExistingTask && (
                <button
                  type="button"
                  onClick={() => {
                    onViewExistingTask(existingIncompleteTask.id);
                    onClose();
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-amber-950 dark:text-amber-100 bg-amber-200/80 dark:bg-amber-800/60 hover:bg-amber-300 rounded-lg transition-colors flex items-center gap-1"
                >
                  <ExternalLink aria-hidden="true" className="w-3 h-3" />
                  <span>View Existing Task</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => handleSubmit()}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white underline transition-colors"
              >
                Add Anyway
              </button>
            </div>
          </div>
        )}

        {/* Priority & Target Week */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label htmlFor={`${fieldId}-field-4`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Priority
            </label>
            <select id={`${fieldId}-field-4`}
              value={priority}
              onChange={(e) => setPriority(e.target.value as Priority)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
            >
              <option value="High">🔴 High Priority</option>
              <option value="Medium">🟡 Medium Priority</option>
              <option value="Low">🟢 Low Priority</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Week
            </label>
            <div className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 flex items-center gap-1.5 truncate min-h-[44px]">
              <Calendar aria-hidden="true" className="w-3.5 h-3.5 shrink-0 text-slate-400" />
              <span className="truncate">{activeWeekTitle}</span>
            </div>
          </div>
        </div>

        {/* Optional Custom Notes */}
        <div>
          <label htmlFor={`${fieldId}-field-5`} className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Optional Study Notes / Target Day
          </label>
          <input id={`${fieldId}-field-5`}
            type="text"
            placeholder="e.g., Target: Wednesday evening · Chapter summary & diagrams"
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[44px]"
          />
        </div>

        {/* Action Buttons */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] flex items-center justify-center"
          >
            Cancel
          </button>

          {!existingIncompleteTask && (
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 min-h-[44px]"
            >
              <CheckSquare aria-hidden="true" className="w-4 h-4" />
              <span>Add to Weekly Plan</span>
            </button>
          )}
        </div>
      </form>
    </Dialog>
  );
};
