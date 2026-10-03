import React from 'react';
import { RotateCcw, AlertTriangle, X, Check, Calendar, CheckSquare, GraduationCap } from 'lucide-react';

interface CleanSlateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const CleanSlateModal: React.FC<CleanSlateModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="modal-panel overflow-y-auto bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 border border-rose-200 dark:border-rose-900/40">
              <RotateCcw className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Clean Slate: Delete All Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Start fresh with zero progress, keeping only this week's plan
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Notice Card */}
        <div className="bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-800/40 rounded-xl p-3.5 flex items-start gap-3">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
            <p className="font-semibold mb-1">Clean Slate Policy</p>
            <p>
              This will remove any completed checkboxes, task history, and study progress across the entire workspace.
            </p>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/60 dark:border-slate-800/60 space-y-2">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span>What Remains (Preserved)</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 list-disc list-inside">
              <li>
                <strong className="text-slate-800 dark:text-slate-200">This Week's Plan</strong> (Week of Sunday, Sep 27) with your 9 handwritten notebook tasks.
              </li>
              <li>
                All syllabus curriculums (B.Ed, MA History, CTET, UGC NET, Canva & NCERT Classes 6–12).
              </li>
            </ul>
          </div>

          <div className="p-3 bg-rose-50/50 dark:bg-rose-950/20 rounded-xl border border-rose-200/60 dark:border-rose-900/30 space-y-2">
            <div className="font-semibold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
              <RotateCcw className="w-3.5 h-3.5 text-rose-500" />
              <span>What Gets Reset (0% Progress)</span>
            </div>
            <ul className="space-y-1.5 text-slate-600 dark:text-slate-400 list-disc list-inside">
              <li>All 9 weekly tasks marked <strong>uncompleted</strong> (0% progress).</li>
              <li>All previous demo weeks deleted.</li>
              <li>All <strong>NCERT Social Science</strong> reading, notes, and revision progress reset to 0/636 (0%).</li>
              <li>All <strong>Academic Track</strong> chapters, modules, and School Internship counts reset to 0.</li>
            </ul>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm shadow-rose-500/20 transition-all active:scale-[0.98]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Confirm Clean Slate</span>
          </button>
        </div>
      </div>
    </div>
  );
};
