import React, { useState } from 'react';
import {
  Download,
  Upload,
  RotateCcw,
  Check,
  AlertTriangle,
  X,
  Shield,
  FileCode,
  Calendar,
  Layers,
  Clock,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { WeekPlan, ProgramTab, StudySession, StudyGoals, DailyCapacityConfig, SpacedRevisionSchedule, ReminderPreferences, GoogleCalendarIntegrationConfig } from '../types';
import { NcertProgressStore, ChapterNotesStore, RevisionHistoryStore } from '../utils/ncertData';

export interface FullBackupData {
  weeks: WeekPlan[];
  activeWeekId: string;
  programs: ProgramTab[];
  ncertProgress: NcertProgressStore;
  ncertNotes?: ChapterNotesStore;
  ncertRevisionHistory?: RevisionHistoryStore;
  studySessions?: StudySession[];
  goals?: StudyGoals;
  dailyCapacity?: DailyCapacityConfig;
  revisionSchedule?: SpacedRevisionSchedule;
  reminderPreferences?: ReminderPreferences;
  calendarConfig?: GoogleCalendarIntegrationConfig;
  preferences?: {
    isDarkMode?: boolean;
    autoSyncNcert?: boolean;
  };
}

interface UnifiedBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentData: FullBackupData;
  onImportFullBackup: (importedData: FullBackupData, mode: 'replace' | 'merge') => void;
  onResetWeeklyTasks: () => void;
  onResetNcertProgress: () => void;
  onResetStudyHistory: () => void;
  onResetEntirePlanner: () => void;
  onShowToast: (msg: string) => void;
}

export const UnifiedBackupModal: React.FC<UnifiedBackupModalProps> = ({
  isOpen,
  onClose,
  currentData,
  onImportFullBackup,
  onResetWeeklyTasks,
  onResetNcertProgress,
  onResetStudyHistory,
  onResetEntirePlanner,
  onShowToast,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import' | 'reset'>('export');
  const [importJsonText, setImportJsonText] = useState('');
  const [parsedImport, setParsedImport] = useState<{
    data: FullBackupData;
    summary: string;
  } | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  // Safety confirmation for Clean Slate
  const [resetType, setResetType] = useState<'weekly' | 'ncert' | 'study' | 'entire' | null>(null);
  const [resetConfirmationText, setResetConfirmationText] = useState('');

  if (!isOpen) return null;

  const downloadSafetyBackup = () => {
    const payload = {
      app: 'WeeklyPlan',
      backupVersion: 5,
      exportedAt: new Date().toISOString(),
      type: 'unified_full_backup',
      data: currentData,
    };
    const jsonStr = JSON.stringify(payload, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weeklyplan_safety_backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportFull = () => {
    downloadSafetyBackup();
    onShowToast('Full planner backup downloaded successfully!');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setImportJsonText(content);
      validateAndParse(content);
    };
    reader.readAsText(file);
  };

  const validateAndParse = (rawText: string) => {
    setImportError(null);
    setParsedImport(null);
    if (!rawText.trim()) return;

    try {
      const parsed = JSON.parse(rawText);

      // Handle standard Unified Backup (v4/v5)
      if (parsed.app === 'WeeklyPlan' && parsed.data) {
        const d = parsed.data as FullBackupData;
        const weeksCount = d.weeks?.length || 0;
        const tasksCount = d.weeks?.reduce((acc, w) => acc + (w.tasks?.length || 0), 0) || 0;
        const ncertChaptersWithProg = Object.keys(d.ncertProgress || {}).length;
        const sessionsCount = d.studySessions?.length || 0;

        setParsedImport({
          data: d,
          summary: `${weeksCount} weeks (${tasksCount} tasks), ${ncertChaptersWithProg} NCERT progress records, ${sessionsCount} study sessions.`,
        });
        return;
      }

      // Handle legacy NCERT-only backup
      if (parsed.type === 'ncert_social_science_progress' && parsed.progress) {
        const legacyNcertStore = parsed.progress;
        const merged: FullBackupData = {
          ...currentData,
          ncertProgress: legacyNcertStore,
        };
        setParsedImport({
          data: merged,
          summary: `Legacy NCERT backup with ${Object.keys(legacyNcertStore).length} chapter progress records.`,
        });
        return;
      }

      // Handle raw object with ncertProgress or weeks
      if (parsed.weeks || parsed.ncertProgress) {
        const merged: FullBackupData = {
          ...currentData,
          ...(parsed.weeks ? { weeks: parsed.weeks } : {}),
          ...(parsed.ncertProgress ? { ncertProgress: parsed.ncertProgress } : {}),
        };
        setParsedImport({
          data: merged,
          summary: `Partial backup payload recognized.`,
        });
        return;
      }

      throw new Error('Unsupported backup format. File must be a valid WeeklyPlan backup JSON.');
    } catch (err: any) {
      setImportError(err.message || 'Invalid JSON file.');
    }
  };

  const handleExecuteImport = (mode: 'replace' | 'merge') => {
    if (!parsedImport) return;

    // Safety backup first before destructive action (P2.5)
    downloadSafetyBackup();

    onImportFullBackup(parsedImport.data, mode);
    onShowToast(`Planner restored successfully (${mode === 'replace' ? 'Full Replace' : 'Merged'})!`);
    onClose();
  };

  const handleConfirmReset = () => {
    if (!resetType) return;

    // Download safety backup before any reset
    downloadSafetyBackup();

    if (resetType === 'weekly') {
      onResetWeeklyTasks();
      onShowToast('Weekly tasks reset.');
    } else if (resetType === 'ncert') {
      onResetNcertProgress();
      onShowToast('NCERT progress reset.');
    } else if (resetType === 'study') {
      onResetStudyHistory();
      onShowToast('Study history cleared.');
    } else if (resetType === 'entire') {
      if (resetConfirmationText.trim().toUpperCase() !== 'RESET') {
        alert('Please type RESET to confirm.');
        return;
      }
      onResetEntirePlanner();
      onShowToast('Planner reset to pristine clean slate.');
    }

    setResetType(null);
    setResetConfirmationText('');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="modal-panel overflow-y-auto w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 space-y-4 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-200 dark:border-indigo-900/50">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white">
                Data & Unified Backup Center
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Export, restore, or manage your complete planner database
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
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 text-xs font-semibold shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Full Backup</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('import')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'import'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Restore / Import</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reset')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
              activeTab === 'reset'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-rose-600'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Options</span>
          </button>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 pr-1">
          {/* TAB 1: EXPORT */}
          {activeTab === 'export' && (
            <div className="space-y-4 text-xs">
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <Check className="w-4 h-4 text-emerald-500" />
                  <span>Everything Included in Full Planner Backup (Version 5)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Weekly tasks, dates, times, durations</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                    <span>NCERT reading, notes text, links & resources</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <RotateCcw className="w-3.5 h-3.5 text-teal-500" />
                    <span>Revision History & spaced repetition schedule</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>Study session logs & tracked minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Academic syllabus tracks & milestones</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Weekly study goals & daily capacity preferences</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300">
                  Zero secrets policy: Never includes passwords, API keys, or private auth credentials.
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleExportFull}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-2 min-h-[44px]"
                >
                  <Download className="w-4 h-4 stroke-[2.5]" />
                  <span>Export Full Planner Backup (.json)</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT / RESTORE */}
          {activeTab === 'import' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                <label className="block font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                  Select Backup File or Paste JSON
                </label>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 dark:file:bg-indigo-950/60 dark:file:text-indigo-300"
                />
              </div>

              <textarea
                rows={4}
                value={importJsonText}
                onChange={(e) => {
                  setImportJsonText(e.target.value);
                  validateAndParse(e.target.value);
                }}
                placeholder="Or paste backup JSON content here..."
                className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />

              {importError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{importError}</span>
                </div>
              )}

              {parsedImport && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-xs space-y-2">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-emerald-600" />
                    <span>Backup Validated Successfully</span>
                  </div>
                  <p className="text-emerald-800 dark:text-emerald-300">{parsedImport.summary}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                    A safety backup of your existing data will be downloaded automatically before restoring.
                  </p>

                  <div className="flex items-center gap-2.5 pt-2">
                    <button
                      type="button"
                      onClick={() => handleExecuteImport('replace')}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
                    >
                      Replace Current Data
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExecuteImport('merge')}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-300 dark:border-slate-600 transition-colors"
                    >
                      Merge with Current Data
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SAFE SEPARATE RESETS */}
          {activeTab === 'reset' && (
            <div className="space-y-4 text-xs">
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200 space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  <span>Individual & Granular Reset Actions</span>
                </p>
                <p className="text-[11px] text-amber-800 dark:text-amber-300">
                  Each action resets ONLY the specified subsystem. An automatic safety backup will be generated.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Reset Weekly Tasks */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Reset Weekly Tasks</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Unchecks all weekly tasks and sets current week progress to 0%. Keeps NCERT records.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetType('weekly');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/40 transition-colors shrink-0"
                  >
                    Reset Weekly Tasks
                  </button>
                </div>

                {/* 2. Reset NCERT Progress */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Reset NCERT Progress Only</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Resets reading, notes, and revisions across NCERT to 0/636. Preserves weekly tasks.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetType('ncert');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/40 transition-colors shrink-0"
                  >
                    Reset NCERT Progress
                  </button>
                </div>

                {/* 3. Reset Study History */}
                <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">Reset Study History Only</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      Clears recorded timer sessions and logged minutes. Preserves task statuses.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setResetType('study');
                    }}
                    className="px-3 py-1.5 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-900/40 transition-colors shrink-0"
                  >
                    Reset Study History
                  </button>
                </div>

                {/* 4. Reset Entire Planner (Requires Typing RESET) */}
                <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50/40 dark:bg-rose-950/20 space-y-3">
                  <div>
                    <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-500" />
                      <span>Reset Entire Planner (Clean Slate)</span>
                    </div>
                    <div className="text-[11px] text-rose-800/80 dark:text-rose-300/80 mt-0.5">
                      Removes all weekly task completion, NCERT checkboxes, notes, revision history, and study sessions. Preserves the active syllabus tracks.
                    </div>
                  </div>

                  {resetType === 'entire' ? (
                    <div className="space-y-2 p-3 bg-white dark:bg-slate-900 rounded-xl border border-rose-200 dark:border-rose-900">
                      <p className="font-semibold text-rose-900 dark:text-rose-200">
                        Type <code className="font-mono text-rose-600 bg-rose-100 dark:bg-rose-950 px-1 py-0.5 rounded">RESET</code> to confirm full purge:
                      </p>
                      <input
                        type="text"
                        value={resetConfirmationText}
                        onChange={(e) => setResetConfirmationText(e.target.value)}
                        placeholder="RESET"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-white uppercase font-bold focus:outline-none focus:ring-2 focus:ring-rose-500"
                      />
                      <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setResetType(null)}
                          className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={resetConfirmationText.trim().toUpperCase() !== 'RESET'}
                          onClick={handleConfirmReset}
                          className="px-3.5 py-1.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-40 rounded-lg shadow-xs transition-colors"
                        >
                          Confirm Reset Everything
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setResetType('entire');
                        setResetConfirmationText('');
                      }}
                      className="px-3.5 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
                    >
                      Reset Entire Planner
                    </button>
                  )}
                </div>
              </div>

              {/* Sub-modal confirmation for individual resets */}
              {resetType && resetType !== 'entire' && (
                <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-800 bg-white dark:bg-slate-900 space-y-2">
                  <p className="font-bold text-slate-900 dark:text-white">
                    Confirm reset of {resetType === 'weekly' ? 'Weekly Tasks' : resetType === 'ncert' ? 'NCERT Progress' : 'Study History'}?
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    A safety backup file will be saved to your downloads before proceeding.
                  </p>
                  <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setResetType(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmReset}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
                    >
                      Proceed with Reset
                    </button>
                  </div>
                </div>
              )}
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
