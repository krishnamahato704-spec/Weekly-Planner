import React, { useState, useEffect } from 'react';
import { 
  ProgramTab, 
  SchoolInternshipTask, 
  SubjectModule, 
  ChapterItem 
} from '../types';
import { 
  CheckSquare, 
  BookOpen, 
  Calendar, 
  Plus, 
  Check, 
  Sparkles, 
  GraduationCap, 
  FileText, 
  School, 
  TrendingUp, 
  Layers, 
  Trash2, 
  ExternalLink,
  PlusCircle,
  Clock,
  ArrowRight,
  CheckCircle2,
  ChevronRight
} from 'lucide-react';

interface ProgramTrackViewProps {
  program: ProgramTab;
  onUpdateProgram: (updatedProgram: ProgramTab) => void;
  onSendTaskToWeeklyPlan: (title: string, category: string, notes?: string) => void;
  onTriggerConfetti: () => void;
  onFinishTaskAlert: (itemTitle: string) => void;
}

export const ProgramTrackView: React.FC<ProgramTrackViewProps> = ({
  program,
  onUpdateProgram,
  onSendTaskToWeeklyPlan,
  onTriggerConfetti,
  onFinishTaskAlert,
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(
    program.subjects && program.subjects.length > 0 ? program.subjects[0].id : ''
  );

  useEffect(() => {
    if (program.subjects && program.subjects.length > 0) {
      if (!program.subjects.some((s) => s.id === selectedSubjectId)) {
        setSelectedSubjectId(program.subjects[0].id);
      }
    } else {
      setSelectedSubjectId('');
    }
  }, [program.id, program.subjects, selectedSubjectId]);
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [newSubjectCode, setNewSubjectCode] = useState('');
  const [newSubjectName, setNewSubjectName] = useState('');

  // Calculations for SI Tasks (if B.Ed)
  const siTasks = program.siTasks || [];
  const totalSiTarget = siTasks.reduce((acc, t) => acc + t.targetCount, 0);
  const totalSiCompleted = siTasks.reduce((acc, t) => acc + Math.min(t.currentCount, t.targetCount), 0);
  const siPercentage = totalSiTarget === 0 ? 0 : Math.round((totalSiCompleted / totalSiTarget) * 100);

  // Calculations for Subjects & Chapters
  const allChapters = (program.subjects || []).flatMap((s) => s.chapters);
  const totalChapters = allChapters.length;
  const finishedChapters = allChapters.filter((c) => c.isFinished).length;
  const totalChecklistItems = totalChapters * 3;
  const completedChecklistItems = allChapters.reduce(
    (acc, c) => acc + (c.readingNotes ? 1 : 0) + (c.deepStudy ? 1 : 0) + (c.revision ? 1 : 0),
    0
  );
  const chaptersPercentage = totalChecklistItems === 0
    ? 0
    : Math.round((completedChecklistItems / totalChecklistItems) * 100);

  // Handle updating an SI task counter
  const handleUpdateSiCount = (taskId: string, delta: number) => {
    const updatedSi = siTasks.map((task) => {
      if (task.id === taskId) {
        const nextCount = Math.max(0, task.currentCount + delta);
        const isComplete = nextCount >= task.targetCount;
        return {
          ...task,
          currentCount: nextCount,
          status: isComplete ? ('completed' as const) : nextCount > 0 ? ('in_progress' as const) : ('pending' as const),
          finishedAt: isComplete && !task.finishedAt ? new Date().toISOString() : task.finishedAt,
        };
      }
      return task;
    });

    onUpdateProgram({ ...program, siTasks: updatedSi });
  };

  // Toggle SI Task as finished directly
  const handleToggleSiFinish = (taskId: string) => {
    const updatedSi = siTasks.map((task) => {
      if (task.id === taskId) {
        const willBeComplete = task.status !== 'completed';
        if (willBeComplete) {
          onTriggerConfetti();
          onFinishTaskAlert(`B.Ed: ${task.title} finished!`);
        }
        return {
          ...task,
          currentCount: willBeComplete ? task.targetCount : 0,
          status: willBeComplete ? ('completed' as const) : ('pending' as const),
          finishedAt: willBeComplete ? new Date().toISOString() : undefined,
        };
      }
      return task;
    });

    onUpdateProgram({ ...program, siTasks: updatedSi });
  };

  // Toggle 3-Stage Checklist on chapter
  const handleToggleChecklist = (
    subjectId: string,
    chapterId: string,
    stage: 'readingNotes' | 'deepStudy' | 'revision'
  ) => {
    if (!program.subjects) return;

    const updatedSubjects = program.subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;

      const updatedChapters = sub.chapters.map((chap) => {
        if (chap.id !== chapterId) return chap;

        const nextVal = !chap[stage];
        const nextChap = { ...chap, [stage]: nextVal };

        // If all 3 stages checked, auto-finish
        const allThree = (stage === 'readingNotes' ? nextVal : chap.readingNotes) &&
                         (stage === 'deepStudy' ? nextVal : chap.deepStudy) &&
                         (stage === 'revision' ? nextVal : chap.revision);

        if (allThree && !chap.isFinished) {
          nextChap.isFinished = true;
          nextChap.finishedAt = new Date().toISOString();
          onTriggerConfetti();
          onFinishTaskAlert(`${sub.name} - Chapter ${chap.chapterNumber}: ${chap.title} marked Finished!`);
        }

        return nextChap;
      });

      return { ...sub, chapters: updatedChapters };
    });

    onUpdateProgram({ ...program, subjects: updatedSubjects });
  };

  // Explicitly toggle finish on a chapter
  const handleFinishChapter = (subjectId: string, chapterId: string) => {
    if (!program.subjects) return;

    const updatedSubjects = program.subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;

      const updatedChapters = sub.chapters.map((chap) => {
        if (chap.id !== chapterId) return chap;

        const willFinish = !chap.isFinished;
        if (willFinish) {
          onTriggerConfetti();
          onFinishTaskAlert(`${sub.name} - Chapter ${chap.chapterNumber}: ${chap.title} recorded in Dashboard Report!`);
        }

        return {
          ...chap,
          isFinished: willFinish,
          readingNotes: willFinish ? true : chap.readingNotes,
          deepStudy: willFinish ? true : chap.deepStudy,
          revision: willFinish ? true : chap.revision,
          finishedAt: willFinish ? new Date().toISOString() : undefined,
        };
      });

      return { ...sub, chapters: updatedChapters };
    });

    onUpdateProgram({ ...program, subjects: updatedSubjects });
  };

  // Add chapter to subject
  const handleAddChapterSubmit = (e: React.FormEvent, subjectId: string) => {
    e.preventDefault();
    if (!newChapterTitle.trim() || !program.subjects) return;

    const updatedSubjects = program.subjects.map((sub) => {
      if (sub.id !== subjectId) return sub;
      const nextNum = sub.chapters.length + 1;
      const newChap: ChapterItem = {
        id: `chap-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        chapterNumber: nextNum,
        title: newChapterTitle.trim(),
        readingNotes: false,
        deepStudy: false,
        revision: false,
        isFinished: false,
      };
      return { ...sub, chapters: [...sub.chapters, newChap] };
    });

    onUpdateProgram({ ...program, subjects: updatedSubjects });
    setNewChapterTitle('');
    setIsAddingChapter(false);
  };

  // Add new subject to program
  const handleAddSubjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;

    const newSub: SubjectModule = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      code: newSubjectCode.trim() || undefined,
      name: newSubjectName.trim(),
      chapters: [],
    };

    const nextSubjects = [...(program.subjects || []), newSub];
    onUpdateProgram({ ...program, subjects: nextSubjects });
    setSelectedSubjectId(newSub.id);
    setNewSubjectCode('');
    setNewSubjectName('');
    setIsAddingSubject(false);
  };

  const activeSubject = (program.subjects || []).find((s) => s.id === selectedSubjectId) || program.subjects?.[0];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="p-6 rounded-xl border border-neutral-200/90 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-400 mb-1.5">
            <span className="font-semibold text-neutral-900 dark:text-neutral-200">
              {program.badge || program.type.toUpperCase()}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {program.subjects ? `${program.subjects.length} Subjects / Modules` : 'Internship Deliverables'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">
              3-Stage Mastery Matrix
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-neutral-950 dark:text-white" style={{ textWrap: 'balance' }}>
            {program.title}
          </h1>
          {program.subtitle && (
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-2xl leading-relaxed">
              {program.subtitle}
            </p>
          )}
        </div>

        {/* Aggregate Progress Module */}
        <div className="flex items-center gap-5 p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/70 dark:border-neutral-700/60 shrink-0 shadow-2xs">
          <div>
            <span className="text-[11px] text-neutral-400 uppercase font-semibold tracking-wider block">
              {program.siTasks ? 'SI Unit Target' : 'Checklist Progress'}
            </span>
            <div className="text-2xl font-extrabold text-neutral-950 dark:text-white mt-0.5 tabular-nums font-mono">
              {program.siTasks ? `${siPercentage}%` : `${chaptersPercentage}%`}
            </div>
            <span className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums font-mono">
              {program.siTasks
                ? `${totalSiCompleted} / ${totalSiTarget} units`
                : `${finishedChapters} / ${totalChapters} chapters done`}
            </span>
          </div>

          <div className="w-14 h-14 relative flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="40" stroke="currentColor" strokeWidth={8} className="text-neutral-200 dark:text-neutral-700" fill="transparent" />
              <circle
                cx="50"
                cy="50"
                r="40"
                stroke="currentColor"
                strokeWidth={8}
                strokeDasharray={251.2}
                strokeDashoffset={251.2 - (251.2 * (program.siTasks ? siPercentage : chaptersPercentage)) / 100}
                strokeLinecap="round"
                className="text-emerald-500 transition-all duration-700"
                fill="transparent"
              />
            </svg>
            <span className="absolute text-[11px] font-bold tabular-nums font-mono">
              {program.siTasks ? `${siPercentage}%` : `${chaptersPercentage}%`}
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: School Internship (SI) Tasks (for B.Ed) */}
      {program.siTasks && program.siTasks.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-neutral-900 dark:text-white">
                School Internship (SI) Tasks & Reports
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Target milestones: Lesson Plans (50), Reflective Journals (20), Peer Observations (20), Activities & Diagnostic Tests
              </p>
            </div>
            <div className="text-xs text-neutral-500 dark:text-neutral-400 tabular-nums font-mono">
              <strong className="text-neutral-900 dark:text-white font-semibold">
                {siTasks.filter((t) => t.status === 'completed').length} / {siTasks.length}
              </strong>{' '}
              milestones finished
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {siTasks.map((task) => {
              const isFinished = task.status === 'completed';
              const pct = Math.min(100, Math.round((task.currentCount / task.targetCount) * 100));

              return (
                <div
                  key={task.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between space-y-3 ${
                    isFinished
                      ? 'border-emerald-300 dark:border-emerald-800/70 bg-emerald-50/20 dark:bg-emerald-950/20'
                      : 'border-neutral-200/90 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/90 shadow-2xs hover:border-neutral-300 dark:hover:border-neutral-700'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <h3 className="text-sm font-semibold text-neutral-950 dark:text-white">
                        {task.title}
                      </h3>
                      <span className="text-xs font-semibold tabular-nums font-mono text-neutral-600 dark:text-neutral-300">
                        {task.currentCount} / {task.targetCount}
                      </span>
                    </div>
                    {task.notes && (
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                        {task.notes}
                      </p>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isFinished ? 'bg-emerald-500' : 'bg-neutral-900 dark:bg-neutral-100'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>

                  {/* Actions Bar */}
                  <div className="flex items-center justify-between pt-2 border-t border-neutral-100 dark:border-neutral-800/80 text-xs">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleUpdateSiCount(task.id, -1)}
                        disabled={task.currentCount <= 0}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors"
                        aria-label="Decrease count"
                      >
                        -
                      </button>
                      <button
                        onClick={() => handleUpdateSiCount(task.id, 1)}
                        disabled={task.currentCount >= task.targetCount}
                        className="w-6 h-6 flex items-center justify-center rounded-md bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 font-bold disabled:opacity-30 disabled:cursor-not-allowed text-xs transition-colors"
                        aria-label="Increase count"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          onSendTaskToWeeklyPlan(
                            `B.Ed: Work on ${task.title} (Target: ${task.targetCount})`,
                            'B.Ed SI',
                            task.notes
                          )
                        }
                        className="text-[11px] text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 font-semibold transition-colors"
                        title="Add this milestone into active Weekly Plan"
                      >
                        + Weekly Plan
                      </button>
                      <button
                        onClick={() => handleToggleSiFinish(task.id)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors flex items-center gap-1 ${
                          isFinished
                            ? 'bg-emerald-600 text-white'
                            : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-neutral-200 dark:hover:bg-neutral-700'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>{isFinished ? 'Finished ✓' : 'Finish'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 2: Subject Modules & 3-Checklist Chapter Lists */}
      {program.subjects && program.subjects.length > 0 && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-neutral-800 pb-3">
            <div>
              <h2 className="font-display text-base font-bold text-neutral-900 dark:text-white">
                Curriculum Subjects & 3-Stage Chapter Checklist
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                Stage 1: Reading & Notes · Stage 2: Deep Study · Stage 3: Revision
              </p>
            </div>

            <button
              onClick={() => setIsAddingSubject(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-700 dark:text-neutral-300 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-lg hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors shrink-0"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Subject</span>
            </button>
          </div>

          {/* Subject Switcher Strip */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none text-xs">
            {program.subjects.map((sub) => {
              const isSelected = sub.id === (activeSubject?.id || '');
              const totalChaps = sub.chapters.length;
              const finChaps = sub.chapters.filter((c) => c.isFinished).length;

              return (
                <button
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`px-3 py-1.5 rounded-lg font-medium transition-all shrink-0 flex items-center gap-2 border ${
                    isSelected
                      ? 'bg-neutral-950 text-white border-neutral-950 dark:bg-white dark:text-neutral-950 dark:border-white shadow-2xs font-semibold'
                      : 'bg-white text-neutral-600 border-neutral-200 dark:bg-neutral-900 dark:text-neutral-400 dark:border-neutral-800 hover:text-neutral-950 dark:hover:text-white'
                  }`}
                >
                  {sub.code && <span className="font-mono text-[11px] opacity-75">{sub.code}</span>}
                  <span>{sub.name}</span>
                  <span className="text-[11px] opacity-60 tabular-nums font-mono">
                    ({finChaps}/{totalChaps})
                  </span>
                </button>
              );
            })}
          </div>

          {/* Active Subject Details & Chapter List */}
          {activeSubject && (
            <div className="p-5 sm:p-6 rounded-xl border border-neutral-200/90 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/90 shadow-2xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-100 dark:border-neutral-800/80 pb-4">
                <div>
                  <div className="flex items-baseline gap-2">
                    {activeSubject.code && (
                      <span className="font-mono text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        {activeSubject.code}
                      </span>
                    )}
                    <h3 className="font-display text-lg font-bold text-neutral-950 dark:text-white">
                      {activeSubject.name}
                    </h3>
                  </div>
                  {activeSubject.description && (
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      {activeSubject.description}
                    </p>
                  )}
                </div>

                <button
                  onClick={() => setIsAddingChapter(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-neutral-950 hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-950 dark:hover:bg-white rounded-lg transition-colors shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Chapter</span>
                </button>
              </div>

              {/* Add Chapter Inline Form */}
              {isAddingChapter && (
                <form
                  onSubmit={(e) => handleAddChapterSubmit(e, activeSubject.id)}
                  className="p-3.5 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-700 flex items-center gap-2.5 animate-in fade-in"
                >
                  <input
                    type="text"
                    required
                    value={newChapterTitle}
                    onChange={(e) => setNewChapterTitle(e.target.value)}
                    placeholder={`Enter Chapter ${activeSubject.chapters.length + 1} topic title...`}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddingChapter(false)}
                    className="px-3 py-1.5 text-xs text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300"
                  >
                    Cancel
                  </button>
                </form>
              )}

              {/* Chapters List with 3-Stage Checklist */}
              <div className="space-y-2.5">
                {activeSubject.chapters.map((chap) => {
                  const isFullyFinished = chap.isFinished;

                  return (
                    <div
                      key={chap.id}
                      className={`p-3.5 sm:p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3.5 ${
                        isFullyFinished
                          ? 'border-emerald-300/80 dark:border-emerald-800/80 bg-emerald-50/20 dark:bg-emerald-950/20'
                          : 'border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900/90 hover:border-neutral-300 dark:hover:border-neutral-700 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <span className="font-mono text-xs font-bold text-neutral-400 mt-0.5 shrink-0 tabular-nums">
                          {chap.chapterNumber < 10 ? `0${chap.chapterNumber}` : chap.chapterNumber}.
                        </span>

                        <div className="flex-1 min-w-0">
                          <h4
                            className={`text-sm font-semibold truncate ${
                              isFullyFinished
                                ? 'text-emerald-950 dark:text-emerald-200 line-through opacity-75'
                                : 'text-neutral-900 dark:text-white'
                            }`}
                          >
                            {chap.title}
                          </h4>

                          {isFullyFinished && chap.finishedAt && (
                            <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium block mt-0.5 tabular-nums font-mono">
                              Mastered & Audited · {new Date(chap.finishedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 3-Stage Checklist Toggles */}
                      <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
                        {/* 1. Reading & Notes */}
                        <label
                          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border cursor-pointer select-none transition-colors ${
                            chap.readingNotes
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 font-semibold'
                              : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={chap.readingNotes}
                            onChange={() => handleToggleChecklist(activeSubject.id, chap.id, 'readingNotes')}
                            className="w-3.5 h-3.5 text-emerald-600 rounded cursor-pointer"
                          />
                          <span>1. Notes</span>
                        </label>

                        {/* 2. Deep Study */}
                        <label
                          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border cursor-pointer select-none transition-colors ${
                            chap.deepStudy
                              ? 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800 font-semibold'
                              : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={chap.deepStudy}
                            onChange={() => handleToggleChecklist(activeSubject.id, chap.id, 'deepStudy')}
                            className="w-3.5 h-3.5 text-blue-600 rounded cursor-pointer"
                          />
                          <span>2. Deep Study</span>
                        </label>

                        {/* 3. Revision */}
                        <label
                          className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border cursor-pointer select-none transition-colors ${
                            chap.revision
                              ? 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800 font-semibold'
                              : 'bg-neutral-50 text-neutral-600 border-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:border-neutral-700 hover:border-neutral-400'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={chap.revision}
                            onChange={() => handleToggleChecklist(activeSubject.id, chap.id, 'revision')}
                            className="w-3.5 h-3.5 text-purple-600 rounded cursor-pointer"
                          />
                          <span>3. Revision</span>
                        </label>

                        {/* Action: Add to Weekly Plan */}
                        <button
                          onClick={() =>
                            onSendTaskToWeeklyPlan(
                              `${activeSubject.code || activeSubject.name}: Ch ${chap.chapterNumber} - ${chap.title}`,
                              program.title,
                              '3-Stage Study Goal'
                            )
                          }
                          className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Schedule this chapter into active Weekly Plan"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                        </button>

                        {/* Finish Task Button */}
                        <button
                          onClick={() => handleFinishChapter(activeSubject.id, chap.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg transition-all shadow-2xs ${
                            isFullyFinished
                              ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                              : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 hover:bg-emerald-600 hover:text-white'
                          }`}
                        >
                          <Check className="w-3 h-3" />
                          <span>{isFullyFinished ? 'Finished ✓' : 'Finish'}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Subject Modal */}
          {isAddingSubject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
              <div className="w-full max-w-md bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl p-6 space-y-4">
                <h3 className="text-base font-bold text-neutral-950 dark:text-white">
                  Add Subject to {program.title}
                </h3>
                <form onSubmit={handleAddSubjectSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Subject Code (Optional, e.g. MHI 112)
                    </label>
                    <input
                      type="text"
                      value={newSubjectCode}
                      onChange={(e) => setNewSubjectCode(e.target.value)}
                      placeholder="e.g. MHI 112"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-neutral-600 dark:text-neutral-400 mb-1">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newSubjectName}
                      onChange={(e) => setNewSubjectName(e.target.value)}
                      placeholder="e.g. Modern Historiography"
                      className="w-full px-3 py-2 text-sm rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                    <button
                      type="button"
                      onClick={() => setIsAddingSubject(false)}
                      className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-lg hover:bg-emerald-700 shadow-sm"
                    >
                      Add Subject
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
