import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  Plus,
  Trash2,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { RevisionEvent } from '../utils/ncertData';

interface NcertRevisionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  bookTitle: string;
  className: string;
  subject: string;
  revisionHistory?: RevisionEvent[];
  onAddRevision: (chapterId: string, notes?: string) => void;
  onRemoveRevision: (chapterId: string, eventId: string) => void;
}

export const NcertRevisionHistoryModal: React.FC<NcertRevisionHistoryModalProps> = ({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  chapterNumber,
  bookTitle,
  className,
  subject,
  revisionHistory = [],
  onAddRevision,
  onRemoveRevision,
}) => {
  const [deleteConfirmEventId, setDeleteConfirmEventId] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalCount = revisionHistory.length;
  // Sort reverse chronological: most recent first
  const sortedHistory = [...revisionHistory].reverse();

  const handleReviseAgain = () => {
    onAddRevision(chapterId);
  };

  const handleConfirmDelete = (eventId: string) => {
    onRemoveRevision(chapterId, eventId);
    setDeleteConfirmEventId(null);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="revision-history-title"
    >
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-white/95 dark:bg-slate-900/95 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded-md border border-teal-200/60 dark:border-teal-900/40">
                Revision History
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {className} · {subject}
              </span>
            </div>
            <h2
              id="revision-history-title"
              className="text-base sm:text-lg font-bold text-slate-950 dark:text-white mt-1 leading-snug"
            >
              Ch {chapterNumber}: {chapterTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {bookTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close revision history dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Top Summary Bar */}
        <div className="px-5 sm:px-6 py-3 bg-slate-50/80 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              Total Revisions:
            </span>
            <span className="text-sm font-bold text-teal-600 dark:text-teal-400 tabular-nums">
              {totalCount} {totalCount === 1 ? 'cycle' : 'cycles'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleReviseAgain}
            className="px-3 py-1.5 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>+ Revise Again</span>
          </button>
        </div>

        {/* Scrollable Events List */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          {totalCount === 0 ? (
            <div className="text-center py-10 text-slate-400">
              <RotateCcw className="w-8 h-8 mx-auto mb-2 opacity-40 text-teal-500" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-300">
                No revision events recorded yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Click "+ Revise Again" or complete a weekly revision task to record your first cycle.
              </p>
            </div>
          ) : (
            sortedHistory.map((rev, idx) => {
              const cycleNumber = totalCount - idx;
              let dateText = 'Previously marked complete';
              let timeText = '';

              if (!rev.legacy && rev.completedAt) {
                try {
                  const d = new Date(rev.completedAt);
                  dateText = d.toLocaleDateString(undefined, {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  });
                  timeText = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                } catch {
                  dateText = rev.completedAt;
                }
              } else if (rev.legacy) {
                dateText = 'Previously marked complete (Legacy record)';
              }

              const isConfirmingDelete = deleteConfirmEventId === rev.id;

              return (
                <div
                  key={rev.id}
                  className="p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 shadow-2xs space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-lg bg-teal-50 dark:bg-teal-950/70 text-teal-700 dark:text-teal-300 text-xs font-bold flex items-center justify-center shrink-0">
                        #{cycleNumber}
                      </span>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        Revision {cycleNumber}
                      </span>
                    </div>

                    {!isConfirmingDelete && (
                      <button
                        type="button"
                        onClick={() => setDeleteConfirmEventId(rev.id)}
                        className="text-[11px] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 font-semibold px-2 py-1 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors flex items-center gap-1"
                        title="Remove revision entry"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Remove</span>
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-8">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{dateText}</span>
                    {timeText && (
                      <>
                        <span aria-hidden="true">·</span>
                        <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{timeText}</span>
                      </>
                    )}
                  </div>

                  {rev.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-300 pl-8 font-medium">
                      {rev.notes}
                    </p>
                  )}

                  {/* Inline Delete Confirmation */}
                  {isConfirmingDelete && (
                    <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-center justify-between gap-2 text-xs">
                      <span className="text-rose-800 dark:text-rose-300 font-medium">
                        Delete this revision record?
                      </span>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmEventId(null)}
                          className="px-2.5 py-1 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(rev.id)}
                          className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[40px]"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
