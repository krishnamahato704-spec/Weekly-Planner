import React, { useMemo, useState } from 'react';
import { Plus, Search, Trash2, Edit3, Check, CalendarDays, Clock, CheckCircle2, Sparkles, BookOpen, GraduationCap, RotateCcw, ArrowRight, Flag, ListTodo, ChevronDown } from 'lucide-react';
import { Task, WeekPlan, TaskFilter, Priority } from '../types';
import { CompletionGauge } from './CompletionGauge';
import { PageHeader, SegmentedControl } from './ui/Primitives';
import { formatWeekRange } from '../utils/dateUtils';
import { selectTasks, summarizeTasks } from '../utils/taskUtils';

interface CurrentWeekViewProps {
  week: WeekPlan;
  allWeeks: WeekPlan[];
  onSelectWeekId: (id: string) => void;
  onToggleTask: (taskId: string) => void;
  onDeleteTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onOpenAddTaskModal: () => void;
  onQuickAddTask: (title: string, category: string, priority: Priority) => void;
  onOpenNewWeekModal: () => void;
  onOpenNotebookModal: () => void;
  onTriggerConfetti: () => void;
  onRestoreSep27Week?: () => void;
  onTransferRemainingToNextWeek?: (fromWeekId: string) => void;
}

const priorityCycle: Record<Priority, Priority> = { High: 'Medium', Medium: 'Low', Low: 'High' };
function TaskRow({ task, onToggle, onEdit, onDelete }: {
  task: Task; onToggle: () => void; onEdit: (task: Task) => void; onDelete: () => void;
}) {
  const academic = /B\.Ed|CTET|M\.A\.|UGC NET/.test(task.category);
  return <li className={`task-row ${task.completed ? 'task-row-completed' : ''}`}>
    <div className="task-main">
      <label className="task-check" title={task.completed ? 'Mark incomplete' : 'Mark complete'}>
        <input type="checkbox" checked={task.completed} onChange={onToggle} aria-label={`Complete ${task.title}`} />
        <span className="task-check-box" aria-hidden="true">{task.completed && <Check size={14} strokeWidth={3} />}</span>
      </label>
      <div className="min-w-0 flex-1">
        <button type="button" onClick={onToggle} className="task-title">{task.title}</button>
        {task.notes && <p className="task-notes">{task.notes}</p>}
        <div className="task-meta">
          <span className="inline-flex items-center gap-1.5">
            {task.ncertRef ? <BookOpen size={13} /> : academic ? <GraduationCap size={13} /> : null}
            {task.ncertRef ? `Class ${task.ncertRef.classNum} NCERT` : task.category}
          </span>
          <button type="button" className={`priority-badge priority-${task.priority.toLowerCase()}`}
            onClick={() => onEdit({ ...task, priority: priorityCycle[task.priority] })}
            aria-label={`Change priority of ${task.title}, currently ${task.priority}`} title="Change priority">
            <span className="priority-dot" />{task.priority}
          </button>
          {task.isRecurring && <span className="inline-flex items-center gap-1"><RotateCcw size={12} />Recurring</span>}
          {task.carriedOverFrom && <span className="inline-flex items-center gap-1"><ArrowRight size={12} />Carried over</span>}
          {task.completed && <span className="completion-label">Completed</span>}
        </div>
      </div>
    </div>
    <div className="task-actions">
      <button type="button" className="icon-button" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`} title="Edit task"><Edit3 size={16} /></button>
      <button type="button" className="icon-button icon-button-danger" onClick={onDelete} aria-label={`Delete ${task.title}`} title="Delete task"><Trash2 size={16} /></button>
    </div>
  </li>;
}

export function CurrentWeekView({ week, allWeeks, onSelectWeekId, onToggleTask, onDeleteTask, onEditTask,
  onOpenAddTaskModal, onQuickAddTask, onOpenNewWeekModal, onTriggerConfetti, onTransferRemainingToNextWeek }: CurrentWeekViewProps) {
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'default' | 'priority' | 'incomplete_first' | 'title'>('default');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('Study');
  const [quickPriority, setQuickPriority] = useState<Priority>('Medium');
  const stats = useMemo(() => summarizeTasks(week.tasks), [week.tasks]);
  const sortedTasks = useMemo(() => selectTasks(week.tasks, filter, priorityFilter, searchQuery, sortBy), [week.tasks, filter, priorityFilter, searchQuery, sortBy]);
  const weekOptions = useMemo(() => allWeeks.map(plan => ({ id: plan.id, title: plan.title,
    total: plan.tasks.length, completed: plan.tasks.reduce((count, task) => count + Number(!!task.completed), 0) })), [allWeeks]);
  const resetFilters = () => { setSearchQuery(''); setFilter('all'); setPriorityFilter('all'); };

  return <div className="space-y-7 view-enter">
    <PageHeader eyebrow="Weekly workspace" title="Your weekly plan"
      description={<><CalendarDays size={15} className="inline mr-2 -mt-0.5" />{formatWeekRange(week.sundayDate)}<span className="mx-2 text-muted" aria-hidden="true">/</span>{week.title}</>}
      actions={<>
        <div className="relative week-select">
          <select aria-label="Select weekly plan" className="field pr-9" value={week.id} onChange={event => onSelectWeekId(event.target.value)}>
            {weekOptions.map(plan => <option key={plan.id} value={plan.id}>{plan.title} ({plan.completed}/{plan.total})</option>)}
          </select>
          <ChevronDown size={15} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
        </div>
        <button type="button" className="button button-secondary" onClick={onOpenNewWeekModal}><Plus size={16} />New Week</button>
      </>} />

    <div className="weekly-layout">
      <section className="surface task-panel" aria-labelledby="tasks-heading">
        <div className="task-panel-heading">
          <div><h2 id="tasks-heading" className="section-title">Weekly tasks <span className="count-badge ml-2">{stats.total}</span></h2>
            <p className="mt-1 text-sm text-muted">Your study, work, and personal goals for this week.</p></div>
          <button type="button" className="icon-button" onClick={onOpenAddTaskModal} aria-label="Open task details form" title="Add with more details"><Plus size={20} /></button>
        </div>
        <form className="quick-add" onSubmit={event => {
          event.preventDefault();
          if (!quickTitle.trim()) return;
          onQuickAddTask(quickTitle.trim(), quickCategory, quickPriority);
          setQuickTitle('');
        }}>
          <div className="relative">
            <Plus size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input className="field pl-11" aria-label="Quick task title" value={quickTitle} onChange={event => setQuickTitle(event.target.value)} placeholder="What would you like to work on?" />
          </div>
          <div className="quick-add-options">
            <select className="field" aria-label="Quick task category" value={quickCategory} onChange={event => setQuickCategory(event.target.value)}>
              {['Study', 'Exam Prep', 'Research', 'Skills', 'B.Ed SI', 'Work', 'Personal'].map(category => <option key={category}>{category}</option>)}
            </select>
            <select className="field" aria-label="Quick task priority" value={quickPriority} onChange={event => setQuickPriority(event.target.value as Priority)}>
              {(['High', 'Medium', 'Low'] as Priority[]).map(priority => <option key={priority}>{priority}</option>)}
            </select>
            <button type="submit" className="button button-primary" disabled={!quickTitle.trim()}><Plus size={16} />Add Task</button>
          </div>
        </form>
        {stats.carriedOver > 0 && <p className="carryover-notice"><RotateCcw size={14} />{stats.carriedOver} task{stats.carriedOver === 1 ? '' : 's'} carried over from a previous week.</p>}
        <div className="task-toolbar">
          <SegmentedControl label="Filter tasks by completion" value={filter} onChange={setFilter} options={[
            { value: 'all', label: <>All <span>{stats.total}</span></> },
            { value: 'remaining', label: <>Remaining <span>{stats.remaining}</span></> },
            { value: 'completed', label: <>Done <span>{stats.completed}</span></> },
          ]} />
          <div className="relative task-search">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
            <input className="field pl-9" aria-label="Search weekly tasks" placeholder="Search tasks..." value={searchQuery} onChange={event => setSearchQuery(event.target.value)} />
          </div>
          <div className="task-sort">
            <select className="field" aria-label="Filter task priority" value={priorityFilter} onChange={event => setPriorityFilter(event.target.value)}>
              <option value="all">All priorities</option><option value="High">High priority</option><option value="Medium">Medium priority</option><option value="Low">Low priority</option>
            </select>
            <select className="field" aria-label="Sort tasks" value={sortBy} onChange={event => setSortBy(event.target.value as typeof sortBy)}>
              <option value="default">Default order</option><option value="priority">By priority</option><option value="incomplete_first">Remaining first</option><option value="title">A to Z</option>
            </select>
          </div>
        </div>
        <ul className="task-list">
          {sortedTasks.map(task => <TaskRow key={task.id} task={task} onToggle={() => onToggleTask(task.id)} onEdit={onEditTask} onDelete={() => onDeleteTask(task.id)} />)}
        </ul>
        {sortedTasks.length === 0 && <div className="empty-state">
          <span className="empty-icon"><ListTodo size={28} /></span>
          <h3 className="section-title mt-4">{stats.total === 0 ? 'A fresh week starts here.' : 'No tasks in this view.'}</h3>
          <p className="text-sm text-muted mt-2">{stats.total === 0 ? 'Add your first task and give your week a direction.' : 'Try another filter or a different search.'}</p>
          <button type="button" className="button button-secondary mt-5" onClick={stats.total === 0 ? onOpenAddTaskModal : resetFilters}>{stats.total === 0 ? 'Add your first task' : 'Clear filters'}</button>
        </div>}
        <div className="task-panel-footer"><span>{sortedTasks.length} of {stats.total} tasks shown</span><span className="inline-flex items-center gap-1.5"><CheckCircle2 size={13} />Changes saved automatically</span></div>
      </section>

      <aside className="weekly-insights" aria-label="Weekly overview">
        <section className="surface progress-card">
          <div className="flex items-center justify-between"><h2 className="section-title">This week, so far</h2><span className="text-muted"><CheckCircle2 size={17} /></span></div>
          <div className="flex justify-center py-6"><CompletionGauge percentage={stats.percentage} size={144} strokeWidth={9} /></div>
          <p className="text-center text-sm font-semibold">{stats.completed} of {stats.total} tasks complete</p>
          <p className="text-center text-xs text-muted mt-1.5">{stats.total === 0 ? 'Add a task to start tracking progress.' : stats.remaining === 0 ? 'Everything on your list is done.' : `${stats.remaining} tasks left in your weekly plan.`}</p>
          <div className="progress-counts">
            <div><span className="inline-flex items-center gap-1.5 text-muted text-xs"><CheckCircle2 size={13} />Done</span><strong>{stats.completed}</strong></div>
            <div><span className="inline-flex items-center gap-1.5 text-muted text-xs"><Clock size={13} />Remaining</span><strong>{stats.remaining}</strong></div>
          </div>
          {stats.total > 0 && stats.percentage === 100 && <button type="button" className="button button-secondary w-full mt-4" onClick={onTriggerConfetti}><Sparkles size={16} />Celebrate your week</button>}
        </section>
        <section className="focus-card">
          <p className="eyebrow inline-flex items-center gap-2"><Flag size={14} />Weekly focus</p>
          <p className="mt-3 text-base font-semibold leading-relaxed">{week.focusGoal || 'Make time for the things that move you forward.'}</p>
          <p className="mt-3 text-xs leading-relaxed text-muted">Keep your next step small and specific.</p>
        </section>
        <section className="surface p-5">
          <h2 className="section-title">Priority breakdown</h2>
          <p className="mt-1 text-xs text-muted">Remaining tasks, by priority</p>
          <div className="mt-5 space-y-4">
            {(['High', 'Medium', 'Low'] as Priority[]).map(priority => <div key={priority}>
              <div className="flex items-center justify-between text-xs mb-2"><span className="inline-flex items-center gap-2"><span className={`priority-dot priority-${priority.toLowerCase()}`} />{priority}</span><span className="font-semibold tabular-nums">{stats.pendingByPriority[priority]}</span></div>
              <div className="priority-track"><div className={`priority-fill priority-${priority.toLowerCase()}`} style={{ width: `${stats.remaining ? stats.pendingByPriority[priority] / stats.remaining * 100 : 0}%` }} /></div>
            </div>)}
          </div>
          {stats.remaining > 0 && onTransferRemainingToNextWeek && <button type="button" className="button button-secondary w-full mt-6 text-xs" onClick={() => onTransferRemainingToNextWeek(week.id)}><RotateCcw size={14} />Move remaining to next week<ArrowRight size={14} /></button>}
        </section>
      </aside>
    </div>
  </div>;
}
