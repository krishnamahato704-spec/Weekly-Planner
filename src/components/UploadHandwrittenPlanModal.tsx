import { Dialog } from './ui/Dialog';
import React, { useEffect, useState, useRef } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  Check, 
  Image as ImageIcon, 
  Loader2, 
  Calendar, 
  AlertCircle, 
  ArrowRight,
  PlusCircle,
  FileText
} from 'lucide-react';
import { Priority, Task } from '../types';

interface ParsedTask {
  title: string;
  category: string;
  priority: Priority;
  notes?: string;
  selected?: boolean;
}

interface UploadHandwrittenPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportToCurrentWeek: (tasks: { title: string; category: string; priority: Priority; notes?: string }[]) => void;
  onCreateNewWeekWithTasks: (weekData: {
    sundayDate: string;
    focusGoal: string;
    tasks: { title: string; category: string; priority: Priority; notes?: string }[];
  }) => void;
  currentWeekTitle: string;
}

export const UploadHandwrittenPlanModal: React.FC<UploadHandwrittenPlanModalProps> = ({
  isOpen,
  onClose,
  onImportToCurrentWeek,
  onCreateNewWeekWithTasks,
  currentWeekTitle,
}) => {
  const fieldId = React.useId();
  const dialogTitleId = React.useId();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [parsedData, setParsedData] = useState<{
    weekTitle?: string;
    focusGoal?: string;
    tasks: ParsedTask[];
  } | null>(null);

  const [importTarget, setImportTarget] = useState<'new_week' | 'current_week'>('new_week');
  const [targetSundayDate, setTargetSundayDate] = useState('2026-10-04'); // Next Sunday
  const [customGoal, setCustomGoal] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const readerRef = useRef<FileReader | null>(null);
  const requestRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setIsScanning(false);
      return;
    }
    return () => {
      readerRef.current?.abort();
      requestRef.current?.abort();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please upload a valid image file (JPG, PNG, WEBP).');
      return;
    }
    // Base64 adds about a third to the file size; leave room in the 25 MB API body limit.
    if (file.size > 16 * 1024 * 1024) {
      setErrorMessage('Please choose an image smaller than 16 MB.');
      return;
    }

    readerRef.current?.abort();
    requestRef.current?.abort();
    setIsScanning(false);
    setImagePreview(null);
    setParsedData(null);

    setErrorMessage(null);
    setImageFile(file);

    const reader = new FileReader();
    readerRef.current = reader;
    reader.onload = () => {
      setImagePreview(reader.result as string);
    };
    reader.onerror = () => setErrorMessage('The image could not be read. Please choose it again.');
    reader.readAsDataURL(file);
  };

  const handleScanPlan = async () => {
    if (!imagePreview || isScanning) return;
    requestRef.current?.abort();
    const controller = new AbortController();
    requestRef.current = controller;

    setIsScanning(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/ai/parse-handwritten-plan', {
        method: 'POST',
        signal: controller.signal,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imagePreview,
          mimeType: imageFile?.type || 'image/jpeg',
          additionalNotes: 'Strictly extract all handwritten tasks. Treat "Re J" as "Reflective Journal".',
        }),
      });

      const data = await res.json();
      if (controller.signal.aborted) return;

      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to scan handwritten plan');
      }

      if (data.data?.tasks) {
        setParsedData({
          weekTitle: data.data.weekTitle || 'Week of Sunday, Oct 4',
          focusGoal: data.data.focusGoal || '',
          tasks: data.data.tasks.map((t: any) => ({
            ...t,
            selected: true,
          })),
        });
        if (data.data.focusGoal) {
          setCustomGoal(data.data.focusGoal);
        }
      } else {
        throw new Error('No tasks could be recognized in this image. Please ensure the handwriting is legible.');
      }
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.error(err);
      setErrorMessage(err.message || 'Error communicating with AI transcription server.');
    } finally {
      if (requestRef.current === controller && !controller.signal.aborted) {
        requestRef.current = null;
        setIsScanning(false);
      }
    }
  };

  const handleToggleTask = (index: number) => {
    setParsedData((previous) => previous ? {
      ...previous,
      tasks: previous.tasks.map((task, taskIndex) => taskIndex === index
        ? { ...task, selected: !task.selected } : task),
    } : previous);
  };

  const handleFinalSubmit = () => {
    if (!parsedData) return;
    const selectedTasks = parsedData.tasks.filter((t) => t.selected !== false);
    if (selectedTasks.length === 0) {
      setErrorMessage('Please select at least one task to import.');
      return;
    }

    if (importTarget === 'current_week') {
      onImportToCurrentWeek(selectedTasks);
    } else {
      onCreateNewWeekWithTasks({
        sundayDate: targetSundayDate,
        focusGoal: customGoal.trim() || parsedData.focusGoal || 'Handwritten plan',
        tasks: selectedTasks,
      });
    }

    handleResetModal();
    onClose();
  };

  const handleResetModal = () => {
    setImageFile(null);
    setImagePreview(null);
    setParsedData(null);
    setErrorMessage(null);
    setIsScanning(false);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} labelledBy={dialogTitleId} className="modal-panel overflow-y-auto w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl flex flex-col ">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
            <Sparkles aria-hidden="true" className="w-4 h-4" />
          </div>
          <div>
            <h2 id={dialogTitleId} className="text-base font-semibold text-neutral-900 dark:text-white">
              Upload & Convert Handwritten Plan
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              AI Vision recognizes your notebook goals and builds your weekly task list directly
            </p>
          </div>
        </div>
        <button aria-label="Close dialog"
          onClick={() => {
            handleResetModal();
            onClose();
          }}
          className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
        >
          <X aria-hidden="true" className="w-5 h-5" />
        </button>
      </div>

      {/* Content Body */}
      <div className="p-6 overflow-y-auto space-y-5">
        {errorMessage && (
          <div role="alert" className="p-3.5 rounded-lg bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-700 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle aria-hidden="true" className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Phase 1: Upload Image */}
        {!parsedData && (
          <div className="space-y-4">
            <div
              className={`relative focus-within:outline-3 focus-within:outline-indigo-600 focus-within:outline-offset-4 border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
                imagePreview
                  ? 'border-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/10'
                  : 'border-neutral-300 dark:border-neutral-700 hover:border-emerald-500 bg-neutral-50 dark:bg-neutral-800/40'
              }`}
            >
              <><label className="sr-only" htmlFor={`${fieldId}-field-1`}>Upload a photo of your handwritten plan</label><input id={`${fieldId}-field-1`}
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                aria-describedby={`${fieldId}-upload-help`}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                /></>
                <span id={`${fieldId}-upload-help`} className="sr-only">Select a JPG, PNG, or WEBP image up to 16 MiB.</span>

              {imagePreview ? (
                <div className="space-y-3">
                  <img
                    src={imagePreview}
                    alt="Preview of the handwritten planner photo selected for transcription"
                    className="max-h-56 mx-auto rounded-lg shadow-xs object-contain border border-neutral-200 dark:border-neutral-700"
                  />
                  <p className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                    Photo uploaded! Click to select a different photo.
                  </p>
                </div>
              ) : (
                <div className="space-y-2 py-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
                    <Upload aria-hidden="true" className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                      Upload photo of your notebook / handwritten plan
                    </p>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                      Browse or drop a JPG, PNG, or WEBP image, up to 16 MiB.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {imagePreview && (
              <div className="flex justify-end">
                <button
                  onClick={handleScanPlan}
                  disabled={isScanning}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm transition-all"
                >
                  {isScanning ? (
                    <>
                      <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" />
                      <span>Transcribing Notebook with AI...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles aria-hidden="true" className="w-4 h-4" />
                      <span>Convert to Task List</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Phase 2: Review and Import Parsed Tasks */}
        {parsedData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
              <div>
                <h3 className="text-sm font-bold text-neutral-900 dark:text-white">
                  Recognized Tasks ({parsedData.tasks.filter((t) => t.selected).length}/{parsedData.tasks.length} selected)
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Review and confirm the tasks extracted from your handwritten page.
                </p>
              </div>
              <button
                onClick={() => setParsedData(null)}
                className="text-xs text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Upload different photo
              </button>
            </div>

            {/* Import Target Choice */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="importTarget"
                  checked={importTarget === 'new_week'}
                  onChange={() => setImportTarget('new_week')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                    Create as Next Week's Plan
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Launches a new Sunday cycle with these tasks
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="radio"
                  name="importTarget"
                  checked={importTarget === 'current_week'}
                  onChange={() => setImportTarget('current_week')}
                  className="mt-0.5 text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="text-xs font-bold text-neutral-900 dark:text-white block">
                    Add to Current Week
                  </span>
                  <span className="text-[11px] text-neutral-500 dark:text-neutral-400">
                    Append tasks to {currentWeekTitle}
                  </span>
                </div>
              </label>
            </div>

            {importTarget === 'new_week' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor={`${fieldId}-field-2`} className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">
                    Target Sunday Date
                  </label>
                  <input id={`${fieldId}-field-2`}
                    type="date"
                    value={targetSundayDate}
                    onChange={(e) => setTargetSundayDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
                <div>
                  <label htmlFor={`${fieldId}-field-3`} className="block text-[11px] font-semibold text-neutral-600 dark:text-neutral-400 uppercase mb-1">
                    Weekly Focus Goal
                  </label>
                  <input id={`${fieldId}-field-3`}
                    type="text"
                    value={customGoal}
                    onChange={(e) => setCustomGoal(e.target.value)}
                    placeholder="e.g. Next week focus goals..."
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                </div>
              </div>
            )}

            {/* Task list preview */}
            <div className="max-h-60 overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl bg-white dark:bg-neutral-900">
              {parsedData.tasks.map((task, idx) => (
                <label
                  key={idx}
                  className={`p-3 flex items-start gap-3 cursor-pointer transition-colors ${
                    task.selected
                      ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                      : 'bg-neutral-50/50 dark:bg-neutral-900/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.selected !== false}
                    aria-label={`Include ${task.title} in the imported plan`}
                    onChange={() => handleToggleTask(idx)}
                    className="mt-1 w-4 h-4 text-emerald-600 rounded border-neutral-300"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-semibold text-neutral-900 dark:text-white block truncate">
                      {task.title}
                    </span>
                    {task.notes && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                        {task.notes}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1">
                      <span>{task.category}</span>
                      <span>·</span>
                      <span
                        className={
                          task.priority === 'High'
                            ? 'text-rose-600 dark:text-rose-400 font-semibold'
                            : task.priority === 'Medium'
                            ? 'text-amber-600 dark:text-amber-400 font-semibold'
                            : 'text-blue-600 dark:text-blue-400 font-semibold'
                        }
                      >
                        {task.priority} Priority
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Footer */}
      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50 dark:bg-neutral-900">
        <button
          onClick={() => {
            handleResetModal();
            onClose();
          }}
          className="px-4 py-2 text-xs font-medium text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-lg transition-colors"
        >
          Cancel
        </button>

        {parsedData && (
          <button
            onClick={handleFinalSubmit}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-all"
          >
            <Check aria-hidden="true" className="w-3.5 h-3.5" />
            <span>
              {importTarget === 'new_week' ? 'Create New Weekly Plan' : 'Add to Current Week'}
            </span>
          </button>
        )}
      </div>
    </Dialog>
  );
};
