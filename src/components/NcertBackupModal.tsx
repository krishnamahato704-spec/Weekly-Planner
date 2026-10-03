import React, { useState } from 'react';
import { X, Download, Upload, RefreshCw, Check, AlertCircle } from 'lucide-react';
import { NcertProgressStore } from '../utils/ncertData';

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
  const [importText, setImportText] = useState('');
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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
      const parsed = JSON.parse(importText);
      const storeToImport: NcertProgressStore = parsed.progress || parsed;
      if (typeof storeToImport !== 'object' || storeToImport === null) {
        throw new Error('Invalid format');
      }
      onImportProgress(storeToImport);
      setImportStatus({ type: 'success', message: 'Progress imported successfully!' });
      setTimeout(() => {
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
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportText(content);
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                NCERT Data Management
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Backup, export, import or reset your NCERT Social Science study records
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Export Section */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between gap-4">
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Export Progress
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Download a JSON backup of all 636 activity checkboxes
              </p>
            </div>
            <button
              type="button"
              onClick={handleExport}
              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Download JSON
            </button>
          </div>

          {/* Import Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Import Progress
              </h4>
              <label className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                Upload .json file
                <input
                  type="file"
                  accept=".json,application/json"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
            <textarea
              rows={3}
              placeholder="Or paste JSON backup string here..."
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            />
            {importStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                  importStatus.type === 'success'
                    ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}
              >
                {importStatus.type === 'success' ? (
                  <Check className="w-4 h-4 shrink-0" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0" />
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
              <h4 className="text-xs font-bold text-rose-600 dark:text-rose-400">
                Danger Zone
              </h4>
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
      </div>
    </div>
  );
};
