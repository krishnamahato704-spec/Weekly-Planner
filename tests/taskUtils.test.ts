import assert from 'node:assert/strict';
import test from 'node:test';
import { indexTasksByDate, selectTasks, summarizeTasks, summarizeWeeks, updateTaskInWeeks } from '../src/utils/taskUtils';
import { ALL_NCERT_CHAPTERS, getAllFlatChapters } from '../src/utils/ncertData';
import type { Task, WeekPlan } from '../src/types';

function task(id: string, overrides: Partial<Task> = {}): Task {
  return { id, title: id, category: 'Study', priority: 'Medium', completed: false,
    createdAt: '2026-10-03T00:00:00Z', ...overrides };
}

function week(id: string, tasks: Task[]): WeekPlan {
  return { id, sundayDate: id, title: id, tasks, createdAt: '2026-10-03T00:00:00Z' };
}

test('summaries preserve counts, priority totals, and arbitrary category names', () => {
  const tasks = [task('a', { completed: true, priority: 'High' }),
    task('b', { priority: 'High', category: '__proto__' }),
    task('c', { carriedOverFrom: 'previous', priority: 'Low', category: '' })];
  const stats = summarizeTasks(tasks);
  assert.equal(stats.total, 3);
  assert.equal(stats.completed, 1);
  assert.equal(stats.percentage, 33);
  assert.equal(stats.highPriorityTotal, 2);
  assert.equal(stats.highPriorityCompleted, 1);
  assert.equal(stats.carriedOver, 1);
  assert.deepEqual(stats.pendingByPriority, { High: 1, Medium: 0, Low: 1 });
  assert.deepEqual(stats.categories.get('__proto__'), { total: 1, completed: 0 });
  assert.deepEqual(stats.categories.get('General'), { total: 1, completed: 0 });
  assert.equal(summarizeTasks([]).percentage, 0);
});

test('search, completion and priority filters compose; sorting never mutates input', () => {
  const tasks = Object.freeze([task('Zulu', { notes: 'Read NCERT', priority: 'High' }),
    task('Alpha', { completed: true, category: 'NCERT' }), task('Beta')]);
  assert.deepEqual(selectTasks(tasks, 'remaining', 'High', '  nCeRt  ', 'title').map(t => t.id), ['Zulu']);
  assert.deepEqual(selectTasks(tasks, 'all', 'all', '', 'title').map(t => t.id), ['Alpha', 'Beta', 'Zulu']);
  assert.deepEqual(selectTasks(tasks, 'all', 'all', '', 'incomplete_first').map(t => t.id), ['Zulu', 'Beta', 'Alpha']);
  assert.deepEqual(selectTasks(tasks, 'all', 'all', '', 'priority').map(t => t.id), ['Zulu', 'Alpha', 'Beta']);
  assert.deepEqual(tasks.map(t => t.id), ['Zulu', 'Alpha', 'Beta']);
});

test('updates and deletes preserve untouched references and do not mutate snapshots', () => {
  const a = task('a');
  const b = task('b');
  const untouched = week('2026-09-20', [task('c')]);
  const original = [week('2026-09-27', [a, b]), untouched];
  const updated = updateTaskInWeeks(original, 'a', t => ({ ...t, completed: true }));
  assert.equal(original[0].tasks[0].completed, false);
  assert.equal(updated[0].tasks[0].completed, true);
  assert.equal(updated[0].tasks[1], b);
  assert.equal(updated[1], untouched);
  assert.equal(updateTaskInWeeks(original, 'missing', () => null), original);
  assert.equal(updateTaskInWeeks(original, 'a', t => t), original);
  assert.deepEqual(updateTaskInWeeks(original, 'a', () => null)[0].tasks, [b]);
  assert.deepEqual(original[0].tasks, [a, b]);
});

test('week summaries sort chronologically, merge categories, and include empty weeks', () => {
  const newer = week('2026-10-04', [task('a', { completed: true, priority: 'High' })]);
  const older = week('2026-09-27', [task('b', { priority: 'High' })]);
  const original = [newer, older, week('2026-10-11', [])];
  const stats = summarizeWeeks(original);
  assert.deepEqual(stats.summaries.map(s => s.week.id), ['2026-09-27', '2026-10-04', '2026-10-11']);
  assert.equal(stats.total, 2);
  assert.equal(stats.completed, 1);
  assert.equal(stats.highPriorityTotal, 2);
  assert.deepEqual(stats.categories.get('Study'), { total: 2, completed: 1 });
  assert.equal(original[0], newer);
});

test('calendar index excludes unscheduled tasks and matches per-day completion counts', () => {
  const index = indexTasksByDate([task('a', { scheduledDate: '2026-10-03', completed: true }),
    task('b', { scheduledDate: '2026-10-03' }), task('c'), task('d', { scheduledDate: '2026-10-04' })]);
  assert.equal(index.size, 2);
  assert.deepEqual(index.get('2026-10-03'), { total: 2, completed: 1 });
  assert.deepEqual(index.get('2026-10-04'), { total: 1, completed: 0 });
});

test('flat chapters reuse metadata while keeping each caller array independent', () => {
  const chapters = getAllFlatChapters();
  assert.deepEqual(chapters, ALL_NCERT_CHAPTERS);
  chapters.pop();
  assert.equal(getAllFlatChapters().length, ALL_NCERT_CHAPTERS.length);
});
