import React, { useState } from 'react';
import { 
  Calendar, 
  Sun, 
  Moon, 
  Plus, 
  BookOpen, 
  GraduationCap, 
  RotateCcw,
  Menu,
  Download,
  BarChart3
} from 'lucide-react';
import { MainTab, ProgramTab } from '../types';
import { MobileNavDrawer, NavDestination } from './MobileNavDrawer';

interface NavbarProps {
  mainTab: MainTab;
  onSelectMainTab: (tab: MainTab) => void;
  currentSection: NavDestination;
  onSelectDestination: (dest: NavDestination) => void;
  programs: ProgramTab[];
  activeWeekTitle?: string;
  pendingTasksCount?: number;
  dueRevisionsCount?: number;
  ncertPercent?: number;
  onOpenAddTask: () => void;
  onOpenAddProgramModal: () => void;
  onOpenNewWeekModal: () => void;
  onOpenNotebookModal: () => void;
  onOpenUploadScanModal: () => void;
  onOpenExportModal?: () => void;
  onOpenCleanSlateModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenGoogleCalendarModal?: () => void;
  onOpenRemindersCenter?: () => void;
  autoSyncNcert?: boolean;
  onToggleAutoSyncNcert?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  mainTab,
  onSelectMainTab,
  currentSection,
  onSelectDestination,
  programs,
  pendingTasksCount = 0,
  dueRevisionsCount = 0,
  ncertPercent = 0,
  onOpenAddTask,
  onOpenAddProgramModal,
  onOpenNewWeekModal,
  onOpenNotebookModal,
  onOpenUploadScanModal,
  onOpenExportModal = () => {},
  onOpenCleanSlateModal,
  onOpenBackupModal = () => {},
  onOpenGoogleCalendarModal = () => {},
  onOpenRemindersCenter = () => {},
  autoSyncNcert = false,
  onToggleAutoSyncNcert = () => {},
  isDarkMode,
  onToggleDarkMode,
}) => {
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#0B0F17]/95 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800/80 transition-colors">
        {/* ======================================================== */}
        {/* MOBILE COMPACT HEADER (< 768px): [ ☰ ] WeeklyPlan [ + ] */}
        {/* ======================================================== */}
        <div className="flex md:hidden items-center justify-between h-14 px-3 sm:px-4 w-full max-w-full">
          {/* Left: Accessible menu toggle with optional indicator */}
          <button
            type="button"
            onClick={() => setIsMobileDrawerOpen(true)}
            className="relative p-2 -ml-1 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Open navigation menu"
            title="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
            {dueRevisionsCount > 0 && (
              <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* Center: App Wordmark */}
          <button
            type="button"
            onClick={() => onSelectDestination('weekly_planning')}
            className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-slate-950 dark:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg py-1 px-1.5"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 text-white flex items-center justify-center font-display font-black text-xs shadow-xs">
              WP
            </div>
            <span>WeeklyPlan</span>
          </button>

          {/* Right: + Add Task action */}
          <button
            type="button"
            onClick={onOpenAddTask}
            className="p-2 -mr-1 text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center shadow-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            aria-label="Add task to weekly plan"
            title="Add Task"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>

        {/* ======================================================== */}
        {/* DESKTOP / TABLET HEADER (>= 768px): Full Navigation Bar */}
        {/* ======================================================== */}
        <div className="hidden md:block max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Zone 1: Wordmark & Logo */}
            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => onSelectDestination('weekly_planning')}
                className="flex items-center gap-2.5 text-left focus:outline-none group focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-lg py-1 px-1.5 -ml-1.5"
              >
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-teal-400 text-white flex items-center justify-center font-display font-black text-sm tracking-tight shadow-md shadow-indigo-500/25 group-hover:scale-105 transition-transform">
                  WP
                </div>
                <span className="font-display text-lg font-bold tracking-tight text-slate-950 dark:text-white">
                  WeeklyPlan
                </span>
              </button>
            </div>

            {/* Zone 2: Navigation Destinations */}
            <nav className="flex items-center bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200/70 dark:border-slate-800/80 shadow-2xs overflow-x-auto scrollbar-none">
              {/* Tab 1: Weekly Planning */}
              <button
                onClick={() => onSelectDestination('weekly_planning')}
                className={`relative px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  mainTab === 'weekly_planning'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${mainTab === 'weekly_planning' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Weekly Tasks</span>
                {pendingTasksCount > 0 && (
                  <span className={`inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold rounded-md ${
                    mainTab === 'weekly_planning'
                      ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300'
                      : 'bg-slate-200/80 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                  }`}>
                    {pendingTasksCount}
                  </span>
                )}
              </button>

              {/* Tab 2: Academic Tracks */}
              <button
                onClick={() => onSelectDestination('academic_tracks')}
                className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  mainTab === 'academic_tracks'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <GraduationCap className={`w-3.5 h-3.5 ${mainTab === 'academic_tracks' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Academic Tracks</span>
              </button>

              {/* Tab 3: NCERT */}
              <button
                onClick={() => onSelectDestination('ncert')}
                className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentSection === 'ncert'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <BookOpen className={`w-3.5 h-3.5 ${currentSection === 'ncert' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>NCERT Social Science</span>
                {ncertPercent > 0 && (
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    {ncertPercent}%
                  </span>
                )}
              </button>

              {/* Tab 4: Calendar */}
              <button
                onClick={() => onSelectDestination('calendar')}
                className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  mainTab === 'calendar'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Calendar className={`w-3.5 h-3.5 ${mainTab === 'calendar' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Calendar</span>
              </button>

              {/* Tab 5: Analytics */}
              <button
                onClick={() => onSelectDestination('analytics')}
                className={`relative px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  currentSection === 'analytics' || currentSection === 'velocity'
                    ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <BarChart3 className={`w-3.5 h-3.5 ${currentSection === 'analytics' ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                <span>Analytics & Velocity</span>
              </button>
            </nav>

            {/* Zone 3: Actions */}
            <div className="flex items-center gap-2 shrink-0">
              {/* Reminder Center Bell Button */}
              <button
                type="button"
                onClick={onOpenRemindersCenter}
                className="relative p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200/80 dark:border-slate-800/80 shadow-2xs min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Spaced Revision Reminders"
                aria-label="View Spaced Revision Reminders"
              >
                <RotateCcw className="w-4 h-4 text-indigo-500" />
                {dueRevisionsCount > 0 && (
                  <span className="absolute -top-1 -right-1 px-1.5 py-0.2 bg-rose-500 text-white font-bold text-[10px] rounded-full shadow-xs">
                    {dueRevisionsCount}
                  </span>
                )}
              </button>

              {/* Data & Unified Backup Button */}
              <button
                type="button"
                onClick={onOpenBackupModal}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200/80 dark:border-slate-800/80 shadow-2xs min-h-[38px] min-w-[38px] flex items-center justify-center"
                title="Data Backup & Restore"
                aria-label="Data Backup & Restore"
              >
                <Download className="w-4 h-4 text-slate-600 dark:text-slate-400" />
              </button>

              {/* Day / Night mode toggle */}
              <button
                onClick={onToggleDarkMode}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all border border-slate-200/80 dark:border-slate-800/80 shadow-2xs min-h-[38px] min-w-[38px] flex items-center justify-center"
                aria-label={isDarkMode ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'}
                title={isDarkMode ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'}
              >
                {isDarkMode ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-700 dark:text-slate-300" />
                )}
              </button>

              {/* Primary Add Task button */}
              <button
                onClick={onOpenAddTask}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm shadow-indigo-500/25 transition-all active:scale-[0.98] whitespace-nowrap min-h-[38px]"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Add Task</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Accessible Mobile Navigation Drawer */}
      <MobileNavDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        currentSection={currentSection}
        onSelectDestination={onSelectDestination}
        pendingTasksCount={pendingTasksCount}
        dueRevisionsCount={dueRevisionsCount}
        academicTracksCount={programs.length + 1}
        ncertPercent={ncertPercent}
        isDarkMode={isDarkMode}
        onToggleDarkMode={onToggleDarkMode}
        onOpenUploadScanModal={onOpenUploadScanModal}
        onOpenNotebookModal={onOpenNotebookModal}
        onOpenExportModal={onOpenExportModal}
        onOpenCleanSlateModal={() => {
          if (onOpenCleanSlateModal) onOpenCleanSlateModal();
        }}
        onOpenGoogleCalendarModal={onOpenGoogleCalendarModal}
        onOpenRemindersCenter={onOpenRemindersCenter}
        autoSyncNcert={autoSyncNcert}
        onToggleAutoSyncNcert={onToggleAutoSyncNcert}
      />
    </>
  );
};
