import type { Priority, Task, TaskFilter, WeekPlan } from '../types';

export function summarizeTasks(tasks: readonly Task[]) {
  let completed = 0;
  let carriedOver = 0;
  let highPriorityTotal = 0;
  let highPriorityCompleted = 0;
  const pendingByPriority: Record<Priority, number> = { High: 0, Medium: 0, Low: 0 };
  const categories = new Map<string, { total: number; completed: number }>();

  for (const task of tasks) {
    if (task.completed) completed++;
    else pendingByPriority[task.priority]++;
    if (task.carriedOverFrom) carriedOver++;
    if (task.priority === 'High') {
      highPriorityTotal++;
      if (task.completed) highPriorityCompleted++;
    }
    const category = task.category || 'General';
    const counts = categories.get(category) ?? { total: 0, completed: 0 };
    counts.total++;
    if (task.completed) counts.completed++;
    categories.set(category, counts);
  }

  return {
    total: tasks.length,
    completed,
    remaining: tasks.length - completed,
    percentage: tasks.length ? Math.round((completed / tasks.length) * 100) : 0,
    carriedOver,
    highPriorityTotal,
    highPriorityCompleted,
    pendingByPriority,
    categories,
  };
}

export function summarizeWeeks(weeks: readonly WeekPlan[]) {
  const summaries = weeks.map((week) => ({ week, ...summarizeTasks(week.tasks) }));
  let total = 0;
  let completed = 0;
  let highPriorityTotal = 0;
  let highPriorityCompleted = 0;
  const categories = new Map<string, { total: number; completed: number }>();
  for (const summary of summaries) {
    total += summary.total;
    completed += summary.completed;
    highPriorityTotal += summary.highPriorityTotal;
    highPriorityCompleted += summary.highPriorityCompleted;
    for (const [category, counts] of summary.categories) {
      const aggregate = categories.get(category) ?? { total: 0, completed: 0 };
      aggregate.total += counts.total;
      aggregate.completed += counts.completed;
      categories.set(category, aggregate);
    }
  }
  summaries.sort((a, b) => a.week.sundayDate.localeCompare(b.week.sundayDate));
  return { summaries, total, completed, highPriorityTotal, highPriorityCompleted, categories };
}

const PRIORITY_ORDER: Record<Priority, number> = { High: 0, Medium: 1, Low: 2 };
export type TaskSort = 'default' | 'priority' | 'incomplete_first' | 'title';

export function selectTasks(
  tasks: readonly Task[],
  filter: TaskFilter,
  priority: string,
  search: string,
  sort: TaskSort,
): Task[] {
  const query = search.trim().toLowerCase();
  const selected = tasks.filter((task) => {
    if (filter === 'completed' && !task.completed) return false;
    if (filter === 'remaining' && task.completed) return false;
    if (priority !== 'all' && task.priority !== priority) return false;
    return !query || task.title.toLowerCase().includes(query) ||
      task.category.toLowerCase().includes(query) || !!task.notes?.toLowerCase().includes(query);
  });

  if (sort === 'priority') selected.sort((a, b) => PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]);
  else if (sort === 'incomplete_first') selected.sort((a, b) => Number(a.completed) - Number(b.completed));
  else if (sort === 'title') selected.sort((a, b) => a.title.localeCompare(b.title));
  return selected;
}

// Preserve references to untouched weeks and tasks so their derived data stays cached.
export function updateTaskInWeeks(
  weeks: WeekPlan[],
  taskId: string,
  update: (task: Task) => Task | null,
): WeekPlan[] {
  let changed = false;
  const next = weeks.map((week) => {
    const index = week.tasks.findIndex((task) => task.id === taskId);
    if (index < 0) return week;
    const task = update(week.tasks[index]);
    if (task === week.tasks[index]) return week;
    changed = true;
    const tasks = week.tasks.slice();
    if (task === null) tasks.splice(index, 1);
    else tasks[index] = task;
    return { ...week, tasks };
  });
  return changed ? next : weeks;
}

export function indexTasksByDate(tasks: readonly Task[]) {
  const index = new Map<string, { total: number; completed: number }>();
  for (const task of tasks) {
    if (!task.scheduledDate) continue;
    const counts = index.get(task.scheduledDate) ?? { total: 0, completed: 0 };
    counts.total++;
    if (task.completed) counts.completed++;
    index.set(task.scheduledDate, counts);
  }
  return index;
}
