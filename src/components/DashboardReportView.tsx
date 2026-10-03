import React, { useState } from 'react';
import { 
  ProgramTab, 
  WeekPlan 
} from '../types';
import { 
  BarChart3, 
  CheckCircle2, 
  Clock, 
  Award, 
  FileText, 
  Download, 
  Printer, 
  Sparkles, 
  GraduationCap, 
  Filter, 
  BookOpen, 
  Check, 
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp
} from 'lucide-react';

interface DashboardReportViewProps {
  programs: ProgramTab[];
  weeks: WeekPlan[];
  onSelectTab: (tabId: string) => void;
  ncertPercent?: number;
}

export const DashboardReportView: React.FC<DashboardReportViewProps> = ({
  programs,
  weeks,
  onSelectTab,
  ncertPercent = 0,
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  // Aggregates across all programs
  const bedProgram = programs.find((p) => p.type === 'bed');
  const siTasks = bedProgram?.siTasks || [];
  const completedSiTasks = siTasks.filter((t) => t.status === 'completed');
  const totalSiUnits = siTasks.reduce((acc, t) => acc + t.targetCount, 0);
  const doneSiUnits = siTasks.reduce((acc, t) => acc + Math.min(t.currentCount, t.targetCount), 0);

  // All chapters across all subjects
  const allChaptersWithMeta = programs.flatMap((prog) =>
    (prog.subjects || []).flatMap((sub) =>
      sub.chapters.map((chap) => ({
        ...chap,
        programId: prog.id,
        programTitle: prog.title,
        programType: prog.type,
        programColor: prog.color,
        subjectCode: sub.code,
        subjectName: sub.name,
      }))
    )
  );

  const totalChapters = allChaptersWithMeta.length;
  const finishedChapters = allChaptersWithMeta.filter((c) => c.isFinished);
  const readingNotesCount = allChaptersWithMeta.filter((c) => c.readingNotes).length;
  const deepStudyCount = allChaptersWithMeta.filter((c) => c.deepStudy).length;
  const revisionCount = allChaptersWithMeta.filter((c) => c.revision).length;

  const totalMilestonesFinished = completedSiTasks.length + finishedChapters.length;

  // Filtered finished items for audit report
  const filteredFinishedChapters = finishedChapters.filter((item) => {
    if (selectedFilter === 'all') return true;
    return item.programId === selectedFilter;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1.5">
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Academic Audit & Portfolio Record
            </span>
            <span aria-hidden="true">·</span>
            <span>Real-time Syllabus Status</span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-950 dark:text-white" style={{ textWrap: 'balance' }}>
            Academic Performance Audit & Report
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Unified milestone verification across B.Ed 3rd Sem, M.A. History, CTET, UGC NET, and Canva.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-indigo-200 dark:border-indigo-800/80 bg-indigo-50/70 hover:bg-indigo-100/80 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 shadow-2xs transition-colors"
          >
            <Printer className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>Print Audit Sheet</span>
          </button>
        </div>
      </div>

      {/* 4 Global Metric Modules with Sophisticated Color Distribution */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Module 1: Total Finished Tasks */}
        <div className="surface p-5 flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
            Total Milestones Finished
          </span>
          <div className="my-2.5">
            <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 tabular-nums font-mono">
              {totalMilestonesFinished}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {finishedChapters.length} Chapters + {completedSiTasks.length} SI Deliverables
            </p>
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500">
            Recorded across 4 active study programs
          </span>
        </div>

        {/* Module 2: Stage 1 Reading Notes */}
        <div className="surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-teal-600 dark:text-teal-400 uppercase tracking-wider">
              Stage 1: Reading Notes
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {totalChapters === 0 ? 0 : Math.round((readingNotesCount / totalChapters) * 100)}%
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums font-mono">
              {readingNotesCount}{' '}
              <span className="text-lg font-normal text-slate-400">/ {totalChapters}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              First-pass reading & notes recorded
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-teal-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalChapters === 0 ? 0 : (readingNotesCount / totalChapters) * 100}%` }}
            />
          </div>
        </div>

        {/* Module 3: Stage 2 Deep Study */}
        <div className="surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
              Stage 2: Deep Study
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {totalChapters === 0 ? 0 : Math.round((deepStudyCount / totalChapters) * 100)}%
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums font-mono">
              {deepStudyCount}{' '}
              <span className="text-lg font-normal text-slate-400">/ {totalChapters}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Concept mastery & analysis completed
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-indigo-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalChapters === 0 ? 0 : (deepStudyCount / totalChapters) * 100}%` }}
            />
          </div>
        </div>

        {/* Module 4: Stage 3 Revision */}
        <div className="surface p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
              Stage 3: Revision
            </span>
            <span className="text-xs font-mono tabular-nums text-slate-400">
              {totalChapters === 0 ? 0 : Math.round((revisionCount / totalChapters) * 100)}%
            </span>
          </div>
          <div className="my-2.5">
            <div className="text-3xl font-bold text-slate-950 dark:text-white tabular-nums font-mono">
              {revisionCount}{' '}
              <span className="text-lg font-normal text-slate-400">/ {totalChapters}</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Rapid recall & exam ready
            </p>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-violet-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${totalChapters === 0 ? 0 : (revisionCount / totalChapters) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Program-Wise Status Matrix Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
            Program Mastery Overview
          </h2>
          <span className="text-xs text-slate-400 font-medium">Click any card to open track</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {programs.map((prog) => {
            const chaps = (prog.subjects || []).flatMap((s) => s.chapters);
            const finished = chaps.filter((c) => c.isFinished).length;
            const isBed = prog.type === 'bed';

            return (
              <div
                key={prog.id}
                onClick={() => onSelectTab(prog.id)}
                className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs group"
              >
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {prog.badge || prog.type.toUpperCase()}
                    </span>
                    <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline flex items-center gap-1">
                      <span>View</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                  <h3 className="font-display text-base font-bold text-slate-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {prog.title}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {prog.subtitle}
                  </p>
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
                  {isBed ? (
                    <div>
                      <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <span>SI Units Progress</span>
                        <span className="font-mono tabular-nums">{doneSiUnits} / {totalSiUnits}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${totalSiUnits === 0 ? 0 : (doneSiUnits / totalSiUnits) * 100}%` }}
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                        <span>Finished Chapters</span>
                        <span className="font-mono tabular-nums">{finished} / {chaps.length}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${chaps.length === 0 ? 0 : (finished / chaps.length) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* NCERT Social Science Track Card */}
          <div
            onClick={() => onSelectTab('ncert-track')}
            className="p-5 rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white dark:bg-slate-900/90 hover:border-indigo-400 dark:hover:border-indigo-600 transition-all cursor-pointer flex flex-col justify-between space-y-4 shadow-2xs group"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1.5">
                <span className="font-semibold text-indigo-700 dark:text-indigo-300 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded-md text-[10px]">
                  CLASSES 6–12
                </span>
                <span className="text-xs text-indigo-600 dark:text-indigo-400 font-semibold group-hover:underline flex items-center gap-1">
                  <span>View</span>
                  <ArrowRight className="w-3 h-3" />
                </span>
              </div>
              <h3 className="font-display text-base font-bold text-slate-950 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                NCERT Social Science
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                29 Books · 212 Chapters · 3-Stage Mastery
              </p>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800/80 text-xs">
              <div>
                <div className="flex justify-between font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <span>Overall Mastery</span>
                  <span className="font-mono tabular-nums font-bold text-indigo-600 dark:text-indigo-400">
                    {ncertPercent}%
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-indigo-600 dark:bg-indigo-400 h-full rounded-full transition-all duration-500"
                    style={{ width: `${ncertPercent}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Finished Tasks & Completed Chapters Audit Log */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Completed Milestone Ledger</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified syllabus items completed across your study programs
            </p>
          </div>

          {/* Filter Bar with clean segmented styling */}
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-900/90 rounded-xl border border-slate-200/60 dark:border-slate-800/60 overflow-x-auto text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                selectedFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              All Programs
            </button>
            {programs.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedFilter(p.id)}
                className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium ${
                  selectedFilter === p.id
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-2xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {p.title}
              </button>
            ))}
            <button
              onClick={() => onSelectTab('ncert-track')}
              className="px-3 py-1 rounded-lg transition-colors whitespace-nowrap font-medium text-slate-600 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 flex items-center gap-1"
            >
              <span>📚</span>
              <span>NCERT ({ncertPercent}%)</span>
            </button>
          </div>
        </div>

        {/* Finished B.Ed SI Tasks */}
        {(selectedFilter === 'all' || selectedFilter === 'tab-bed') && completedSiTasks.length > 0 && (
          <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-800/60 bg-emerald-50/20 dark:bg-emerald-950/10 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
              B.Ed School Internship Completed Deliverables ({completedSiTasks.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {completedSiTasks.map((t) => (
                <div key={t.id} className="p-3.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">{t.title}</span>
                    <span className="text-slate-500 text-[11px] tabular-nums font-mono">{t.currentCount} / {t.targetCount} units achieved</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    Done ✓
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Finished Chapters Table */}
        <div className="surface divide-y divide-slate-200 dark:divide-slate-800 overflow-hidden">
          {filteredFinishedChapters.length === 0 && completedSiTasks.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-500 dark:text-slate-400">
              <BookOpen className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="font-medium text-slate-700 dark:text-slate-300">
                No finished milestones in this category yet
              </p>
              <p className="mt-1">
                Mark chapters as "Finished" in the B.Ed, M.A., CTET, or UGC NET tabs to generate your audit ledger.
              </p>
            </div>
          ) : (
            filteredFinishedChapters.map((chap) => (
              <div
                key={chap.id}
                className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                    ✓
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {chap.programTitle}
                      </span>
                      {chap.subjectCode && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">
                            {chap.subjectCode}
                          </span>
                        </>
                      )}
                      <span aria-hidden="true">·</span>
                      <span>{chap.subjectName}</span>
                    </div>

                    <h4 className="text-sm font-semibold text-slate-950 dark:text-white mt-1">
                      Chapter {chap.chapterNumber}: {chap.title}
                    </h4>
                  </div>
                </div>

                {/* Clean unboxed stage badges */}
                <div className="flex items-center gap-2 text-xs shrink-0 flex-wrap text-slate-500 dark:text-slate-400">
                  <span className="text-teal-600 dark:text-teal-400 font-medium">Notes ✓</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-indigo-600 dark:text-indigo-400 font-medium">Deep Study ✓</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-violet-600 dark:text-violet-400 font-medium">Revision ✓</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
