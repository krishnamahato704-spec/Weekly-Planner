import React, { useState } from 'react';
import { Bell, X, Calendar, RotateCcw, Clock, Check, AlertCircle, Sparkles, Settings } from 'lucide-react';
import { ChapterRevisionDueInfo, ReminderPreferences, SpacedRevisionSchedule } from '../types';
import { formatFriendlyDate } from '../utils/studySessionUtils';

interface RevisionReminderCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueRevisions: ChapterRevisionDueInfo[];
  reminderPrefs: ReminderPreferences;
  onSaveReminderPrefs: (prefs: ReminderPreferences) => void;
  schedule: SpacedRevisionSchedule;
  onSaveSchedule: (schedule: SpacedRevisionSchedule) => void;
  onPlanRevision: (info: ChapterRevisionDueInfo) => void;
  onPlanAllRevisions: (dueList: ChapterRevisionDueInfo[]) => void;
}

export const RevisionReminderCenterModal: React.FC<RevisionReminderCenterModalProps> = ({
  isOpen,
  onClose,
  dueRevisions,
  reminderPrefs,
  onSaveReminderPrefs,
  schedule,
  onSaveSchedule,
  onPlanRevision,
  onPlanAllRevisions,
}) => {
  const [activeTab, setActiveTab] = useState<'due' | 'settings'>('due');
  const [localIntervals, setLocalIntervals] = useState<string>(
    schedule.intervalsDays.join(', ')
  );

  if (!isOpen) return null;

  const overdueList = dueRevisions.filter((r) => r.status === 'overdue');
  const dueTodayList = dueRevisions.filter((r) => r.status === 'due_today');
  const upcomingList = dueRevisions.filter((r) => r.status === 'upcoming');

  const handleSaveSchedule = () => {
    const parsed = localIntervals
      .split(',')
      .map((s) => parseInt(s.trim(), 10))
      .filter((n) => !isNaN(n) && n > 0);

    if (parsed.length > 0) {
      onSaveSchedule({ ...schedule, intervalsDays: parsed });
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-panel overflow-y-auto w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-900/50">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
                <span>Spaced Revision Reminders</span>
                {dueRevisions.length > 0 && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full font-bold bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                    {dueRevisions.length} due
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Review memory curve retention for completed NCERT chapters
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

        {/* Tab switch */}
        <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('due')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'due'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Due Chapters ({dueRevisions.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'settings'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Spaced Schedule Settings</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
          {activeTab === 'due' ? (
            dueRevisions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl bg-slate-50/50 dark:bg-slate-900/30">
                <Check className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  All Spaced Revisions Up to Date!
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  When you complete chapter notes, the system automatically schedules smart retention reviews at 1, 3, 7, 14, and 30 day intervals.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Header action bar */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {dueRevisions.length} {dueRevisions.length === 1 ? 'chapter' : 'chapters'} need revision
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onPlanAllRevisions(dueRevisions);
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg transition-colors border border-indigo-200 dark:border-indigo-800"
                  >
                    <Calendar className="w-3 h-3" />
                    <span>Plan All in Weekly</span>
                  </button>
                </div>

                {/* Overdue Items */}
                {overdueList.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>Overdue for Retention ({overdueList.length})</span>
                    </div>
                    {overdueList.map((rev) => (
                      <div
                        key={rev.chapterId}
                        className="p-3.5 rounded-xl border border-rose-200/80 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-[11px] font-semibold text-rose-700 dark:text-rose-300">
                            Class {rev.classNum} • {rev.subject}
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {rev.chapterTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Overdue by {Math.abs(rev.daysRemaining || 1)} days · Rev #{rev.revisionCount + 1}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onPlanRevision(rev);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
                        >
                          Plan Revision
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Due Today Items */}
                {dueTodayList.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      <span>Due Today ({dueTodayList.length})</span>
                    </div>
                    {dueTodayList.map((rev) => (
                      <div
                        key={rev.chapterId}
                        className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                            Class {rev.classNum} • {rev.subject}
                          </div>
                          <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white">
                            {rev.chapterTitle}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                            Scheduled for today · Revision #{rev.revisionCount + 1}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onPlanRevision(rev);
                            onClose();
                          }}
                          className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0"
                        >
                          Plan Revision
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Upcoming Items */}
                {upcomingList.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      Upcoming in Next Few Days ({upcomingList.length})
                    </div>
                    {upcomingList.map((rev) => (
                      <div
                        key={rev.chapterId}
                        className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 flex items-center justify-between gap-3"
                      >
                        <div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            Class {rev.classNum} • {rev.subject}
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white">
                            {rev.chapterTitle}
                          </div>
                          <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">
                            Due in {rev.daysRemaining} days ({rev.nextRevisionDue})
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            onPlanRevision(rev);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                        >
                          Plan Early
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          ) : (
            /* Settings tab */
            <div className="space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Spaced Repetition Intervals (Days)
                </div>
                <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                  Configure days between successive revision cycles. Default: 1, 3, 7, 14, 30 days.
                </p>
                <input
                  type="text"
                  value={localIntervals}
                  onChange={(e) => setLocalIntervals(e.target.value)}
                  placeholder="1, 3, 7, 14, 30"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={handleSaveSchedule}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors"
                >
                  Save Intervals
                </button>
              </div>

              {/* In-app reminder threshold */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="font-semibold text-slate-900 dark:text-white">
                  Reminder Window
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 0, label: 'Today Only' },
                    { value: 3, label: 'Within 3 Days' },
                    { value: 7, label: 'Within 7 Days' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() =>
                        onSaveReminderPrefs({
                          ...reminderPrefs,
                          thresholdDays: opt.value,
                        })
                      }
                      className={`py-2 px-2.5 rounded-lg border text-center font-semibold transition-all ${
                        reminderPrefs.thresholdDays === opt.value
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
