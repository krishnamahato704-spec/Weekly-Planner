import { Task, Priority } from '../types';
import {
  NcertProgressStore,
  getAllFlatChapters,
  NcertFlatChapter,
  isChapterComplete,
} from './ncertData';
import { getTodayDateString } from './studySessionUtils';

export interface NextTaskRecommendation {
  id: string; // unique ID for key
  source: 'weekly_task' | 'ncert';
  title: string;
  subtitle: string;
  category: string;
  priority: Priority;
  estimatedMinutes?: number;
  reason: string;
  priorityRank: number; // 1 (highest) to 9 (lowest)
  taskId?: string; // if linked to an existing weekly task
  scheduledDate?: string;
  startTime?: string;
  ncertRef?: {
    classNum: number;
    subject: string;
    bookTitle: string;
    bookId?: string;
    chapterId: string;
    chapterTitle: string;
    activity: 'reading' | 'notes' | 'revision';
  };
}

/**
 * Calculates smart deterministic next tasks according to P2.2 priority logic.
 */
export const getSmartNextTasks = (
  tasks: Task[],
  ncertProgress: NcertProgressStore,
  activeTaskId?: string
): NextTaskRecommendation[] => {
  const todayStr = getTodayDateString();
  const recommendations: NextTaskRecommendation[] = [];
  const seenNcertChapterIds = new Set<string>();

  // 1. Scan weekly tasks (only incomplete tasks)
  const incompleteTasks = tasks.filter((t) => !t.completed);

  for (const task of incompleteTasks) {
    const isOverdue = !!(task.scheduledDate && task.scheduledDate < todayStr);
    const isToday = task.scheduledDate === todayStr;
    const isUpcoming = !!(task.scheduledDate && task.scheduledDate > todayStr);
    const isActive = activeTaskId && task.id === activeTaskId;

    if (task.ncertRef?.chapterId) {
      seenNcertChapterIds.add(task.ncertRef.chapterId);
    }

    if (isActive) {
      recommendations.push({
        id: `rec-active-${task.id}`,
        source: 'weekly_task',
        taskId: task.id,
        title: task.title,
        subtitle: task.ncertRef
          ? `Class ${task.ncertRef.classNum} • ${task.ncertRef.subject}`
          : task.category,
        category: task.category,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        reason: 'Already in progress',
        priorityRank: 3,
        scheduledDate: task.scheduledDate,
        startTime: task.startTime,
        ncertRef: task.ncertRef,
      });
      continue;
    }

    if (isOverdue) {
      const daysOverdue = calculateDaysDifference(task.scheduledDate!, todayStr);
      const isHigh = task.priority === 'High';
      recommendations.push({
        id: `rec-overdue-${task.id}`,
        source: 'weekly_task',
        taskId: task.id,
        title: task.title,
        subtitle: task.ncertRef
          ? `Class ${task.ncertRef.classNum} • ${task.ncertRef.subject}`
          : task.category,
        category: task.category,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        reason: isHigh
          ? `Overdue by ${daysOverdue} ${daysOverdue === 1 ? 'day' : 'days'} · High priority`
          : `Overdue from earlier date`,
        priorityRank: isHigh ? 1 : 2.5,
        scheduledDate: task.scheduledDate,
        startTime: task.startTime,
        ncertRef: task.ncertRef,
      });
      continue;
    }

    if (isToday) {
      recommendations.push({
        id: `rec-today-${task.id}`,
        source: 'weekly_task',
        taskId: task.id,
        title: task.title,
        subtitle: task.ncertRef
          ? `Class ${task.ncertRef.classNum} • ${task.ncertRef.subject}`
          : task.category,
        category: task.category,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        reason: task.startTime ? `Scheduled for today at ${task.startTime}` : 'Due today',
        priorityRank: 2,
        scheduledDate: task.scheduledDate,
        startTime: task.startTime,
        ncertRef: task.ncertRef,
      });
      continue;
    }

    if (task.priority === 'High') {
      recommendations.push({
        id: `rec-high-${task.id}`,
        source: 'weekly_task',
        taskId: task.id,
        title: task.title,
        subtitle: task.ncertRef
          ? `Class ${task.ncertRef.classNum} • ${task.ncertRef.subject}`
          : task.category,
        category: task.category,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        reason: 'High priority weekly goal',
        priorityRank: 7,
        scheduledDate: task.scheduledDate,
        startTime: task.startTime,
        ncertRef: task.ncertRef,
      });
      continue;
    }

    if (isUpcoming) {
      recommendations.push({
        id: `rec-upcoming-${task.id}`,
        source: 'weekly_task',
        taskId: task.id,
        title: task.title,
        subtitle: task.ncertRef
          ? `Class ${task.ncertRef.classNum} • ${task.ncertRef.subject}`
          : task.category,
        category: task.category,
        priority: task.priority,
        estimatedMinutes: task.estimatedMinutes,
        reason: `Upcoming scheduled on ${task.scheduledDate}`,
        priorityRank: 8,
        scheduledDate: task.scheduledDate,
        startTime: task.startTime,
        ncertRef: task.ncertRef,
      });
      continue;
    }
  }

  // 2. Scan NCERT chapters for learning chain progression (P2.2)
  const allChapters = getAllFlatChapters();

  for (const chapter of allChapters) {
    const progress = ncertProgress[chapter.id] || {
      reading: false,
      notes: false,
      revision: false,
    };

    // If whole chapter complete, skip
    if (isChapterComplete(progress)) continue;

    // Check 4 & 5: Reading done, Notes pending
    if (progress.reading && !progress.notes) {
      recommendations.push({
        id: `rec-ncert-notes-${chapter.id}`,
        source: 'ncert',
        title: `${chapter.title} — Notes`,
        subtitle: `Class ${chapter.classNum} • ${chapter.subject}`,
        category: 'NCERT',
        priority: 'High',
        estimatedMinutes: 40,
        reason: 'Reading completed — Notes next',
        priorityRank: 5,
        ncertRef: {
          classNum: chapter.classNum,
          subject: chapter.subject,
          bookTitle: chapter.bookTitle,
          bookId: chapter.bookId,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          activity: 'notes',
        },
      });
      continue;
    }

    // Check 6: Reading & Notes done, Revision pending
    if (progress.reading && progress.notes && !progress.revision) {
      recommendations.push({
        id: `rec-ncert-rev-${chapter.id}`,
        source: 'ncert',
        title: `${chapter.title} — Revision`,
        subtitle: `Class ${chapter.classNum} • ${chapter.subject}`,
        category: 'NCERT',
        priority: 'Medium',
        estimatedMinutes: 30,
        reason: 'Reading and Notes completed — Revision ready',
        priorityRank: 6,
        ncertRef: {
          classNum: chapter.classNum,
          subject: chapter.subject,
          bookTitle: chapter.bookTitle,
          bookId: chapter.bookId,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          activity: 'revision',
        },
      });
      continue;
    }

    // Check 4: Reading started/incomplete (only if user hasn't finished reading)
    // We only suggest the next unstarted chapter if we don't already have many recommendations
    if (!progress.reading && recommendations.length < 15) {
      // Check if this is the first unstarted chapter of its book
      recommendations.push({
        id: `rec-ncert-read-${chapter.id}`,
        source: 'ncert',
        title: `${chapter.title} — Reading`,
        subtitle: `Class ${chapter.classNum} • ${chapter.subject}`,
        category: 'NCERT',
        priority: 'Medium',
        estimatedMinutes: 45,
        reason: 'Next chapter reading in syllabus',
        priorityRank: 9,
        ncertRef: {
          classNum: chapter.classNum,
          subject: chapter.subject,
          bookTitle: chapter.bookTitle,
          bookId: chapter.bookId,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          activity: 'reading',
        },
      });
    }
  }

  // Sort deterministically by priorityRank, then by priority ('High' > 'Medium' > 'Low'), then by estimated duration
  return recommendations.sort((a, b) => {
    if (a.priorityRank !== b.priorityRank) {
      return a.priorityRank - b.priorityRank;
    }
    const priorityScore = (p: Priority) => (p === 'High' ? 3 : p === 'Medium' ? 2 : 1);
    const scoreDiff = priorityScore(b.priority) - priorityScore(a.priority);
    if (scoreDiff !== 0) return scoreDiff;
    return (a.estimatedMinutes || 999) - (b.estimatedMinutes || 999);
  });
};

function calculateDaysDifference(earlierDateStr: string, todayStr: string): number {
  try {
    const d1 = new Date(earlierDateStr).getTime();
    const d2 = new Date(todayStr).getTime();
    const diff = Math.floor((d2 - d1) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  } catch {
    return 1;
  }
}
