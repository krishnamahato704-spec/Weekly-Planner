import React, { useEffect, useId, useMemo, useState } from 'react';
import { X, Check, RotateCcw, Sparkles } from 'lucide-react';
import { Priority, Task } from '../types';
import { Dialog } from './ui/Dialog';
import { SegmentedControl } from './ui/Primitives';

interface TaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (task: { title: string; category: string; priority: Priority; notes?: string; scheduledDate?: string; isRecurring?: boolean }) => void;
  initialTask?: Task | null;
  existingCategories: string[];
}
const defaultCategories = ['Study', 'Work', 'Research', 'Exam Prep', 'Skills', 'B.Ed SI', 'Personal'];
const routines = [
  { label: 'English vocabulary', title: 'English -> 100 vocab + 50 idioms & phrases', category: 'Study', notes: 'Weekly recurring target: flashcards & usage drills' },
  { label: 'Hindi grammar', title: 'Hindi -> व्याकरण (3 chapters)', category: 'Study', notes: 'Weekly grammar chapters with exercises' },
  { label: 'Canva lessons', title: 'Canva -> 7 lessons (1 hour each)', category: 'Skills', notes: 'Digital design skills practice, 1 hour daily' },
];
export function TaskModal({ isOpen, onClose, onSave, initialTask, existingCategories }: TaskModalProps) {
  const id = useId();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Study');
  const [customCategory, setCustomCategory] = useState('');
  const [priority, setPriority] = useState<Priority>('Medium');
  const [notes, setNotes] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [isRecurring, setIsRecurring] = useState(false);
  const categories = useMemo(() => Array.from(new Set([...defaultCategories, ...existingCategories])), [existingCategories]);
  useEffect(() => {
    setTitle(initialTask?.title || '');
    setCategory(initialTask?.category || 'Study');
    setCustomCategory('');
    setPriority(initialTask?.priority || 'Medium');
    setNotes(initialTask?.notes || '');
    setScheduledDate(initialTask?.scheduledDate || '');
    setIsRecurring(!!initialTask?.isRecurring);
  }, [initialTask, isOpen]);

  return <Dialog isOpen={isOpen} onClose={onClose} labelledBy={`${id}-heading`} className="w-full max-w-lg">
  <div className="dialog-header">
    <div><p className="eyebrow mb-1">Your weekly plan</p><h2 id={`${id}-heading`} className="text-lg font-semibold tracking-tight">{initialTask ? 'Edit Weekly Task' : 'Add New Weekly Task'}</h2></div>
    <button type="button" className="icon-button" onClick={onClose} aria-label="Close task form"><X aria-hidden="true" size={20} /></button>
  </div>
  <form className="dialog-form" onSubmit={event => {
    event.preventDefault();
    if (!title.trim()) return;
    onSave({ title: title.trim(), category: category === 'Other' ? customCategory.trim() || 'General' : category,
      priority, notes: notes.trim() || undefined, scheduledDate: scheduledDate || undefined, isRecurring });
    onClose();
  }}>
    <div>
      <label className="field-label" htmlFor={`${id}-title`}>Task title <span className="text-muted font-normal">(required)</span></label>
      <input id={`${id}-title`} data-initial-focus required className="field" value={title} onChange={event => setTitle(event.target.value)} placeholder="What would you like to accomplish?" />
    </div>
    {!initialTask && <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 p-3.5">
      <p className="text-xs text-muted flex items-center gap-1.5"><Sparkles aria-hidden="true" size={13} />Start with a recurring routine</p>
      <div className="flex flex-wrap gap-2 mt-3">{routines.map(routine => <button key={routine.label} type="button" className="button button-secondary text-[11px] px-2.5" onClick={() => {
        setTitle(routine.title); setCategory(routine.category); setNotes(routine.notes); setPriority('Medium'); setIsRecurring(true);
      }}><PlusIcon />{routine.label}</button>)}</div>
    </div>}
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div><label className="field-label" htmlFor={`${id}-category`}>Category</label>
        <select id={`${id}-category`} className="field" value={category} onChange={event => setCategory(event.target.value)}>
          {categories.map(item => <option key={item}>{item}</option>)}<option value="Other">Custom category</option>
        </select>
        {category === 'Other' && <><label className="sr-only" htmlFor={`${id}-custom`}>Custom category name</label><input id={`${id}-custom`} className="field mt-2" value={customCategory} onChange={event => setCustomCategory(event.target.value)} placeholder="Category name" /></>}
      </div>
      <div><span className="field-label">Priority</span><SegmentedControl label="Task priority" value={priority} onChange={setPriority} options={(['Low', 'Medium', 'High'] as Priority[]).map(value => ({ value, label: value }))} /></div>
    </div>
    <label className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-700 p-4 cursor-pointer">
      <span className="flex items-center gap-3"><RotateCcw aria-hidden="true" size={18} className="text-indigo-600 dark:text-indigo-300 shrink-0" /><span><span className="block text-xs font-semibold">Repeat each week</span><span className="block text-[11px] text-muted mt-1">Include this task in every new weekly plan.</span></span></span>
      <input type="checkbox" className="size-4 shrink-0" checked={isRecurring} onChange={event => setIsRecurring(event.target.checked)} />
    </label>
    <div><label className="field-label" htmlFor={`${id}-date`}>Scheduled date <span className="text-muted font-normal">(optional)</span></label><input id={`${id}-date`} type="date" className="field" value={scheduledDate} onChange={event => setScheduledDate(event.target.value)} /></div>
    <div><label className="field-label" htmlFor={`${id}-notes`}>Notes <span className="text-muted font-normal">(optional)</span></label><textarea id={`${id}-notes`} rows={3} className="field resize-y" value={notes} onChange={event => setNotes(event.target.value)} placeholder="A few details to help you get started..." /></div>
    <div className="flex justify-end gap-2 pt-4 border-t border-slate-200 dark:border-slate-700">
      <button type="button" className="button button-secondary" onClick={onClose}>Cancel</button>
      <button type="submit" className="button button-primary" disabled={!title.trim()}><Check aria-hidden="true" size={16} />{initialTask ? 'Save Changes' : 'Add Task'}</button>
    </div>
  </form>
</Dialog>;
}
function PlusIcon() { return <span aria-hidden="true">+</span>; }
