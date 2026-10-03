import React from 'react';
import { X, BookOpen, Check, ArrowDownToLine, Sparkles } from 'lucide-react';
import { HANDWRITTEN_NOTEBOOK_TASKS } from '../utils/sampleData';

interface NotebookReferenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportTasks: (tasks: typeof HANDWRITTEN_NOTEBOOK_TASKS) => void;
  activeWeekTitle: string;
}

export const NotebookReferenceModal: React.FC<NotebookReferenceModalProps> = ({
  isOpen,
  onClose,
  onImportTasks,
  activeWeekTitle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="modal-panel overflow-y-auto w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl flex flex-col ">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Handwritten Notebook Plan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transcription: Weekly Tasks (1st Week → Till 3 October)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
            <div>
              <p className="font-semibold mb-0.5">Matched from your handwritten notebook:</p>
              <p className="text-amber-800 dark:text-amber-300">
                Header text: <em>"Sunday's Tasks | 1st Week → Till 3 October"</em>. Each task below has been categorized, prioritized, and formatted with clean sub-notes.
              </p>
            </div>
          </div>

          <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden bg-neutral-50/50 dark:bg-neutral-900/50">
            {HANDWRITTEN_NOTEBOOK_TASKS.map((item, idx) => (
              <div key={idx} className="p-3.5 flex flex-col sm:flex-row items-start justify-between gap-3 hover:bg-white dark:hover:bg-neutral-800/40 transition-colors">
                <div className="flex items-start gap-3">
                  <span className="text-xs font-mono text-neutral-400 mt-0.5 tabular-nums">
                    0{idx + 1}.
                  </span>
                  <div>
                    <h4 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      {item.notes}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 text-right">
                  <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                    {item.category}
                  </span>
                  <span className="text-neutral-300 dark:text-neutral-600">·</span>
                  <span
                    className={`text-xs font-semibold ${
                      item.priority === 'High'
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {item.priority}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0 bg-neutral-50 dark:bg-neutral-900">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Target: <strong>{activeWeekTitle}</strong>
          </span>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onImportTasks(HANDWRITTEN_NOTEBOOK_TASKS);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/20 transition-all"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
              <span>Import to Active Week</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
