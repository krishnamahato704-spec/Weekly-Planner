import { ArrowDown, CalendarDays, ChevronDown, Plus } from 'lucide-react';
import type { WeekPlan } from '../../types';
import { formatWeekRange } from '../../utils/dateUtils';
import { CompletionGauge } from '../CompletionGauge';

interface WorkspaceHeroProps {
  week: WeekPlan;
  options: { id: string; title: string; completed: number; total: number }[];
  completed: number;
  total: number;
  percentage: number;
  onSelectWeek: (id: string) => void;
  onNewWeek: () => void;
}

export function WorkspaceHero({ week, options, completed, total, percentage, onSelectWeek, onNewWeek }: WorkspaceHeroProps) {
  return <header className="workspace-hero">
    <div className="hero-intro">
      <p className="eyebrow hero-eyebrow"><span className="status-dot" aria-hidden="true" />Weekly portfolio</p>
      <h1 className="hero-title">Your week,<br /><span>in focus.</span></h1>
      <p className="hero-description">A place for your plans, your learning, and the work you’re moving forward.</p>
      <div className="hero-actions">
        <div className="relative week-select">
          <select aria-label="Select weekly plan" className="field pr-9" value={week.id} onChange={event => onSelectWeek(event.target.value)}>
            {options.map(plan => <option key={plan.id} value={plan.id}>{plan.title} ({plan.completed}/{plan.total})</option>)}
          </select>
          <ChevronDown aria-hidden="true" size={16} className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted" />
        </div>
        <button type="button" className="button button-primary" onClick={onNewWeek}><Plus aria-hidden="true" size={17} />New Week</button>
      </div>
      <a className="hero-task-link" href="#tasks-heading">Go to this week’s tasks<ArrowDown size={15} aria-hidden="true" /></a>
    </div>
    <div className="hero-summary">
      <p className="hero-date"><CalendarDays aria-hidden="true" size={16} />{formatWeekRange(week.sundayDate)}</p>
      <div className="hero-gauge"><CompletionGauge percentage={percentage} size={164} strokeWidth={8} /></div>
      <p className="hero-summary-title">{completed} <span>of {total} tasks complete</span></p>
      <p className="hero-summary-note">{total === 0 ? 'Your next plan starts with one task.' : completed === total ? 'All planned tasks are complete.' : `${total - completed} tasks ready for your attention.`}</p>
    </div>
  </header>;
}
