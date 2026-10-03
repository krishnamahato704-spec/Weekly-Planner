import { Dialog } from './ui/Dialog';
import React, { useEffect, useState } from 'react';
import { X, Download, Upload, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { NcertProgressStore } from '../utils/ncertData';
import { useTimeout } from '../hooks/useTimeout';
import { MAX_BACKUP_BYTES, parseBoundedJson, validateNcertProgress } from '../utils/dataValidation';
import { useRef } from 'react';

interface NcertBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  progressStore: NcertProgressStore;
  onImportProgress: (importedStore: NcertProgressStore) => void;
  onOpenResetConfirm: () => void;
}

export const NcertBackupModal: React.FC<NcertBackupModalProps> = ({
  isOpen,
  onClose,
  progressStore,
  onImportProgress,
  onOpenResetConfirm,
}) => {
  const fieldId = React.useId();
  const dialogTitleId = React.useId();
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const { schedule, cancel } = useTimeout();
  const readerRef = useRef<FileReader | null>(null);
  useEffect(() => () => readerRef.current?.abort(), []);
  useEffect(() => {
    if (!isOpen) cancel();
  }, [isOpen, cancel]);

  if (!isOpen) return null;

  const handleExport = () => {
    const payload = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      type: 'ncert_social_science_progress',
      progress: progressStore,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ncert_social_science_progress_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    try {
      if (!importText.trim()) {
        setImportStatus({ type: 'error', message: 'Please paste JSON data or choose a file.' });
        return;
      }
      const parsed = parseBoundedJson(importText) as { progress?: unknown } | null;
      const storeToImport = validateNcertProgress(parsed?.progress ?? parsed);
      onImportProgress(storeToImport);
      setImportStatus({ type: 'success', message: 'Progress imported successfully!' });
      schedule(() => {
        onClose();
        setImportStatus(null);
        setImportText('');
      }, 1200);
    } catch {
      setImportStatus({
        type: 'error',
        message: 'Invalid JSON file format. Please check and try again.',
      });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    readerRef.current?.abort();
    if (file.size > MAX_BACKUP_BYTES) { setImportStatus({ type: 'error', message: 'Choose a JSON backup smaller than 10 MiB.' }); return; }
    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.onerror = () => setImportStatus({ type: 'error', message: 'The backup could not be read. Choose the file again.' });
    reader.readAsText(file);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={dialogTitleId} className="modal-panel overflow-y-auto w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 ">
      <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold">
            <RefreshCw aria-hidden="true" className="w-4 h-4" />
          </div>
          <div>
            <h2 id={dialogTitleId} className="text-base font-bold text-slate-900 dark:text-white">
              NCERT Data Management
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Backup, export, import or reset your NCERT Social Science study records
            </p>
          </div>
        </div>
        <button aria-label="Close dialog"
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <X aria-hidden="true" className="w-4 h-4" />
        </button>
      </div>

      <div className="p-6 space-y-6">
        {/* Export Section */}
        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Download aria-hidden="true" className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
              Export Progress
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              Download a JSON backup of all 636 activity checkboxes
            </p>
          </div>
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
          >
            <Download aria-hidden="true" className="w-3.5 h-3.5" />
            Download JSON
          </button>
        </div>

        {/* Import Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Upload aria-hidden="true" className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-300" />
              Import Progress
            </h3>
            <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-300 hover:underline cursor-pointer">
              Upload .json file
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={handleFileUpload}
              />
            </label>
          </div>
          <><label className="sr-only" htmlFor={`${fieldId}-field-1`}>Or paste JSON backup string here</label><textarea id={`${fieldId}-field-1`} rows={3} placeholder="Or paste JSON backup string here..." value={importText} onChange={(e) => setImportText(e.target.value)} className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20" maxLength={10485760}/></>
          {importStatus && (
            <div
              className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                importStatus.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                  : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
              }`}
            >
              {importStatus.type === 'success' ? (
                <Check aria-hidden="true" className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
              )}
              <span>{importStatus.message}</span>
            </div>
          )}
          <button
            type="button"
            onClick={handleImport}
            disabled={!importText.trim()}
            className="w-full py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-indigo-600 dark:hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition-colors shadow-xs"
          >
            Restore Progress from Backup
          </button>
        </div>

        {/* Reset Section */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-xs font-bold text-rose-600 dark:text-rose-400">
              Danger Zone
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Clear all NCERT checkboxes (does not affect Weekly Planner)
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenResetConfirm();
            }}
            className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-lg transition-colors"
          >
            Reset NCERT Progress
          </button>
        </div>
      </div>
    </Dialog>
  );
};
