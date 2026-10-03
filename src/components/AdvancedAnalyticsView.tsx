import React, { useMemo } from 'react';
import { CheckCircle2, CalendarDays, BookOpen, Target, TrendingUp, Layers } from 'lucide-react';
import { WeekPlan } from '../types';
import { summarizeWeeks } from '../utils/taskUtils';
import { NcertProgressStore, ALL_NCERT_CHAPTERS, isChapterComplete } from '../utils/ncertData';
import { PageHeader, StatCard } from './ui/Primitives';

interface AdvancedAnalyticsViewProps { weeks: WeekPlan[]; ncertProgress: NcertProgressStore; }
export function AdvancedAnalyticsView({ weeks, ncertProgress }: AdvancedAnalyticsViewProps) {
  const stats = useMemo(() => summarizeWeeks(weeks), [weeks]);
  const rate = stats.total ? Math.round(stats.completed / stats.total * 100) : 0;
  const highRate = stats.highPriorityTotal ? Math.round(stats.highPriorityCompleted / stats.highPriorityTotal * 100) : 0;
  const completedChapters = useMemo(() => ALL_NCERT_CHAPTERS.reduce((count, chapter) => count + Number(isChapterComplete(ncertProgress[chapter.id])), 0), [ncertProgress]);
  const ncertRate = Math.round(completedChapters / ALL_NCERT_CHAPTERS.length * 100);
  const categories = useMemo(() => [...stats.categories].sort((a, b) => b[1].total - a[1].total), [stats]);
  return <div className="space-y-6 view-enter">
    <PageHeader eyebrow="See the bigger picture" title="Weekly Progress Analytics" description="Your progress across weekly plans, priorities, and study tracks." />
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      <StatCard label="Overall completion" value={`${rate}%`} detail={`${stats.completed} of ${stats.total} tasks finished`} icon={<CheckCircle2 size={18} />} />
      <StatCard label="Weeks tracked" value={weeks.length} detail="Weekly plans in your workspace" icon={<CalendarDays size={18} />} />
      <StatCard label="High priority completion" value={`${highRate}%`} detail={`${stats.highPriorityCompleted} of ${stats.highPriorityTotal} tasks finished`} icon={<Target size={18} />} />
      <StatCard label="NCERT coverage" value={`${ncertRate}%`} detail={`${completedChapters} of ${ALL_NCERT_CHAPTERS.length} chapters complete`} icon={<BookOpen size={18} />} />
    </div>
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
      <section className="surface p-6" aria-labelledby="completion-trend-heading">
        <div className="flex items-center justify-between gap-3"><h2 id="completion-trend-heading" className="section-title">Week by week</h2><TrendingUp className="text-muted" size={18} /></div>
        <p className="text-xs text-muted mt-1">Completed tasks in each weekly plan.</p>
        <div className="mt-6 space-y-6">
          {stats.summaries.map(({ week, total, completed, percentage }) => <div key={week.id}>
            <div className="flex items-start justify-between gap-4 text-xs mb-3"><span className="font-medium">{week.title}</span><span className="text-muted tabular-nums whitespace-nowrap">{completed} / {total}<strong className="ml-3 text-indigo-600 dark:text-indigo-300">{percentage}%</strong></span></div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="img" aria-label={`${week.title}: ${percentage}% complete`}><div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400 transition-[width] duration-300" style={{ width: `${percentage}%` }} /></div>
          </div>)}
          {weeks.length === 0 && <p className="text-sm text-muted">Create a weekly plan to start tracking progress.</p>}
        </div>
      </section>
      <section className="surface p-6" aria-labelledby="category-heading">
        <div className="flex items-center justify-between gap-3"><h2 id="category-heading" className="section-title">Where your time goes</h2><Layers className="text-muted" size={18} /></div>
        <p className="text-xs text-muted mt-1">Task completion by category.</p>
        <div className="mt-6 space-y-6">
          {categories.map(([category, counts]) => {
            const percentage = counts.total ? Math.round(counts.completed / counts.total * 100) : 0;
            return <div key={category}>
              <div className="flex justify-between gap-4 text-xs mb-3"><span className="font-medium">{category}</span><span className="text-muted tabular-nums">{counts.completed} / {counts.total}<strong className="ml-3 text-indigo-600 dark:text-indigo-300">{percentage}%</strong></span></div>
              <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden" role="img" aria-label={`${category}: ${percentage}% complete`}><div className="h-full rounded-full bg-indigo-600 dark:bg-indigo-400 transition-[width] duration-300" style={{ width: `${percentage}%` }} /></div>
            </div>;
          })}
          {categories.length === 0 && <p className="text-sm text-muted">Your categories will appear as you add tasks.</p>}
        </div>
      </section>
    </div>
  </div>;
}
