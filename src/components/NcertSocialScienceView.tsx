import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Filter,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  TrendingUp,
  Bookmark,
  CheckSquare,
  Square,
  Clock,
  Compass,
  Download,
  Upload,
  Settings,
  Award,
  ExternalLink,
} from 'lucide-react';
import {
  NCERT_CLASSES_DATA,
  ALL_NCERT_CHAPTERS,
  TOTAL_NCERT_BOOKS,
  TOTAL_NCERT_CHAPTERS,
  TOTAL_NCERT_TASKS,
  NcertBook,
  NcertChapter,
  NcertFlatChapter,
  NcertProgressStore,
  NcertNotesStore,
  ChapterNoteData,
  getChapterProgressPercent,
  isChapterComplete,
  isBookComplete,
  getChapterRevisionCount,
} from '../utils/ncertData';
import { NcertAddToWeeklyPlanModal } from './NcertAddToWeeklyPlanModal';
import { NcertResetConfirmModal } from './NcertResetConfirmModal';
import { NcertBackupModal } from './NcertBackupModal';
import { NcertChapterCard } from './NcertChapterCard';
import { NcertChapterNotesModal } from './NcertChapterNotesModal';
import { NcertRevisionHistoryModal } from './NcertRevisionHistoryModal';
import { NcertPrerequisiteOverrideModal } from './NcertPrerequisiteOverrideModal';
import { Priority } from '../types';

interface NcertSocialScienceViewProps {
  progressStore: NcertProgressStore;
  notesStore?: NcertNotesStore;
  onToggleActivity: (chapterId: string, activity: 'reading' | 'notes' | 'revision') => void;
  onResetProgress: () => void;
  onImportProgress: (importedStore: NcertProgressStore) => void;
  onSaveChapterNotes?: (chapterId: string, data: ChapterNoteData) => void;
  onAddRevisionEvent?: (chapterId: string, notes?: string) => void;
  onRemoveRevisionEvent?: (chapterId: string, eventId: string) => void;
  activeWeekTitle: string;
  onAddWeeklyTask: (taskData: {
    title: string;
    category: string;
    priority: Priority;
    notes?: string;
    scheduledDate?: string;
    startTime?: string;
    estimatedMinutes?: number;
    ncertRef: {
      classNum: number;
      subject: string;
      bookTitle: string;
      bookId?: string;
      chapterId: string;
      chapterTitle: string;
      activity: 'reading' | 'notes' | 'revision';
    };
  }) => void;
}

type FilterStatus =
  | 'all'
  | 'not_started'
  | 'in_progress'
  | 'reading_pending'
  | 'notes_pending'
  | 'revision_pending'
  | 'completed';

export const NcertSocialScienceView: React.FC<NcertSocialScienceViewProps> = ({
  progressStore,
  notesStore = {},
  onToggleActivity,
  onResetProgress,
  onImportProgress,
  onSaveChapterNotes = () => {},
  onAddRevisionEvent = () => {},
  onRemoveRevisionEvent = () => {},
  activeWeekTitle,
  onAddWeeklyTask,
}) => {
  // Navigation & Filtering State
  // Default to Class 6 (or remembered class) to prevent continuous scrolling down of all 212 chapters
  const [selectedClassNum, setSelectedClassNum] = useState<number | 'all'>(() => {
    try {
      const saved = localStorage.getItem('ncert_active_class');
      if (saved) {
        if (saved === 'all') return 'all';
        const num = parseInt(saved, 10);
        if (!isNaN(num) && num >= 6 && num <= 12) return num;
      }
    } catch {
      // fallback
    }
    return 6;
  });
  const [selectedSubject, setSelectedSubject] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [directoryViewMode, setDirectoryViewMode] = useState<'cards' | 'flat'>('cards');

  // Accordion state (expanded book IDs)
  // By default, expand first 2 books of the active view so user sees content immediately
  const [expandedBookIds, setExpandedBookIds] = useState<Record<string, boolean>>(() => ({
    'c6-b1': true,
    'c7-b1': true,
    'c8-b1': true,
    'c9-hist': true,
    'c10-hist': true,
    'c11-hist': true,
    'c12-hist1': true,
  }));

  // Modals state
  const [addToPlanModal, setAddToPlanModal] = useState<{
    isOpen: boolean;
    chapter: NcertFlatChapter | null;
    initialActivity?: 'reading' | 'notes' | 'revision';
  }>({
    isOpen: false,
    chapter: null,
  });

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);

  // Chapter Notes Modal state (P1.3)
  const [activeNotesChapter, setActiveNotesChapter] = useState<NcertFlatChapter | null>(null);

  // Revision History Modal state (P1.4)
  const [activeHistoryChapter, setActiveHistoryChapter] = useState<NcertFlatChapter | null>(null);

  // Prerequisite Override Confirmation Modal state (P1.2)
  const [overrideModal, setOverrideModal] = useState<{
    isOpen: boolean;
    chapterId: string;
    chapterTitle: string;
    activity: 'notes' | 'revision';
  }>({
    isOpen: false,
    chapterId: '',
    chapterTitle: '',
    activity: 'notes',
  });

  // Toggle book accordion
  const toggleBook = (bookId: string) => {
    setExpandedBookIds((prev) => ({
      ...prev,
      [bookId]: !prev[bookId],
    }));
  };

  const expandAllBooks = () => {
    const allIds: Record<string, boolean> = {};
    NCERT_CLASSES_DATA.forEach((c) => {
      c.books.forEach((b) => {
        allIds[b.id] = true;
      });
    });
    setExpandedBookIds(allIds);
  };

  const collapseAllBooks = () => {
    setExpandedBookIds({});
  };

  // Class Selection & Sub-Section Navigation
  const handleSelectClass = (clsNum: number | 'all') => {
    setSelectedClassNum(clsNum);
    setSelectedSubject('all');
    try {
      localStorage.setItem('ncert_active_class', String(clsNum));
    } catch {
      // ignore storage errors
    }
    if (typeof clsNum === 'number') {
      const cls = NCERT_CLASSES_DATA.find((c) => c.classNum === clsNum);
      if (cls) {
        setExpandedBookIds((prev) => {
          const next = { ...prev };
          cls.books.forEach((b) => {
            next[b.id] = true;
          });
          return next;
        });
      }
    }
  };

  const classNumbers = [6, 7, 8, 9, 10, 11, 12];
  const currentClassIndex = typeof selectedClassNum === 'number' ? classNumbers.indexOf(selectedClassNum) : -1;
  const prevClassNum = currentClassIndex > 0 ? classNumbers[currentClassIndex - 1] : null;
  const nextClassNum = currentClassIndex >= 0 && currentClassIndex < classNumbers.length - 1 ? classNumbers[currentClassIndex + 1] : null;

  const handlePrevClass = () => {
    if (prevClassNum) handleSelectClass(prevClassNum);
  };

  const handleNextClass = () => {
    if (nextClassNum) handleSelectClass(nextClassNum);
  };

  const activeClassData = useMemo(() => {
    if (typeof selectedClassNum !== 'number') return null;
    return NCERT_CLASSES_DATA.find((c) => c.classNum === selectedClassNum) || null;
  }, [selectedClassNum]);

  // Subjects available in the active class (or all if directory)
  const availableSubjectsInActiveClass = useMemo(() => {
    if (!activeClassData) {
      const set = new Set<string>();
      NCERT_CLASSES_DATA.forEach((c) => c.books.forEach((b) => set.add(b.subject)));
      return Array.from(set);
    }
    const set = new Set<string>();
    activeClassData.books.forEach((b) => set.add(b.subject));
    return Array.from(set);
  }, [activeClassData]);

  const expandActiveBooks = () => {
    if (selectedClassNum === 'all') {
      expandAllBooks();
    } else if (activeClassData) {
      setExpandedBookIds((prev) => {
        const next = { ...prev };
        activeClassData.books.forEach((b) => {
          next[b.id] = true;
        });
        return next;
      });
    }
  };

  const collapseActiveBooks = () => {
    if (selectedClassNum === 'all') {
      collapseAllBooks();
    } else if (activeClassData) {
      setExpandedBookIds((prev) => {
        const next = { ...prev };
        activeClassData.books.forEach((b) => {
          delete next[b.id];
        });
        return next;
      });
    }
  };

  // ---------------------------------------------------------------------------
  // DYNAMIC COMPUTATIONS (Calculated directly from live checkbox store)
  // ---------------------------------------------------------------------------
  const {
    totalReadingCount,
    totalNotesCount,
    totalRevisionCount,
    totalCompletedActivities,
    overallPercent,
    completedChaptersCount,
    completedBooksCount,
    classStats,
  } = useMemo(() => {
    let readingCount = 0;
    let notesCount = 0;
    let revisionCount = 0;
    let compChapters = 0;

    const statsByClass: Record<
      number,
      {
        totalChapters: number;
        completedChapters: number;
        totalBooks: number;
        completedBooks: number;
        totalActivities: number;
        completedActivities: number;
        percent: number;
      }
    > = {};

    NCERT_CLASSES_DATA.forEach((cls) => {
      let clsCompBooks = 0;
      let clsCompChapters = 0;
      let clsTotalChapters = 0;
      let clsCompActivities = 0;

      cls.books.forEach((book) => {
        const isBComplete = isBookComplete(book, progressStore);
        if (isBComplete) clsCompBooks++;

        book.chapters.forEach((ch) => {
          clsTotalChapters++;
          const p = progressStore[ch.id];
          if (p?.reading) {
            readingCount++;
            clsCompActivities++;
          }
          if (p?.notes) {
            notesCount++;
            clsCompActivities++;
          }
          if (p?.revision) {
            revisionCount++;
            clsCompActivities++;
          }
          if (isChapterComplete(p)) {
            compChapters++;
            clsCompChapters++;
          }
        });
      });

      const clsTotalActivities = clsTotalChapters * 3;
      const clsPercent =
        clsTotalActivities > 0
          ? Math.round((clsCompActivities / clsTotalActivities) * 100)
          : 0;

      statsByClass[cls.classNum] = {
        totalChapters: clsTotalChapters,
        completedChapters: clsCompChapters,
        totalBooks: cls.books.length,
        completedBooks: clsCompBooks,
        totalActivities: clsTotalActivities,
        completedActivities: clsCompActivities,
        percent: clsPercent,
      };
    });

    const totalActivities = readingCount + notesCount + revisionCount;
    const ovPercent =
      TOTAL_NCERT_TASKS > 0
        ? Math.round((totalActivities / TOTAL_NCERT_TASKS) * 100)
        : 0;

    // Books completed overall
    let totalCompBooks = 0;
    NCERT_CLASSES_DATA.forEach((c) => {
      c.books.forEach((b) => {
        if (isBookComplete(b, progressStore)) totalCompBooks++;
      });
    });

    return {
      totalReadingCount: readingCount,
      totalNotesCount: notesCount,
      totalRevisionCount: revisionCount,
      totalCompletedActivities: totalActivities,
      overallPercent: ovPercent,
      completedChaptersCount: compChapters,
      completedBooksCount: totalCompBooks,
      classStats: statsByClass,
    };
  }, [progressStore]);

  // Reading, Notes, Revision overall percentages
  const readingPercent = Math.round((totalReadingCount / TOTAL_NCERT_CHAPTERS) * 100) || 0;
  const notesPercent = Math.round((totalNotesCount / TOTAL_NCERT_CHAPTERS) * 100) || 0;
  const revisionPercent = Math.round((totalRevisionCount / TOTAL_NCERT_CHAPTERS) * 100) || 0;

  // ---------------------------------------------------------------------------
  // FILTERED VIEW HIERARCHY
  // Class -> Subject -> Books -> Chapters
  // ---------------------------------------------------------------------------
  const filteredClasses = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return NCERT_CLASSES_DATA.filter((cls) => {
      if (selectedClassNum !== 'all' && cls.classNum !== selectedClassNum) {
        return false;
      }
      return true;
    })
      .map((cls) => {
        // Filter books within this class
        const filteredBooks = cls.books
          .filter((book) => {
            if (selectedSubject !== 'all' && book.subject !== selectedSubject) {
              return false;
            }
            return true;
          })
          .map((book) => {
            // Filter chapters within this book
            const filteredChapters = book.chapters.filter((ch) => {
              const p = progressStore[ch.id];
              const isComp = isChapterComplete(p);
              const count = (p?.reading ? 1 : 0) + (p?.notes ? 1 : 0) + (p?.revision ? 1 : 0);

              // Status filter
              if (filterStatus === 'not_started' && count > 0) return false;
              if (filterStatus === 'in_progress' && (count === 0 || count === 3)) return false;
              if (filterStatus === 'reading_pending' && p?.reading) return false;
              if (filterStatus === 'notes_pending' && p?.notes) return false;
              if (filterStatus === 'revision_pending' && p?.revision) return false;
              if (filterStatus === 'completed' && !isComp) return false;

              // Search query filter
              if (q) {
                const matchChapter = ch.title.toLowerCase().includes(q);
                const matchBook = book.title.toLowerCase().includes(q);
                const matchSubject = book.subject.toLowerCase().includes(q);
                const matchClass = cls.className.toLowerCase().includes(q);
                const matchTheme = ch.theme?.toLowerCase().includes(q);
                if (!matchChapter && !matchBook && !matchSubject && !matchClass && !matchTheme) {
                  return false;
                }
              }

              return true;
            });

            return {
              ...book,
              filteredChapters,
            };
          })
          .filter((b) => b.filteredChapters.length > 0 || !q);

        return {
          ...cls,
          filteredBooks,
        };
      })
      .filter((cls) => cls.filteredBooks.length > 0);
  }, [selectedClassNum, selectedSubject, filterStatus, searchQuery, progressStore]);

  // Open add to plan modal
  const handleOpenAddModal = (
    chapter: NcertFlatChapter,
    activity?: 'reading' | 'notes' | 'revision'
  ) => {
    setAddToPlanModal({
      isOpen: true,
      chapter,
      initialActivity: activity,
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-200">
      {/* ===================================================================== */}
      {/* 1. TOP DASHBOARD                                                      */}
      {/* ===================================================================== */}
      <div className="surface p-6 sm:p-8 relative overflow-hidden">

        <div className="relative z-10 space-y-6">
          {/* Header row */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xl shadow-md shadow-indigo-500/25 shrink-0">
                <BookOpen size={22} aria-hidden="true" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="page-title">
                    NCERT Social Science
                  </h1>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60">
                    Classes 6–12
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
                  Long-term 3-stage mastery tracker: <span className="font-semibold text-slate-800 dark:text-slate-200">Reading</span> → <span className="font-semibold text-slate-800 dark:text-slate-200">Notes</span> → <span className="font-semibold text-slate-800 dark:text-slate-200">Revision</span>
                </p>
              </div>
            </div>

            {/* Top Toolbar actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsBackupModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-slate-100 hover:bg-slate-200/80 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors border border-slate-200/80 dark:border-slate-700/80"
                title="Backup, export, or import progress"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Backup & Export</span>
              </button>
            </div>
          </div>

          {/* Metric cards grid: P1.6 Top 4 Primary Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* 1. OVERALL NCERT PROGRESS */}
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-indigo-500/10 via-slate-50 to-teal-500/10 dark:from-indigo-950/40 dark:via-slate-800/40 dark:to-teal-950/40 border border-indigo-200/60 dark:border-indigo-800/50 flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                  Overall Progress
                </span>
                <span className="w-2 h-2 rounded-full bg-indigo-500" />
              </div>
              <div className="my-2">
                <div className="text-3xl sm:text-4xl font-display font-bold text-indigo-950 dark:text-white tabular-nums">
                  {overallPercent}%
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {totalCompletedActivities} / {TOTAL_NCERT_TASKS} activities
                </p>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-200/80 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full transition-all duration-500"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>

            {/* 2. Chapters Completed */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Chapters
              </span>
              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  {completedChaptersCount} <span className="text-sm font-normal text-slate-400">/ {TOTAL_NCERT_CHAPTERS}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {TOTAL_NCERT_CHAPTERS - completedChaptersCount} remaining
                </p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all"
                  style={{ width: `${Math.round((completedChaptersCount / TOTAL_NCERT_CHAPTERS) * 100)}%` }}
                />
              </div>
            </div>

            {/* 3. Books Completed */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Books
              </span>
              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  {completedBooksCount} <span className="text-sm font-normal text-slate-400">/ {TOTAL_NCERT_BOOKS}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  {TOTAL_NCERT_BOOKS - completedBooksCount} remaining
                </p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all"
                  style={{ width: `${Math.round((completedBooksCount / TOTAL_NCERT_BOOKS) * 100)}%` }}
                />
              </div>
            </div>

            {/* 4. Activities Completed */}
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 flex flex-col justify-between">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                Activities
              </span>
              <div className="my-2">
                <div className="text-2xl sm:text-3xl font-display font-bold text-slate-900 dark:text-white tabular-nums">
                  {totalCompletedActivities} <span className="text-sm font-normal text-slate-400">/ {TOTAL_NCERT_TASKS}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                  Reading, notes & revisions
                </p>
              </div>
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all"
                  style={{ width: `${overallPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Activity Progress (P1.6: Compact Progress Bars) */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Activity Progress
              </span>
              <span className="text-[11px] text-slate-400">
                3-stage sequence
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Reading */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>📖</span> Reading
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {totalReadingCount} / {TOTAL_NCERT_CHAPTERS} · <strong className="text-indigo-600 dark:text-indigo-400">{readingPercent}%</strong>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-indigo-600 rounded-full transition-all" style={{ width: `${readingPercent}%` }} />
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>✍️</span> Notes
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {totalNotesCount} / {TOTAL_NCERT_CHAPTERS} · <strong className="text-amber-600 dark:text-amber-400">{notesPercent}%</strong>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${notesPercent}%` }} />
                </div>
              </div>

              {/* Revised at least once */}
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span>🔄</span> Revised at least once
                  </span>
                  <span className="text-slate-500 dark:text-slate-400 font-medium">
                    {totalRevisionCount} / {TOTAL_NCERT_CHAPTERS} · <strong className="text-teal-600 dark:text-teal-400">{revisionPercent}%</strong>
                  </span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                  <div className="h-full bg-teal-500 rounded-full transition-all" style={{ width: `${revisionPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          {/* Compact Class Progress (P1.6: Click to Open) */}
          <div className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Progress by Class
              </span>
              <span className="text-[11px] text-slate-400">
                Click any class to view
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {NCERT_CLASSES_DATA.map((cls) => {
                const stat = classStats[cls.classNum];
                const isSelected = selectedClassNum === cls.classNum;
                return (
                  <button
                    key={cls.classNum}
                    type="button"
                    onClick={() => handleSelectClass(cls.classNum)}
                    className={`p-2 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-white dark:bg-slate-800 shadow-xs ring-2 ring-indigo-500/20'
                        : 'border-slate-200/80 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white/60 dark:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span>{cls.className}</span>
                      <span className="text-indigo-600 dark:text-indigo-400">{stat.percent}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          stat.percent === 100 ? 'bg-emerald-500' : 'bg-indigo-600'
                        }`}
                        style={{ width: `${stat.percent}%` }}
                      />
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 truncate">
                      {stat.completedChapters}/{stat.totalChapters} Ch
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 2. CLASS-WISE SUB-SECTIONS SWITCHER                                   */}
      {/* ===================================================================== */}
      <div className="surface p-4 sm:p-5 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md">
                Class Sub-Sections
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {selectedClassNum === 'all'
                  ? 'All Classes Directory Overview'
                  : `Currently viewing Class ${selectedClassNum} Sub-Section`}
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white mt-1">
              {selectedClassNum === 'all'
                ? 'NCERT Curriculum Directory'
                : `Class ${selectedClassNum} Social Science`}
            </h2>
          </div>

          {/* Quick jump prev/next class buttons */}
          {typeof selectedClassNum === 'number' && (
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handlePrevClass}
                disabled={!prevClassNum}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                title={prevClassNum ? `Switch to Class ${prevClassNum}` : 'No previous class'}
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                <span>Class {prevClassNum || ''}</span>
              </button>
              <button
                onClick={handleNextClass}
                disabled={!nextClassNum}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5"
                title={nextClassNum ? `Switch to Class ${nextClassNum}` : 'No next class'}
              >
                <span>Class {nextClassNum || ''}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Horizontal Sub-Section Tabs (Identical to other academic tracks) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {NCERT_CLASSES_DATA.map((cls) => {
            const stat = classStats[cls.classNum];
            const isSelected = selectedClassNum === cls.classNum;
            return (
              <button
                key={cls.classNum}
                onClick={() => handleSelectClass(cls.classNum)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap shrink-0 border ${
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25 ring-2 ring-indigo-500/30 font-bold'
                    : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-200/60 dark:border-slate-700/60'
                }`}
              >
                <span>{cls.className}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                    isSelected
                      ? 'bg-indigo-700/80 text-indigo-100'
                      : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {stat.completedChapters}/{stat.totalChapters} Ch
                </span>
                {stat.percent === 100 && (
                  <CheckCircle2
                    className={`w-3.5 h-3.5 ${isSelected ? 'text-emerald-200' : 'text-emerald-500'}`}
                  />
                )}
              </button>
            );
          })}

          {/* All Classes Overview Tab */}
          <button
            onClick={() => handleSelectClass('all')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 border ${
              selectedClassNum === 'all'
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-500/25 ring-2 ring-indigo-500/30 font-bold'
                : 'bg-slate-100/90 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80 border-slate-200/60 dark:border-slate-700/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>All Classes Directory</span>
            <span
              className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                selectedClassNum === 'all'
                  ? 'bg-indigo-700/80 text-indigo-100'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
              }`}
            >
              {completedChaptersCount}/{TOTAL_NCERT_CHAPTERS}
            </span>
          </button>
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 3. FILTERS & SEARCH TOOLBAR                                           */}
      {/* ===================================================================== */}
      <div className="surface p-4 sm:p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search chapters, books, subjects, or classes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Clear
              </button>
            )}
          </div>

          {/* Quick buttons: Expand / Collapse Books */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={expandActiveBooks}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Expand Books
            </button>
            <button
              onClick={collapseActiveBooks}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              Collapse Books
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-400 font-semibold shrink-0 flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" /> Filter:
          </span>

          {[
            { id: 'all', label: 'All' },
            { id: 'not_started', label: 'Not Started' },
            { id: 'in_progress', label: 'In Progress' },
            { id: 'reading_pending', label: 'Reading Pending' },
            { id: 'notes_pending', label: 'Notes Pending' },
            { id: 'revision_pending', label: 'Revision Pending' },
            { id: 'completed', label: 'Completed' },
          ].map((flt) => {
            const isSelected = filterStatus === flt.id;
            return (
              <button
                key={flt.id}
                onClick={() => setFilterStatus(flt.id as FilterStatus)}
                className={`px-3 py-1 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isSelected
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {flt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ===================================================================== */}
      {/* 4. ACADEMIC HIERARCHY: CLASS -> SUBJECT -> BOOKS -> CHAPTERS           */}
      {/* ===================================================================== */}
      <div className="space-y-8">
        {/* If 'All Classes' is selected with no active search, show the interactive Class Directory Grid */}
        {selectedClassNum === 'all' && !searchQuery && directoryViewMode === 'cards' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 sm:p-5 rounded-3xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/50">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                  <span>NCERT Social Science Classes 6–12 Directory</span>
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Choose any class sub-section below to view its specific syllabus, books, and chapters without continuous scrolling.
                </p>
              </div>
              <button
                onClick={() => setDirectoryViewMode('flat')}
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl border border-slate-200 dark:border-slate-700 transition-colors whitespace-nowrap self-start sm:self-auto shadow-2xs"
              >
                View Full Continuous Scroll
              </button>
            </div>

            {/* Class Directory Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {NCERT_CLASSES_DATA.map((cls) => {
                const stat = classStats[cls.classNum];
                const classSubjects = Array.from(new Set(cls.books.map((b) => b.subject)));

                return (
                  <div
                    key={cls.classNum}
                    className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-indigo-400 dark:hover:border-indigo-500 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-3.5">
                      <div className="flex items-center justify-between">
                        <span className="text-lg font-display font-bold text-slate-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                          {cls.className}
                        </span>
                        {stat.percent === 100 ? (
                          <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300/80 dark:border-emerald-800">
                            <CheckCircle2 className="w-3.5 h-3.5" /> 100% Done
                          </span>
                        ) : (
                          <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-full">
                            {stat.percent}% Verified
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                        {cls.structureDesc}
                      </p>

                      {/* Progress Bar & Chapter Counts */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600 dark:text-slate-400">
                          <span>{stat.completedChapters} / {stat.totalChapters} Chapters</span>
                          <span>{stat.completedBooks} / {stat.totalBooks} Books</span>
                        </div>
                        <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              stat.percent === 100
                                ? 'bg-emerald-500'
                                : 'bg-indigo-600 dark:bg-indigo-400'
                            }`}
                            style={{ width: `${stat.percent}%` }}
                          />
                        </div>
                      </div>

                      {/* Subject Badges */}
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {classSubjects.map((sub) => (
                          <span
                            key={sub}
                            className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/50 dark:border-slate-700/50"
                          >
                            {sub}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Open Sub-Section Action */}
                    <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                      <button
                        onClick={() => handleSelectClass(cls.classNum)}
                        className="w-full py-2.5 px-4 text-xs font-bold rounded-xl text-indigo-600 dark:text-indigo-300 bg-indigo-50 hover:bg-indigo-600 hover:text-white dark:bg-indigo-950/50 dark:hover:bg-indigo-600 dark:hover:text-white transition-all flex items-center justify-center gap-1.5 shadow-2xs group-hover:bg-indigo-600 group-hover:text-white"
                      >
                        <span>Open {cls.className} Sub-Section</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : filteredClasses.length === 0 ? (
          <div className="surface text-center py-16 p-8">
            <BookOpen className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No matching NCERT chapters found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              Try adjusting your search terms or clearing status filters to view the curriculum.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setFilterStatus('all');
                setSelectedClassNum(6);
                setSelectedSubject('all');
              }}
              className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors shadow-xs"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Banner when viewing all classes in continuous list or search */}
            {selectedClassNum === 'all' && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3.5 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/70 dark:border-indigo-800/60 text-xs">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {searchQuery ? `Search results across all classes` : `Continuous view of all classes`}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setDirectoryViewMode('cards');
                  }}
                  className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline flex items-center gap-1 self-start sm:self-auto"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Switch back to Class Directory Cards</span>
                </button>
              </div>
            )}

            {filteredClasses.map((cls) => {
              const classStat = classStats[cls.classNum];
              const isSingleClassView = selectedClassNum === cls.classNum;
              const clsSubjects = Array.from(new Set(cls.books.map((b) => b.subject)));

              return (
                <div key={cls.classNum} className="space-y-4">
                  {/* Class Sub-Section Hero Header */}
                  {isSingleClassView ? (
                    <div className="bg-gradient-to-r from-indigo-50/70 via-slate-50 to-teal-50/50 dark:from-indigo-950/30 dark:via-slate-900/60 dark:to-teal-950/30 rounded-3xl p-5 sm:p-6 border border-indigo-100 dark:border-indigo-900/40 shadow-2xs space-y-4">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800/70">
                              {cls.className} Sub-Section
                            </span>
                            <span className="text-xs text-slate-400">·</span>
                            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                              {cls.structureDesc}
                            </span>
                          </div>
                          <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-950 dark:text-white mt-1">
                            {cls.className} Social Science Curriculum
                          </h2>
                        </div>

                        {/* Class statistics badge */}
                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                              {classStat.completedChapters} / {classStat.totalChapters} Chapters Verified
                            </div>
                            <div className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
                              {classStat.percent}% Class Mastery · {classStat.completedBooks}/{classStat.totalBooks} Books
                            </div>
                          </div>
                          <div className="w-20 sm:w-24 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                classStat.percent === 100
                                  ? 'bg-emerald-500'
                                  : 'bg-indigo-600 dark:bg-indigo-400'
                              }`}
                              style={{ width: `${classStat.percent}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Subject Filter Sub-Tabs for this Class */}
                      <div className="pt-3 border-t border-slate-200/60 dark:border-slate-800/60 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
                          <span className="text-slate-400 font-semibold text-[11px] shrink-0 mr-1 flex items-center gap-1">
                            <BookOpen className="w-3.5 h-3.5 text-indigo-500" /> Focus Subject:
                          </span>
                          <button
                            onClick={() => setSelectedSubject('all')}
                            className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap border ${
                              selectedSubject === 'all'
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700/80'
                            }`}
                          >
                            All Subjects ({cls.books.length} Books)
                          </button>

                          {clsSubjects.map((subj) => {
                            const isSubjSelected = selectedSubject === subj;
                            const subjBooks = cls.books.filter((b) => b.subject === subj);
                            const subjChapters = subjBooks.flatMap((b) => b.chapters);
                            const subjDoneCount = subjChapters.filter((c) =>
                              isChapterComplete(progressStore[c.id])
                            ).length;
                            return (
                              <button
                                key={subj}
                                onClick={() => setSelectedSubject(subj)}
                                className={`px-3 py-1.5 rounded-xl font-semibold transition-all whitespace-nowrap flex items-center gap-1.5 border ${
                                  isSubjSelected
                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 border-slate-200/80 dark:border-slate-700/80'
                                }`}
                              >
                                <span>{subj}</span>
                                <span
                                  className={`text-[10px] font-mono ${
                                    isSubjSelected ? 'text-indigo-100' : 'text-slate-400'
                                  }`}
                                >
                                  ({subjDoneCount}/{subjChapters.length})
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        {/* Navigation: Previous / Next Class Sub-Section */}
                        <div className="flex items-center gap-1.5 text-xs">
                          <button
                            onClick={handlePrevClass}
                            disabled={!prevClassNum}
                            className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                          >
                            <ChevronLeft className="w-3.5 h-3.5" />
                            <span>Class {prevClassNum || ''}</span>
                          </button>
                          <span className="text-slate-300 dark:text-slate-700">·</span>
                          <button
                            onClick={handleNextClass}
                            disabled={!nextClassNum}
                            className="px-2.5 py-1.5 rounded-xl text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white bg-white dark:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors flex items-center gap-1 font-semibold border border-slate-200/80 dark:border-slate-700/80 shadow-2xs"
                          >
                            <span>Class {nextClassNum || ''}</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Continuous / Multi-class Section Header */
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <span className="text-lg sm:text-xl font-display font-bold text-slate-950 dark:text-white">
                          {cls.className}
                        </span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                          ({cls.structureDesc})
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs">
                        <span className="text-slate-500 dark:text-slate-400">
                          Books: <strong className="text-slate-800 dark:text-slate-200">{classStat.completedBooks}/{classStat.totalBooks}</strong>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="text-slate-500 dark:text-slate-400">
                          Chapters: <strong className="text-slate-800 dark:text-slate-200">{classStat.completedChapters}/{classStat.totalChapters}</strong>
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {classStat.percent}%
                        </span>
                        <span className="text-slate-300 dark:text-slate-700">•</span>
                        <button
                          onClick={() => handleSelectClass(cls.classNum)}
                          className="font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>Open Sub-Section</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  )}

                {/* Books Container */}
                <div className="space-y-4">
                  {cls.filteredBooks.map((book) => {
                    const isExpanded = !!expandedBookIds[book.id];
                    const isBComplete = isBookComplete(book, progressStore);

                    // Compute book specific progress
                    const bookCompletedChapters = book.chapters.filter((ch) =>
                      isChapterComplete(progressStore[ch.id])
                    ).length;

                    let bookCompActivities = 0;
                    book.chapters.forEach((ch) => {
                      const p = progressStore[ch.id];
                      if (p?.reading) bookCompActivities++;
                      if (p?.notes) bookCompActivities++;
                      if (p?.revision) bookCompActivities++;
                    });
                    const bookTotalActivities = book.chapters.length * 3;
                    const bookPercent =
                      bookTotalActivities > 0
                        ? Math.round((bookCompActivities / bookTotalActivities) * 100)
                        : 0;

                    // Subject colors for visual hierarchy
                    const subjectBadgeColors: Record<string, string> = {
                      'History': 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-200/80 dark:border-amber-800/60',
                      'Political Science': 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-200/80 dark:border-blue-800/60',
                      'Geography': 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/60',
                      'Economics': 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-200/80 dark:border-purple-800/60',
                      'Integrated Social Science': 'bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-300 border-indigo-200/80 dark:border-indigo-800/60',
                    };

                    const badgeStyle = subjectBadgeColors[book.subject] || subjectBadgeColors['Integrated Social Science'];

                    return (
                      <div
                        key={book.id}
                        className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                          isBComplete
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/10 border-emerald-300/80 dark:border-emerald-800/70'
                            : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 shadow-2xs'
                        }`}
                      >
                        {/* BOOK ACCORDION HEADER */}
                        <div
                          onClick={() => toggleBook(book.id)}
                          className="p-4 sm:p-5 cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <button
                              type="button"
                              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-transform shrink-0 mt-0.5"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                              ) : (
                                <ChevronRight className="w-5 h-5" />
                              )}
                            </button>

                            <div className="space-y-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${badgeStyle}`}>
                                  {book.subject}
                                </span>
                                {book.part && (
                                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                    {book.part}
                                  </span>
                                )}
                                {isBComplete && (
                                  <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded-md flex items-center gap-1 border border-emerald-300 dark:border-emerald-800">
                                    <CheckCircle2 className="w-3 h-3" />
                                    Book Complete
                                  </span>
                                )}
                              </div>

                              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                                {book.title}
                              </h3>

                              {book.description && (
                                <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                                  {book.description}
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Progress summary right side */}
                          <div className="flex items-center gap-4 shrink-0 pl-8 md:pl-0">
                            <div className="text-right">
                              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {bookCompletedChapters} / {book.chapters.length} Chapters Complete
                              </div>
                              <div className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400">
                                {bookPercent}% Overall
                              </div>
                            </div>

                            {/* Circular/horizontal mini bar */}
                            <div className="w-24 sm:w-32 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isBComplete ? 'bg-emerald-500' : 'bg-indigo-600 dark:bg-indigo-400'
                                }`}
                                style={{ width: `${bookPercent}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* CHAPTER ROWS (Visible when expanded) */}
                        {isExpanded && (
                          <div className="border-t border-slate-100 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 p-2 sm:p-4 space-y-2">
                            {book.filteredChapters.map((ch) => {
                              const p = progressStore[ch.id];
                              const isChComp = isChapterComplete(p);
                              const pct = getChapterProgressPercent(p);

                              const flatCh: NcertFlatChapter = {
                                ...ch,
                                bookId: book.id,
                                bookTitle: book.title,
                                subject: book.subject,
                                classNum: cls.classNum,
                                className: cls.className,
                              };

                              return (
                                <div
                                  key={ch.id}
                                  className={`p-3 sm:p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                                    isChComp
                                      ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200/90 dark:border-emerald-800/60 shadow-2xs'
                                      : 'bg-white dark:bg-slate-800/80 border-slate-200/70 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                                  }`}
                                >
                                  {/* Left: Chapter Number & Title */}
                                  <div className="space-y-0.5 min-w-0 flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[11px] font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md shrink-0">
                                        Ch {ch.chapterNumber}
                                      </span>
                                      {ch.theme && (
                                        <span className="text-[10px] text-slate-400 font-medium truncate">
                                          Theme: {ch.theme}
                                        </span>
                                      )}
                                      {isChComp && (
                                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                          <CheckCircle2 className="w-3.5 h-3.5" />
                                          Done
                                        </span>
                                      )}
                                    </div>
                                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                                      {ch.title}
                                    </h4>
                                  </div>

                                  {/* Middle: 3 INDEPENDENT CHECKBOX CONTROLS */}
                                  <div className="flex items-center gap-3 sm:gap-4 shrink-0 bg-slate-50 dark:bg-slate-900/60 px-3 py-1.5 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                    {/* 1. Reading */}
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                                      <input
                                        type="checkbox"
                                        checked={!!p?.reading}
                                        onChange={() => onToggleActivity(ch.id, 'reading')}
                                        className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 dark:border-slate-600 cursor-pointer accent-indigo-600"
                                      />
                                      <span
                                        className={`text-xs font-semibold transition-colors ${
                                          p?.reading
                                            ? 'text-indigo-700 dark:text-indigo-300 font-bold'
                                            : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                                        }`}
                                      >
                                        Reading
                                      </span>
                                    </label>

                                    <span className="text-slate-200 dark:text-slate-700">|</span>

                                    {/* 2. Notes */}
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                                      <input
                                        type="checkbox"
                                        checked={!!p?.notes}
                                        onChange={() => onToggleActivity(ch.id, 'notes')}
                                        className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 border-slate-300 dark:border-slate-600 cursor-pointer accent-amber-600"
                                      />
                                      <span
                                        className={`text-xs font-semibold transition-colors ${
                                          p?.notes
                                            ? 'text-amber-700 dark:text-amber-300 font-bold'
                                            : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                                        }`}
                                      >
                                        Notes
                                      </span>
                                    </label>

                                    <span className="text-slate-200 dark:text-slate-700">|</span>

                                    {/* 3. Revision */}
                                    <label className="flex items-center gap-1.5 cursor-pointer select-none group">
                                      <input
                                        type="checkbox"
                                        checked={!!p?.revision}
                                        onChange={() => onToggleActivity(ch.id, 'revision')}
                                        className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500 border-slate-300 dark:border-slate-600 cursor-pointer accent-teal-600"
                                      />
                                      <span
                                        className={`text-xs font-semibold transition-colors ${
                                          p?.revision
                                            ? 'text-teal-700 dark:text-teal-300 font-bold'
                                            : 'text-slate-600 dark:text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white'
                                        }`}
                                      >
                                        Revision
                                      </span>
                                    </label>
                                  </div>

                                  {/* Right: Progress pill & + Add to Weekly Plan */}
                                  <div className="flex items-center gap-2.5 justify-end shrink-0">
                                    <span
                                      className={`text-[11px] font-bold px-2 py-0.5 rounded-lg tabular-nums ${
                                        pct === 100
                                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border border-emerald-300/80 dark:border-emerald-800'
                                          : pct > 0
                                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-700 dark:text-amber-300 border border-amber-300/80 dark:border-amber-800'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                                      }`}
                                    >
                                      {pct}%
                                    </span>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenAddModal(flatCh)}
                                      className="px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-white hover:bg-indigo-600 dark:hover:bg-indigo-600 rounded-lg border border-indigo-200 dark:border-indigo-800/80 transition-colors flex items-center gap-1 shadow-2xs whitespace-nowrap"
                                      title="Schedule reading, notes, or revision into current weekly plan"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Add to Weekly Plan</span>
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
      </div>

      {/* ===================================================================== */}
      {/* 6. PROGRESS BY CLASS & PROGRESS BY ACTIVITY ANALYTICS SECTION         */}
      {/* ===================================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200/80 dark:border-slate-800">
        {/* Progress by Class */}
        <div className="surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-500" />
              <span>Progress by Class</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              Classes 6–12
            </span>
          </div>

          <div className="space-y-3">
            {NCERT_CLASSES_DATA.map((cls) => {
              const stat = classStats[cls.classNum];
              return (
                <div key={cls.classNum} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {cls.className}
                    </span>
                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {stat.completedChapters} / {stat.totalChapters} Ch ·{' '}
                      <strong className="text-indigo-600 dark:text-indigo-400">{stat.percent}%</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        stat.percent === 100
                          ? 'bg-emerald-500'
                          : 'bg-indigo-600 dark:bg-indigo-400'
                      }`}
                      style={{ width: `${stat.percent}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress by Activity */}
        <div className="surface p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-4 h-4 text-teal-500" />
              <span>Progress by Activity</span>
            </h3>
            <span className="text-xs text-slate-400 font-semibold">
              3 Stages · 636 Tasks
            </span>
          </div>

          <div className="space-y-5">
            {/* Reading */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>📖</span> Reading
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {totalReadingCount} / {TOTAL_NCERT_CHAPTERS} chapters ·{' '}
                  <strong className="text-blue-600 dark:text-blue-400">{readingPercent}%</strong>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${readingPercent}%` }}
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>✍️</span> Notes
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {totalNotesCount} / {TOTAL_NCERT_CHAPTERS} chapters ·{' '}
                  <strong className="text-amber-600 dark:text-amber-400">{notesPercent}%</strong>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-amber-500 rounded-full transition-all duration-300"
                  style={{ width: `${notesPercent}%` }}
                />
              </div>
            </div>

            {/* Revision */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <span>🔄</span> Revision
                </span>
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {totalRevisionCount} / {TOTAL_NCERT_CHAPTERS} chapters ·{' '}
                  <strong className="text-teal-600 dark:text-teal-400">{revisionPercent}%</strong>
                </span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-300"
                  style={{ width: `${revisionPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <NcertAddToWeeklyPlanModal
        isOpen={addToPlanModal.isOpen}
        onClose={() => setAddToPlanModal({ isOpen: false, chapter: null })}
        chapter={addToPlanModal.chapter}
        initialActivity={addToPlanModal.initialActivity}
        activeWeekTitle={activeWeekTitle}
        onConfirmAdd={onAddWeeklyTask}
      />

      <NcertResetConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirmReset={onResetProgress}
      />

      <NcertBackupModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        progressStore={progressStore}
        onImportProgress={onImportProgress}
        onOpenResetConfirm={() => setIsResetModalOpen(true)}
      />
    </div>
  );
};
