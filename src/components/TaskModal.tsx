import React, { useState, useEffect } from 'react';
import { X, Check, Calendar, RotateCcw, Sparkles } from 'lucide-react';
import { Priority, Task } from '../types';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: {
    title: string;
    category: string;
    priority: Priority;
    notes?: string;
    scheduledDate?: string;
    isRecurring?: boolean;
  }) => void;
  initialTask?: Task | null;
  existingCategories: string[];
}

export const TaskModal: React.FC<TaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTask,
  existingCategories,
}) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Study');
  const [customCategory, setCustomCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);

  const defaultCategories = ['Study', 'Work', 'Research', 'Exam Prep', 'Skills', 'B.Ed SI', 'Personal'];
  const allCategories = Array.from(new Set([...defaultCategories, ...existingCategories]));

  useEffect(() => {
    if (initialTask) {
      setTitle(initialTask.title);
      if (allCategories.includes(initialTask.category)) {
        setCategory(initialTask.category);
        setCustomCategory('');
      } else {
        setCategory('Other');
        setCustomCategory(initialTask.category);
      }
      setPriority(initialTask.priority);
      setNotes(initialTask.notes || '');
      setScheduledDate(initialTask.scheduledDate || '');
      setIsRecurring(!!initialTask.isRecurring);
    } else {
      setTitle('');
      setCategory('Study');
      setCustomCategory('');
      setPriority('Medium');
      setNotes('');
      setScheduledDate('');
      setIsRecurring(false);
    }
  }, [initialTask, isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const finalCategory = category === 'Other' ? (customCategory.trim() || 'General') : category;
    onSave({
      title: title.trim(),
      category: finalCategory,
      priority,
      notes: notes.trim() || undefined,
      scheduledDate: scheduledDate || undefined,
      isRecurring,
    });
    onClose();
  };

  const handleApplyRoutine = (routineTitle: string, routineCategory: string, routineNotes: string) => {
    setTitle(routineTitle);
    setCategory(routineCategory);
    setPriority('Medium');
    setNotes(routineNotes);
    setIsRecurring(true);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="w-full max-w-lg bg-white dark:bg-[#0F1420] rounded-2xl border border-slate-200/90 dark:border-slate-800/80 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              {initialTask ? 'Edit Weekly Task' : 'Add New Weekly Task'}
            </h2>
            {isRecurring && (
              <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                <RotateCcw className="w-2.5 h-2.5" /> Recurring
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Quick Routines Presets (Shown when creating new task) */}
          {!initialTask && (
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70 space-y-1.5">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-indigo-500" />
                <span>Quick Recurring Routine Presets</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() =>
                    handleApplyRoutine(
                      'English -> 100 vocab + 50 idioms & phrases',
                      'Study',
                      'Weekly recurring target: flashcards & usage drills'
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left"
                >
                  + English 100 Vocab & Idioms
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyRoutine(
                      'Hindi -> व्याकरण (3 chapters)',
                      'Study',
                      'Weekly grammar chapters with exercises'
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left"
                >
                  + Hindi Grammar (3 Ch)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleApplyRoutine(
                      'Canva -> 7 lessons (1 hour each)',
                      'Skills',
                      'Digital design skills practice, 1 hour daily'
                    )
                  }
                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all text-left"
                >
                  + Canva Lessons
                </button>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Task Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., English -> 100 vocab + 50 idioms & phrases..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              >
                {allCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="Other">+ Custom Category</option>
              </select>

              {category === 'Other' && (
                <input
                  type="text"
                  placeholder="Enter category name"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="mt-2 w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                Priority Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Low', 'Medium', 'High'] as Priority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-2 px-2 text-xs font-medium rounded-xl border text-center transition-colors ${
                      priority === p
                        ? p === 'High'
                          ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-400 font-bold'
                          : p === 'Medium'
                          ? 'bg-amber-50 border-amber-300 text-amber-700 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-400 font-bold'
                          : 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-400 font-bold'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Weekly Recurring Toggle Card */}
          <div className="p-3.5 rounded-xl border border-indigo-100 dark:border-indigo-900/40 bg-indigo-50/50 dark:bg-indigo-950/20 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Weekly Recurring Task
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Automatically populates into every new weekly plan
                </span>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-slate-600 peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Target Week Date (Optional)
            </label>
            <div className="relative">
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
              Notes / Sub-targets (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. 100 vocab + 50 idioms, Chapters 1 & 2..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{initialTask ? 'Save Changes' : 'Add Task'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
