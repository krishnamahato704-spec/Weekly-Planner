import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ArrowRight, 
  Eye, 
  Award,
  ChevronRight,
  Filter,
  Trash2,
  Sparkles,
  Info
} from 'lucide-react';
import { Chart, BarController, LineController, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Filler } from 'chart.js';
import { WeekPlan, Task } from '../types';
import { formatWeekRange } from '../utils/dateUtils';
import { summarizeWeeks } from '../utils/taskUtils';

Chart.register(BarController, LineController, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Tooltip, Filler);

interface ProgressBoardProps {
  weeks: WeekPlan[];
  onSelectWeekToView: (weekId: string) => void;
  onCarryOverFromWeek: (sourceWeekId: string) => void;
  onClearPastDemoWeeks?: () => void;
  onDeleteWeek?: (weekId: string) => void;
  hasPastDemoWeeks: boolean;
  isDarkMode: boolean;
}

export const ProgressBoard: React.FC<ProgressBoardProps> = ({
  weeks,
  onSelectWeekToView,
  onCarryOverFromWeek,
  onClearPastDemoWeeks,
  onDeleteWeek,
  hasPastDemoWeeks,
  isDarkMode,
}) => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstanceRef = useRef<Chart | null>(null);
  const [chartType, setChartType] = useState<'bar' | 'line'>('bar');
  const [inspectingWeek, setInspectingWeek] = useState<WeekPlan | null>(null);

  const stats = useMemo(() => summarizeWeeks(weeks), [weeks]);
  const sortedSummariesDesc = useMemo(() => [...stats.summaries].reverse(), [stats]);
  const totalWeeks = weeks.length;
  const totalCompletedAllTime = stats.completed;
  const totalTasksAllTime = stats.total;
  const averageCompletion = totalTasksAllTime === 0
    ? 0
    : Math.round((totalCompletedAllTime / totalTasksAllTime) * 100);

  useEffect(() => {
    if (!chartRef.current) return;

    const chart = new Chart(chartRef.current, {
      type: chartType,
      data: { labels: [], datasets: [] },
    });
    chartInstanceRef.current = chart;
    return () => {
      chart.destroy();
      chartInstanceRef.current = null;
    };
  }, [chartType]);

  useEffect(() => {
    const chart = chartInstanceRef.current;
    if (!chart) return;

    const labels = stats.summaries.map(({ week }) => week.title.replace('Week of Sunday, ', ''));
    const completionPercentages = stats.summaries.map((summary) => summary.percentage);

    const textColor = isDarkMode ? '#9ca3af' : '#52525b';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

    chart.data = {
        labels,
        datasets: [
          {
            label: 'Completion Rate (%)',
            data: completionPercentages,
            backgroundColor: completionPercentages.map((pct) =>
              pct === 100 ? '#10b981' : pct >= 50 ? '#6366f1' : '#f43f5e'
            ),
            borderColor: chartType === 'line' ? '#6366f1' : undefined,
            borderWidth: chartType === 'line' ? 2.5 : 0,
            fill: chartType === 'line' ? { target: 'origin', above: 'rgba(99, 102, 241, 0.12)' } : false,
            tension: 0.35,
            borderRadius: 6,
          },
        ],
      };
    chart.options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const idx = context.dataIndex;
                const summary = stats.summaries[idx];
                return ` ${context.parsed.y}% (${summary.completed}/${summary.total} tasks done)`;
              },
            },
          },
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { color: textColor, font: { family: 'Plus Jakarta Sans', size: 11 } },
          },
          y: {
            min: 0,
            max: 100,
            grid: { color: gridColor },
            ticks: {
              color: textColor,
              callback: (value) => `${value}%`,
              font: { family: 'Plus Jakarta Sans', size: 11 },
            },
          },
        },
      };
    chart.update();
  }, [stats, chartType, isDarkMode]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Title & High-level stats */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-neutral-200 dark:border-neutral-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              Velocity & Trendline Analytics
            </span>
            <span aria-hidden="true">·</span>
            <span>Multi-Week Cadence</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-neutral-950 dark:text-white" style={{ textWrap: 'balance' }}>
            Multi-Week Progress Board
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
            Historical analytics, week-over-week completion trajectory, and past task archives.
          </p>
        </div>

        {/* Global Summary Metrics */}
        <div className="flex items-center gap-3 text-xs shrink-0">
          <div className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
            <span className="text-neutral-500 dark:text-neutral-400">Mean Rate:</span>{' '}
            <strong className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums font-mono text-sm ml-1">
              {averageCompletion}%
            </strong>
          </div>
          <div className="px-3.5 py-2 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xs">
            <span className="text-neutral-500 dark:text-neutral-400">Tasks Cleared:</span>{' '}
            <strong className="text-neutral-950 dark:text-white font-bold tabular-nums font-mono text-sm ml-1">
              {totalCompletedAllTime}
            </strong>
          </div>
        </div>
      </div>

      {/* Demo Data Banner or Fresh Start Notice */}
      {hasPastDemoWeeks && onClearPastDemoWeeks && (
        <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
            <div>
              <p className="font-semibold text-amber-950 dark:text-amber-100">
                Notice: Previous weeks (Sep 6, Sep 13, Sep 20) are sample demo data
              </p>
              <p className="text-amber-800 dark:text-amber-300">
                They were pre-loaded so you could preview the completion charts immediately.
              </p>
            </div>
          </div>
          <button
            onClick={onClearPastDemoWeeks}
            className="px-3.5 py-1.5 font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors shrink-0"
          >
            Clear Sample History & Start Fresh
          </button>
        </div>
      )}

      {!hasPastDemoWeeks && weeks.length === 1 && (
        <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 flex items-center gap-3 text-xs text-emerald-900 dark:text-emerald-100">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <div>
            <strong>Starting fresh today (Week 1)!</strong> As you work through this week's plan and launch future weekly cycles, your trajectory will automatically chart here.
          </div>
        </div>
      )}

      {/* Chart Module */}
      <div className="p-6 rounded-xl border border-neutral-200/90 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/90 shadow-2xs space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-neutral-950 dark:text-white">
              Weekly Completion Trajectory
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
              100% (Green) · 50–99% (Amber) · &lt;50% (Red)
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-neutral-100/90 dark:bg-neutral-900/90 rounded-xl border border-neutral-200/60 dark:border-neutral-800/60 text-xs">
            <button
              onClick={() => setChartType('bar')}
              className={`px-3 py-1 font-medium rounded-lg transition-colors ${
                chartType === 'bar'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Bar View
            </button>
            <button
              onClick={() => setChartType('line')}
              className={`px-3 py-1 font-medium rounded-lg transition-colors ${
                chartType === 'line'
                  ? 'bg-white dark:bg-neutral-800 text-neutral-950 dark:text-white shadow-2xs font-semibold'
                  : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-950 dark:hover:text-white'
              }`}
            >
              Trend Line
            </button>
          </div>
        </div>

        <div className="h-64 sm:h-72 w-full relative">
          <canvas ref={chartRef} />
        </div>
      </div>

      {/* Weekly Summary Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-neutral-950 dark:text-white">
            Historical Week Archives ({totalWeeks} Weeks)
          </h2>
          <span className="text-xs text-neutral-400 font-medium">
            Click any card to inspect tasks or carry over
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedSummariesDesc.map(({ week, total: tot, completed: comp, remaining: unfin, percentage: pct }) => {

            return (
              <div
                key={week.id}
                onClick={() => setInspectingWeek(week)}
                className="group p-5 rounded-xl border border-neutral-200/90 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/90 hover:border-neutral-400 dark:hover:border-neutral-600 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400">
                      {formatWeekRange(week.sundayDate)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold tabular-nums font-mono ${
                        pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-neutral-500'
                      }`}>
                        {pct}% Done
                      </span>
                      {onDeleteWeek && weeks.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`Delete ${week.title}?`)) {
                              onDeleteWeek(week.id);
                            }
                          }}
                          className="p-1 text-neutral-400 hover:text-rose-600 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                          title="Delete this week"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-base font-bold text-neutral-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {week.title}
                  </h3>

                  {week.focusGoal && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 line-clamp-2 leading-relaxed">
                      {week.focusGoal}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-neutral-100 dark:border-neutral-800/80">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-neutral-50 dark:bg-neutral-800/50">
                      <span className="text-[10px] text-neutral-400 uppercase font-semibold block">Total</span>
                      <span className="text-sm font-bold text-neutral-900 dark:text-neutral-100 tabular-nums font-mono">
                        {tot}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20">
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-semibold block">Done</span>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
                        {comp}
                      </span>
                    </div>

                    <div className="p-2 rounded-lg bg-rose-50/50 dark:bg-rose-950/20">
                      <span className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-semibold block">Pending</span>
                      <span className="text-sm font-bold text-rose-600 dark:text-rose-400 tabular-nums font-mono">
                        {unfin}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-neutral-400 group-hover:text-neutral-700 dark:group-hover:text-neutral-200 transition-colors">
                    <span className="flex items-center gap-1 font-medium">
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect tasks</span>
                    </span>
                    <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Week Inspector Modal */}
      {inspectingWeek && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
              <div>
                <h3 className="font-display text-base font-bold text-neutral-950 dark:text-white">
                  {inspectingWeek.title}
                </h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                  {formatWeekRange(inspectingWeek.sundayDate)} · {inspectingWeek.tasks.filter((t) => t.completed).length} of {inspectingWeek.tasks.length} tasks completed
                </p>
              </div>

              <button
                onClick={() => setInspectingWeek(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Task list in past week */}
            <div className="p-6 overflow-y-auto space-y-3">
              {inspectingWeek.focusGoal && (
                <div className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 text-xs text-neutral-700 dark:text-neutral-300">
                  <strong className="text-neutral-900 dark:text-white">Focus Goal:</strong> {inspectingWeek.focusGoal}
                </div>
              )}

              <div className="divide-y divide-neutral-100 dark:divide-neutral-800 border border-neutral-200 dark:border-neutral-800 rounded-xl overflow-hidden">
                {inspectingWeek.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 flex items-start justify-between gap-3 bg-white dark:bg-neutral-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-neutral-400" />
                        )}
                      </div>
                      <div>
                        <span
                          className={`text-sm font-medium ${
                            task.completed
                              ? 'line-through text-neutral-400 dark:text-neutral-500'
                              : 'text-neutral-900 dark:text-neutral-100'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.notes && (
                          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                            {task.notes}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-[11px] text-neutral-400 mt-1">
                          <span>{task.category}</span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              task.priority === 'High'
                                ? 'text-rose-600 font-semibold'
                                : task.priority === 'Medium'
                                ? 'text-amber-600 font-semibold'
                                : 'text-blue-600 font-semibold'
                            }
                          >
                            {task.priority} Priority
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-xs font-semibold ${
                        task.completed
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-neutral-400 dark:text-neutral-500'
                      }`}
                    >
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between flex-wrap gap-2 shrink-0 bg-neutral-50 dark:bg-neutral-900">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    onSelectWeekToView(inspectingWeek.id);
                    setInspectingWeek(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200 bg-white dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
                >
                  <span>Open in Active View</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>

                {onDeleteWeek && weeks.length > 1 && (
                  <button
                    onClick={() => {
                      if (window.confirm(`Delete ${inspectingWeek.title}?`)) {
                        onDeleteWeek(inspectingWeek.id);
                        setInspectingWeek(null);
                      }
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Week</span>
                  </button>
                )}
              </div>

              {inspectingWeek.tasks.some((t) => !t.completed) && (
                <button
                  onClick={() => {
                    onCarryOverFromWeek(inspectingWeek.id);
                    setInspectingWeek(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
                >
                  <span>Carry Over Unfinished to Latest Week</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
