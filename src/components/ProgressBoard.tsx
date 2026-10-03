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
import { PageHeader, StatCard, SegmentedControl } from './ui/Primitives';

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

    const textColor = isDarkMode ? '#a1afc5' : '#637087';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';

    chart.data = {
        labels,
        datasets: [
          {
            label: 'Completion Rate (%)',
            data: completionPercentages,
            backgroundColor: completionPercentages.map((pct) =>
              pct === 100 ? (isDarkMode ? '#73d3b1' : '#15805e') : (isDarkMode ? '#a5b4fc' : '#4f46e5')
            ),
            borderColor: chartType === 'line' ? (isDarkMode ? '#a5b4fc' : '#4f46e5') : undefined,
            borderWidth: chartType === 'line' ? 2.5 : 0,
            fill: chartType === 'line' ? { target: 'origin', above: 'rgba(99, 102, 241, 0.12)' } : false,
            tension: 0.35,
            borderRadius: 6,
          },
        ],
      };
    chart.options = {
        animation: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? false : { duration: 350 },
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
      <PageHeader eyebrow="Your progress over time" title="Multi-Week Progress Board" description="Completion trends and task archives from your weekly plans." />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Average completion" value={averageCompletion + '%'} detail="Across all tasks in your plans" icon={<TrendingUp size={18} />} />
        <StatCard label="Tasks completed" value={totalCompletedAllTime} detail={totalTasksAllTime + ' tasks planned in total'} icon={<CheckCircle2 size={18} />} />
        <StatCard label="Weeks tracked" value={totalWeeks} detail="Weekly plans in your history" icon={<Calendar size={18} />} />
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
      <div className="surface p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Weekly Completion Trajectory
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Completion rate for each weekly plan. Green marks a finished week.
            </p>
          </div>

          <SegmentedControl label="Chart style" value={chartType} onChange={setChartType}
            options={[{ value: 'bar', label: 'Bar View' }, { value: 'line', label: 'Trend Line' }]} />
        </div>

        <div className="h-64 sm:h-72 w-full relative">
          <canvas role="img" aria-label="Weekly task completion rates. Exact values are listed in the week cards below." ref={chartRef} />
        </div>
      </div>

      {/* Weekly Summary Cards Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
            Historical Week Archives ({totalWeeks} Weeks)
          </h2>
          <span className="text-xs text-slate-400 font-medium">
            Click any card to inspect tasks or carry over
          </span>
        </div>

        <div className="card-grid gap-4">
          {sortedSummariesDesc.map(({ week, total: tot, completed: comp, remaining: unfin, percentage: pct }) => {

            return (
              <div
                key={week.id}
                onClick={() => setInspectingWeek(week)}
                className="group p-5 rounded-xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 hover:border-slate-400 dark:hover:border-slate-600 hover:shadow-xs transition-all cursor-pointer flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      {formatWeekRange(week.sundayDate)}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-semibold tabular-nums font-mono ${
                        pct === 100 ? 'text-emerald-600 dark:text-emerald-400' : pct >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500'
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
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                          title="Delete this week"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="font-display text-base font-bold text-slate-950 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                    {week.title}
                  </h3>

                  {week.focusGoal && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {week.focusGoal}
                    </p>
                  )}
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold block">Total</span>
                      <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tabular-nums font-mono">
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

                  <div className="flex items-center justify-between text-xs text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 transition-colors">
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
          <div className="modal-panel surface w-full max-w-2xl overflow-y-auto flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
              <div>
                <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
                  {inspectingWeek.title}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {formatWeekRange(inspectingWeek.sundayDate)} · {inspectingWeek.tasks.filter((t) => t.completed).length} of {inspectingWeek.tasks.length} tasks completed
                </p>
              </div>

              <button
                onClick={() => setInspectingWeek(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Close
              </button>
            </div>

            {/* Task list in past week */}
            <div className="p-4 sm:p-6 min-h-0 overflow-y-auto space-y-3">
              {inspectingWeek.focusGoal && (
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300">
                  <strong className="text-slate-900 dark:text-white">Focus Goal:</strong> {inspectingWeek.focusGoal}
                </div>
              )}

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden">
                {inspectingWeek.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3.5 flex flex-col sm:flex-row items-start justify-between gap-3 bg-white dark:bg-slate-900"
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <XCircle className="w-4 h-4 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <span
                          className={`text-sm font-medium ${
                            task.completed
                              ? 'line-through text-slate-400 dark:text-slate-500'
                              : 'text-slate-900 dark:text-slate-100'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.notes && (
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {task.notes}
                          </p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-1">
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
                          : 'text-slate-400 dark:text-slate-500'
                      }`}
                    >
                      {task.completed ? 'Completed' : 'Pending'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2 shrink-0 bg-slate-50 dark:bg-slate-900">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    onSelectWeekToView(inspectingWeek.id);
                    setInspectingWeek(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
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
