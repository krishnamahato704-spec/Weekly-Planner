import React from 'react';
import {
  Check,
  Lock,
  Plus,
  FileText,
  RotateCcw,
  Sparkles,
  Link2,
  Calendar,
  ExternalLink,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';
import {
  NcertFlatChapter,
  NcertChapterProgress,
  ChapterNoteData,
  getChapterProgressPercent,
  isChapterComplete,
  getChapterRevisionCount,
  getLastRevisedDisplay,
  hasChapterNotes
} from '../utils/ncertData';

interface NcertChapterCardProps {
  chapter: NcertFlatChapter;
  progress?: NcertChapterProgress;
  notesData?: ChapterNoteData;
  onToggleActivity: (chapterId: string, activity: 'reading' | 'notes' | 'revision') => void;
  onRequestOverride: (chapterId: string, chapterTitle: string, activity: 'notes' | 'revision') => void;
  onOpenPlanModal: (chapter: NcertFlatChapter, initialActivity?: 'reading' | 'notes' | 'revision') => void;
  onOpenNotesModal: (chapter: NcertFlatChapter) => void;
  onOpenRevisionHistoryModal: (chapter: NcertFlatChapter) => void;
}

export const NcertChapterCard: React.FC<NcertChapterCardProps> = ({
  chapter,
  progress,
  notesData,
  onToggleActivity,
  onRequestOverride,
  onOpenPlanModal,
  onOpenNotesModal,
  onOpenRevisionHistoryModal,
}) => {
  const isReadingDone = !!progress?.reading;
  const isNotesDone = !!progress?.notes;
  const revCount = getChapterRevisionCount(progress);
  const isRevisionDone = revCount > 0;
  const isDone = isChapterComplete(progress);
  const progressPercent = getChapterProgressPercent(progress);
  const lastRevised = getLastRevisedDisplay(progress);
  const { hasText, hasLink } = hasChapterNotes(notesData);

  // Prerequisites logic (P1.2):
  // Notes is locked until Reading is complete
  const isNotesLocked = !isReadingDone;
  // Revision is locked until Reading and Notes are complete
  const isRevisionLocked = !isReadingDone || !isNotesDone;

  // Primary context-aware action (P1.5):
  // 1. If Reading incomplete: "Continue Reading"
  // 2. If Reading complete & Notes incomplete: "Create / Complete Notes"
  // 3. If Reading + Notes complete & never revised: "Start Revision"
  // 4. If chapter complete: "Revise Again"
  let primaryActionLabel = 'Continue Reading';
  let primaryActionActivity: 'reading' | 'notes' | 'revision' = 'reading';

  if (!isReadingDone) {
    primaryActionLabel = 'Continue Reading';
    primaryActionActivity = 'reading';
  } else if (!isNotesDone) {
    primaryActionLabel = hasText || hasLink ? 'Complete Notes' : 'Create Notes';
    primaryActionActivity = 'notes';
  } else if (!isRevisionDone) {
    primaryActionLabel = 'Start Revision';
    primaryActionActivity = 'revision';
  } else {
    primaryActionLabel = 'Revise Again';
    primaryActionActivity = 'revision';
  }

  const handlePrimaryAction = () => {
    if (primaryActionActivity === 'reading') {
      onToggleActivity(chapter.id, 'reading');
    } else if (primaryActionActivity === 'notes') {
      if (isNotesLocked) {
        onRequestOverride(chapter.id, chapter.title, 'notes');
      } else {
        onToggleActivity(chapter.id, 'notes');
      }
    } else if (primaryActionActivity === 'revision') {
      if (isRevisionLocked) {
        onRequestOverride(chapter.id, chapter.title, 'revision');
      } else {
        onToggleActivity(chapter.id, 'revision');
      }
    }
  };

  const handleNotesStageClick = () => {
    if (isNotesLocked) {
      onRequestOverride(chapter.id, chapter.title, 'notes');
    } else {
      onToggleActivity(chapter.id, 'notes');
    }
  };

  const handleRevisionStageClick = () => {
    if (isRevisionLocked) {
      onRequestOverride(chapter.id, chapter.title, 'revision');
    } else {
      onToggleActivity(chapter.id, 'revision');
    }
  };

  return (
    <div
      className={`group rounded-2xl border p-4 sm:p-5 transition-all duration-200 ${
        isDone
          ? 'bg-emerald-50/30 dark:bg-emerald-950/15 border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs'
          : 'bg-white dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 shadow-2xs'
      }`}
    >
      {/* ======================================================== */}
      {/* TOP ROW: Chapter Number, Title, Book Info, Status Badge  */}
      {/* ======================================================== */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0 flex-1">
          {/* Chapter Number Badge */}
          <span className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-display font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-slate-200/60 dark:border-slate-600/60">
            {chapter.chapterNumber < 10 ? `0${chapter.chapterNumber}` : chapter.chapterNumber}
          </span>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-snug tracking-tight">
              {chapter.title}
            </h4>

            {/* Subtle metadata: Book title & theme */}
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex-wrap">
              <span className="truncate">{chapter.bookTitle}</span>
              {chapter.theme && (
                <>
                  <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                  <span className="truncate text-slate-400 text-[11px]">{chapter.theme}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Progress percent & Completed badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {isDone ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 border border-emerald-300 dark:border-emerald-800 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Complete</span>
            </span>
          ) : (
            <span
              className={`px-2.5 py-1 text-xs font-bold rounded-lg border tabular-nums ${
                progressPercent > 0
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                  : 'bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
              }`}
            >
              {progressPercent}% Complete
            </span>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3-STAGE SEQUENCE: Reading -> Notes -> Revision           */}
      {/* ======================================================== */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
        {/* Stage 1: Reading (Always available) */}
        <button
          type="button"
          onClick={() => onToggleActivity(chapter.id, 'reading')}
          className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
            isReadingDone
              ? 'bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60 text-indigo-900 dark:text-indigo-200 font-semibold'
              : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-indigo-300'
          }`}
          aria-label={isReadingDone ? 'Reading complete' : 'Mark reading complete'}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm">📖</span>
            <span className="text-xs font-semibold">Reading</span>
          </div>
          <span
            className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs ${
              isReadingDone
                ? 'bg-indigo-600 border-indigo-600 text-white'
                : 'border-slate-300 dark:border-slate-600 text-transparent'
            }`}
          >
            <Check className="w-3.5 h-3.5 stroke-[3]" />
          </span>
        </button>

        {/* Stage 2: Notes (Locked until Reading complete) */}
        <button
          type="button"
          onClick={handleNotesStageClick}
          className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
            isNotesDone
              ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60 text-amber-900 dark:text-amber-200 font-semibold'
              : isNotesLocked
              ? 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 opacity-80 cursor-pointer'
              : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-300'
          }`}
          title={isNotesLocked ? 'Click to override: Complete Reading first' : undefined}
          aria-label={isNotesDone ? 'Notes complete' : isNotesLocked ? 'Notes locked: Complete Reading first' : 'Mark notes complete'}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">✍️</span>
            <div className="min-w-0">
              <span className="text-xs font-semibold block leading-tight">Notes</span>
              {isNotesLocked && !isNotesDone && (
                <span className="text-[10px] text-amber-600/90 dark:text-amber-400/90 font-medium block truncate">
                  Complete Reading first
                </span>
              )}
            </div>
          </div>
          <span
            className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs shrink-0 ${
              isNotesDone
                ? 'bg-amber-600 border-amber-600 text-white'
                : isNotesLocked
                ? 'border-slate-300/60 dark:border-slate-700 text-slate-400'
                : 'border-slate-300 dark:border-slate-600 text-transparent'
            }`}
          >
            {isNotesDone ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : isNotesLocked ? (
              <Lock className="w-3 h-3 text-slate-400" />
            ) : null}
          </span>
        </button>

        {/* Stage 3: Revision (Locked until Reading + Notes complete) */}
        <button
          type="button"
          onClick={handleRevisionStageClick}
          className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all min-h-[44px] ${
            isRevisionDone
              ? 'bg-teal-50/80 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60 text-teal-900 dark:text-teal-200 font-semibold'
              : isRevisionLocked
              ? 'bg-slate-100/50 dark:bg-slate-900/40 border-slate-200/50 dark:border-slate-800/60 text-slate-400 dark:text-slate-500 opacity-80 cursor-pointer'
              : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-teal-300'
          }`}
          title={isRevisionLocked ? 'Click to override: Complete Reading and Notes first' : undefined}
          aria-label={isRevisionDone ? `Revised ${revCount} times` : isRevisionLocked ? 'Revision locked: Complete Notes first' : 'Mark revision complete'}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm">🔄</span>
            <div className="min-w-0">
              <span className="text-xs font-semibold block leading-tight">
                {revCount > 1 ? `Revision (${revCount})` : 'Revision'}
              </span>
              {isRevisionLocked && !isRevisionDone ? (
                <span className="text-[10px] text-teal-600/90 dark:text-teal-400/90 font-medium block truncate">
                  Complete Notes first
                </span>
              ) : isRevisionDone && lastRevised ? (
                <span className="text-[10px] text-teal-700 dark:text-teal-300 font-medium block truncate">
                  Last: {lastRevised.label}
                </span>
              ) : null}
            </div>
          </div>
          <span
            className={`w-5 h-5 rounded-md flex items-center justify-center border text-xs shrink-0 ${
              isRevisionDone
                ? 'bg-teal-600 border-teal-600 text-white'
                : isRevisionLocked
                ? 'border-slate-300/60 dark:border-slate-700 text-slate-400'
                : 'border-slate-300 dark:border-slate-600 text-transparent'
            }`}
          >
            {isRevisionDone ? (
              <Check className="w-3.5 h-3.5 stroke-[3]" />
            ) : isRevisionLocked ? (
              <Lock className="w-3 h-3 text-slate-400" />
            ) : null}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* PROGRESS BAR & NOTES INDICATOR                           */}
      {/* ======================================================== */}
      <div className="mt-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Progress Bar */}
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-700/80 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${
                isDone
                  ? 'bg-emerald-500'
                  : 'bg-gradient-to-r from-indigo-500 via-amber-500 to-teal-500'
              }`}
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Notes Indicator Badge (P1.3) */}
        <div className="flex items-center gap-2 shrink-0">
          {hasLink ? (
            <button
              type="button"
              onClick={() => onOpenNotesModal(chapter)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-200/80 dark:border-indigo-800/60 rounded-md transition-colors"
              title="Open linked chapter notes and study resources"
            >
              <Link2 className="w-3 h-3" />
              <span>🔗 Notes linked</span>
            </button>
          ) : hasText ? (
            <button
              type="button"
              onClick={() => onOpenNotesModal(chapter)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200/80 dark:border-amber-800/60 rounded-md transition-colors"
              title="View saved notes"
            >
              <FileText className="w-3 h-3" />
              <span>📝 Notes saved</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onOpenNotesModal(chapter)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
              title="Add chapter notes or external link"
            >
              <FileText className="w-3 h-3 opacity-60" />
              <span>Notes</span>
            </button>
          )}

          {/* Revision history button if revisions exist */}
          {revCount > 0 && (
            <button
              type="button"
              onClick={() => onOpenRevisionHistoryModal(chapter)}
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-semibold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 dark:hover:bg-teal-900/60 border border-teal-200/80 dark:border-teal-800/60 rounded-md transition-colors"
              title="View past revision history entries"
            >
              <RotateCcw className="w-3 h-3" />
              <span>{revCount} {revCount === 1 ? 'rev' : 'revs'}</span>
            </button>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* BOTTOM ACTIONS: Primary Context-Aware Action & Secondary */}
      {/* ======================================================== */}
      <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap items-center justify-between gap-2.5">
        {/* Secondary: Plan Task in Weekly Plan */}
        <button
          type="button"
          onClick={() => onOpenPlanModal(chapter, primaryActionActivity)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50/80 hover:bg-indigo-100 dark:bg-indigo-950/50 dark:hover:bg-indigo-900/50 border border-indigo-200/80 dark:border-indigo-800/70 rounded-xl transition-colors min-h-[44px]"
          title="Schedule reading, notes, or revision into Weekly Plan"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Plan in Weekly</span>
        </button>

        {/* Primary Context-Aware Action Button */}
        <button
          type="button"
          onClick={handlePrimaryAction}
          className={`inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-xl transition-all shadow-xs min-h-[44px] ${
            isDone
              ? 'text-teal-700 dark:text-teal-200 bg-teal-50 hover:bg-teal-600 hover:text-white dark:bg-teal-950/60 dark:hover:bg-teal-600 border border-teal-200 dark:border-teal-800'
              : 'text-white bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20'
          }`}
        >
          <span>{primaryActionLabel}</span>
          <ChevronRight className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
