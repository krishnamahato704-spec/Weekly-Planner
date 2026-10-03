import { Dialog } from './ui/Dialog';
import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface NcertResetConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmReset: () => void;
}

export const NcertResetConfirmModal: React.FC<NcertResetConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirmReset,
}) => {
  const dialogTitleId = React.useId();
  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={dialogTitleId} className="modal-panel overflow-y-auto w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 ">
      <div className="p-6 space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
          <AlertTriangle aria-hidden="true" className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1.5">
          <h2 id={dialogTitleId} className="text-base font-bold text-slate-900 dark:text-white">
            Reset all NCERT Social Science progress?
          </h2>
          <p className="text-xs text-rose-600 dark:text-rose-400 font-semibold">
            This cannot be undone.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pt-1">
            All 636 activity checkboxes (Reading, Notes, Revision) across Classes 6–12 will be cleared. Your Weekly Planner tasks will <strong>not</strong> be affected.
          </p>
        </div>

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors border border-slate-200 dark:border-slate-700"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmReset();
              onClose();
            }}
            className="px-5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
          >
            Reset
          </button>
        </div>
      </div>
    </Dialog>
  );
};
