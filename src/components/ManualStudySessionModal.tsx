import React, { useState } from 'react';
import { Plus, X, Clock, Calendar, Check } from 'lucide-react';
import { Task } from '../types';
import { getTodayDateString } from '../utils/studySessionUtils';

interface ManualStudySessionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  onSaveManualSession: (data: {
    taskTitle: string;
    taskId?: string;
    date: string;
    startTime?: string;
    durationMinutes: number;
    notes?: string;
  }) => void;
}

export const ManualStudySessionModal: React.FC<ManualStudySessionModalProps> = ({
  isOpen,
  onClose,
  tasks,
  onSaveManualSession,
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>(tasks[0]?.id || 'custom');
  const [customTaskTitle, setCustomTaskTitle] = useState('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [startTime, setStartTime] = useState('');
  const [durationPreset, setDurationPreset] = useState<number | 'custom'>(45);
  const [customMinutes, setCustomMinutes] = useState('');
  const [notes, setNotes] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let durationMinutes = 45;
    if (durationPreset === 'custom') {
      const parsed = parseInt(customMinutes, 10);
      if (!isNaN(parsed) && parsed > 0) durationMinutes = parsed;
    } else {
      durationMinutes = durationPreset;
    }

    let finalTitle = customTaskTitle.trim();
    let finalTaskId: string | undefined = undefined;

    if (selectedTaskId !== 'custom') {
      const matched = tasks.find((t) => t.id === selectedTaskId);
      if (matched) {
        finalTitle = matched.title;
        finalTaskId = matched.id;
      }
    }

    if (!finalTitle) {
      finalTitle = 'Study Session';
    }

    onSaveManualSession({
      taskTitle: finalTitle,
      taskId: finalTaskId,
      date: date || getTodayDateString(),
      startTime: startTime || undefined,
      durationMinutes,
      notes: notes.trim() || undefined,
    });

    onClose();
  };

  const DURATION_PRESETS = [15, 30, 45, 60, 90, 120];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-panel overflow-y-auto w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Log Study Session Manually
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record study time completed outside the digital timer
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Task Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Associated Task
            </label>
            <select
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
            >
              <option value="custom">-- Custom Study Work --</option>
              {tasks.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.title} ({t.category})
                </option>
              ))}
            </select>

            {selectedTaskId === 'custom' && (
              <input
                type="text"
                required
                placeholder="Enter study topic / subject..."
                value={customTaskTitle}
                onChange={(e) => setCustomTaskTitle(e.target.value)}
                className="mt-2 w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            )}
          </div>

          {/* Date & Start Time */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Date Completed
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                Start Time (Optional)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
          </div>

          {/* Duration Chips */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Duration Studied
            </label>
            <div className="flex flex-wrap items-center gap-1.5">
              {DURATION_PRESETS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => {
                    setDurationPreset(m);
                    setCustomMinutes('');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    durationPreset === m
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                  }`}
                >
                  {m >= 60 ? `${m / 60} hr${m > 60 ? ` ${m % 60}m` : ''}` : `${m} min`}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setDurationPreset('custom')}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  durationPreset === 'custom'
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-xs'
                    : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                Custom
              </button>
            </div>

            {durationPreset === 'custom' && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1440"
                  required
                  placeholder="Minutes"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  className="w-32 px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">minutes</span>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
              Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What did you accomplish in this session?"
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
          </div>

          {/* Footer buttons */}
          <div className="flex flex-wrap items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[44px]"
            >
              <Check className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Log Study Session</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
