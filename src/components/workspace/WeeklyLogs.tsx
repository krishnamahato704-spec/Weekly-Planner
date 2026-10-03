import { useMemo } from 'react';
import { ArrowUpRight, CalendarDays } from 'lucide-react';
import type { WeekPlan } from '../../types';
import { formatWeekRange } from '../../utils/dateUtils';
import { summarizeTasks } from '../../utils/taskUtils';

export function WeeklyLogs({ weeks, activeWeekId, onSelectWeek, onViewHistory }: {
  weeks: WeekPlan[]; activeWeekId: string; onSelectWeek: (id: string) => void; onViewHistory: () => void;
}) {
  const logs = useMemo(() => [...weeks].sort((a, b) => b.sundayDate.localeCompare(a.sundayDate)).slice(0, 3)
    .map(week => ({ week, ...summarizeTasks(week.tasks) })), [weeks]);
  return <section aria-labelledby="weekly-logs-heading" className="portfolio-section">
    <header className="portfolio-section-header">
      <div><p className="eyebrow">Week by week</p><h2 id="weekly-logs-heading" className="portfolio-section-title">Weekly logs</h2></div>
      <button type="button" className="button button-secondary" onClick={onViewHistory}>View history<ArrowUpRight size={16} aria-hidden="true" /></button>
    </header>
    <div className="weekly-log-list">
      {logs.map(({ week, completed, total, percentage }) => <article className="weekly-log" key={week.id}>
        <div className="log-calendar" aria-hidden="true"><CalendarDays size={24} /></div>
        <div className="log-content"><time className="log-date" dateTime={week.sundayDate}>{formatWeekRange(week.sundayDate)}</time><h3 className="log-title">{week.title}</h3><p className="log-description">{week.focusGoal || `${total} planned tasks for this week`}</p></div>
        <div className="log-result"><strong>{percentage}%</strong><span>{completed}/{total} complete</span></div>
        <button type="button" className="icon-button log-open" onClick={() => onSelectWeek(week.id)} aria-label={`Open weekly log: ${week.title}`} title="Open weekly log"><ArrowUpRight size={20} aria-hidden="true" /></button>
        {week.id === activeWeekId && <span className="log-selected">Selected week</span>}
      </article>)}
    </div>
  </section>;
}
