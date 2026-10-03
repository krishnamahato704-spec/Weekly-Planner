import { useMemo } from 'react';
import { ArrowUpRight, BookOpen, GraduationCap, Layers, Palette } from 'lucide-react';
import type { ProgramTab } from '../../types';

export function TrackGrid({ programs, onOpenProgram }: { programs: ProgramTab[]; onOpenProgram: (id: string) => void }) {
  const tracks = useMemo(() => programs.slice(0, 6).map(program => {
    let total = 0, complete = 0;
    const hasChapters = program.subjects?.some(subject => subject.chapters.length);
    if (hasChapters) {
      for (const subject of program.subjects ?? []) for (const chapter of subject.chapters) {
        total += 3;
        complete += Number(chapter.readingNotes) + Number(chapter.deepStudy) + Number(chapter.revision);
      }
    } else {
      for (const task of program.siTasks ?? []) {
        total += task.targetCount;
        complete += Math.min(task.currentCount, task.targetCount);
      }
    }
    return { program, total, complete, percentage: total ? Math.round(complete / total * 100) : 0, unit: hasChapters ? 'study steps' : 'activities' };
  }), [programs]);

  if (!tracks.length) return null;
  return <section aria-labelledby="portfolio-tracks-heading" className="portfolio-section">
    <header className="portfolio-section-header">
      <div><p className="eyebrow">Work in progress</p><h2 id="portfolio-tracks-heading" className="portfolio-section-title">Your learning tracks</h2></div>
      <button type="button" className="button button-secondary" onClick={() => onOpenProgram(programs[0].id)}>View all {programs.length} tracks<ArrowUpRight size={16} aria-hidden="true" /></button>
    </header>
    <div className="portfolio-track-grid">
      {tracks.map(({ program, total, complete, percentage, unit }, index) => {
        const Icon = program.type === 'canva' ? Palette : program.type === 'bed' ? GraduationCap : program.type === 'ma' ? BookOpen : Layers;
        return <article className="portfolio-track-card" key={program.id}>
          <div className="track-card-top"><span className="track-icon"><Icon size={23} aria-hidden="true" /></span><span className="track-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span></div>
          <p className="track-kind">{program.badge || 'Learning track'}</p>
          <h3 className="track-title">{program.title}</h3>
          <p className="track-description">{program.subtitle || `${program.subjects?.length ?? 0} subjects in your study plan`}</p>
          <div className="track-progress-label"><span>{complete} of {total} {unit}</span><strong>{percentage}%</strong></div>
          <progress className="track-progress" value={percentage} max={100} aria-label={`${program.title} progress`} />
          <button type="button" className="track-open" onClick={() => onOpenProgram(program.id)} aria-label={`Open ${program.title} track`}>Open track<ArrowUpRight size={17} aria-hidden="true" /></button>
        </article>;
      })}
    </div>
  </section>;
}
