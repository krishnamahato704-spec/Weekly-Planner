import React, { useMemo } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Calendar,
  Layers,
  BookOpen,
  Sparkles,
  TrendingUp,
  RotateCcw,
  Target,
  Award,
  CheckCheck,
  GraduationCap,
} from 'lucide-react';
import { WeekPlan } from '../types';
import { summarizeWeeks } from '../utils/taskUtils';
import {
  NcertProgressStore,
  ALL_NCERT_CHAPTERS,
  isChapterComplete,
} from '../utils/ncertData';

interface AdvancedAnalyticsViewProps {
  weeks: WeekPlan[];
  ncertProgress: NcertProgressStore;
}

export const AdvancedAnalyticsView: React.FC<AdvancedAnalyticsViewProps> = ({
  weeks,
  ncertProgress,
}) => {
  const stats = useMemo(() => summarizeWeeks(weeks), [weeks]);
  const { total: totalTasksCount, completed: completedTasksCount,
    highPriorityTotal, highPriorityCompleted } = stats;
  const overallCompletionRate =
    totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // High priority stats
  const highPriorityRate =
    highPriorityTotal > 0
      ? Math.round((highPriorityCompleted / highPriorityTotal) * 100)
      : 0;

  // NCERT Progress stats
  const allNcertChapters = ALL_NCERT_CHAPTERS;
  const completedNcertCount = useMemo(() => allNcertChapters.reduce((count, chapter) =>
    count + Number(isChapterComplete(ncertProgress[chapter.id])), 0), [ncertProgress]);
  const ncertRate =
    allNcertChapters.length > 0
      ? Math.round((completedNcertCount / allNcertChapters.length) * 100)
      : 0;

  // Categories breakdown
  const categoryEntries = useMemo(() => [...stats.categories].sort(
    (a, b) => b[1].total - a[1].total
  ), [stats]);

  // Week-by-week trends
  const weekTrends = useMemo(() => stats.summaries.map(({ week, total, completed, percentage }) => ({
    id: week.id, title: week.title, total, completed, percentage,
  })), [stats]);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider">
            <BarChart3 className="w-4 h-4" />
            <span>Academic Performance & Velocity</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-950 dark:text-white">
            Weekly Progress Analytics
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Comprehensive overview of weekly task execution, category velocity, and syllabus milestones.
          </p>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Overall Completion */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Overall Completion</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
            {overallCompletionRate}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {completedTasksCount} of {totalTasksCount} tasks finished
          </p>
        </div>

        {/* KPI 2: Weekly Blocks Tracked */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>Weeks Tracked</span>
            <Calendar className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white">
            {weeks.length}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Active 7-day Sunday cycles
          </p>
        </div>

        {/* KPI 3: High Priority Velocity */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>High Priority Rate</span>
            <Target className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400">
            {highPriorityRate}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {highPriorityCompleted} of {highPriorityTotal} high priority cleared
          </p>
        </div>

        {/* KPI 4: NCERT Coverage */}
        <div className="p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 font-semibold">
            <span>NCERT Syllabus</span>
            <BookOpen className="w-4 h-4 text-teal-500" />
          </div>
          <div className="text-2xl sm:text-3xl font-black text-teal-600 dark:text-teal-400">
            {ncertRate}%
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {completedNcertCount} of {allNcertChapters.length} chapters fully mastered
          </p>
        </div>
      </div>

      {/* Week by Week Velocity Chart */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-950 dark:text-white">
              Weekly Task Completion Velocity
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Completion rates across your consecutive weekly planning cycles.
            </p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {weekTrends.map((wt) => (
            <div
              key={wt.id}
              className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 space-y-2"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {wt.title}
                </span>
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                  {wt.completed}/{wt.total} tasks ({wt.percentage}%)
                </span>
              </div>
              <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-indigo-500 to-teal-400 h-full rounded-full transition-all duration-500"
                  style={{ width: `${wt.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="p-5 sm:p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800/80 bg-white dark:bg-[#0F1420] shadow-2xs space-y-4">
        <h2 className="text-base font-bold text-slate-950 dark:text-white">
          Category & Track Distribution
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {categoryEntries.map(([cat, stats]) => {
            const catPercent =
              stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

            return (
              <div
                key={cat}
                className="p-4 rounded-xl border border-slate-200/60 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-900/60 space-y-2"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />
                    <span>{cat}</span>
                  </span>
                  <span className="font-mono text-slate-600 dark:text-slate-400">
                    {stats.completed}/{stats.total} ({catPercent}%)
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${catPercent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
