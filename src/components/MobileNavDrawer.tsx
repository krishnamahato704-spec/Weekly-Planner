import React, { useEffect, useRef } from 'react';
import {
  Calendar,
  GraduationCap,
  BookOpen,
  BarChart3,
  Award,
  X,
  Sun,
  Moon,
  RotateCcw,
  Check,
  ChevronRight,
  Download,
} from 'lucide-react';

export type NavDestination =
  | 'weekly_planning'
  | 'calendar'
  | 'academic_tracks'
  | 'ncert'
  | 'velocity'
  | 'audit'
  | 'analytics';

interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentSection: NavDestination;
  onSelectDestination: (dest: NavDestination) => void;
  pendingTasksCount: number;
  dueRevisionsCount?: number;
  academicTracksCount: number;
  ncertPercent: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenUploadScanModal: () => void;
  onOpenNotebookModal: () => void;
  onOpenExportModal: () => void;
  onOpenCleanSlateModal: () => void;
  onOpenGoogleCalendarModal?: () => void;
  onOpenRemindersCenter?: () => void;
  autoSyncNcert: boolean;
  onToggleAutoSyncNcert: () => void;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  currentSection,
  onSelectDestination,
  pendingTasksCount,
  dueRevisionsCount,
  academicTracksCount,
  ncertPercent,
  isDarkMode,
  onToggleDarkMode,
  onOpenUploadScanModal,
  onOpenNotebookModal,
  onOpenExportModal,
  onOpenCleanSlateModal,
  onOpenRemindersCenter,
  autoSyncNcert,
  onToggleAutoSyncNcert,
}) => {
  const closeButtonRef = useRef<HTMLButtonElement | null>(null);
  const drawerRef = useRef<HTMLDivElement | null>(null);

  // Focus trap & Escape key handling
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const focusTimer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const destinations: {
    id: NavDestination;
    label: string;
    description: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
  }[] = [
    {
      id: 'weekly_planning',
      label: 'Weekly Tasks & Planning',
      description: 'Active 7-day plan, priorities & task checklist',
      icon: <Calendar className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />,
      badge: pendingTasksCount > 0 ? `${pendingTasksCount} left` : undefined,
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 font-bold',
    },
    {
      id: 'academic_tracks',
      label: 'Academic Tracks',
      description: 'B.Ed, M.A. History, CTET, UGC NET, Canva',
      icon: <GraduationCap className="w-4 h-4 text-teal-600 dark:text-teal-400" />,
      badge: `${academicTracksCount} tracks`,
      badgeColor: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300',
    },
    {
      id: 'ncert',
      label: 'NCERT Social Science',
      description: 'Classes 6–10 syllabus with Reading, Notes & Revision',
      icon: <BookOpen className="w-4 h-4 text-amber-500" />,
      badge: `${ncertPercent}% complete`,
      badgeColor: ncertPercent > 0
        ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400',
    },
    {
      id: 'calendar',
      label: 'Study Calendar',
      description: 'Weekly Blocks & Completed Tasks Calendar',
      icon: <Calendar className="w-4 h-4 text-indigo-500" />,
    },
    {
      id: 'analytics',
      label: 'Analytics & Velocity',
      description: 'Weekly completion trends & academic milestones',
      icon: <BarChart3 className="w-4 h-4 text-purple-500" />,
    },
    {
      id: 'audit',
      label: 'Audit Report',
      description: 'Full syllabus coverage and deliverables breakdown',
      icon: <Award className="w-4 h-4 text-amber-500" />,
    },
  ];

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex md:hidden animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile Navigation Menu"
    >
      <div
        ref={drawerRef}
        className="w-full max-w-xs bg-white dark:bg-[#0B0F17] h-full shadow-2xl flex flex-col justify-between overflow-y-auto p-4 border-r border-slate-200/80 dark:border-slate-800/80 animate-in slide-in-from-left duration-250"
      >
        {/* Drawer Header */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-teal-400 text-white flex items-center justify-center font-display font-black text-xs">
                WP
              </div>
              <span className="font-display font-bold text-base text-slate-950 dark:text-white">
                WeeklyPlan
              </span>
            </div>

            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="p-2 -mr-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              aria-label="Close navigation menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Nav Items */}
          <div className="space-y-1">
            {destinations.map((item) => {
              const isActive =
                currentSection === item.id ||
                (item.id === 'weekly_planning' && currentSection === 'weekly_planning') ||
                (item.id === 'analytics' && currentSection === 'velocity');

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectDestination(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all text-left min-h-[44px] ${
                    isActive
                      ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-950 dark:text-indigo-200 font-semibold'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-900/60 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">{item.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs sm:text-sm font-bold truncate">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded-md shrink-0 ${
                            item.badgeColor || 'bg-slate-100 dark:bg-slate-800'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 dark:text-slate-500 line-clamp-1 mt-0.5">
                      {item.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Drawer Footer Actions */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
          {onOpenRemindersCenter && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenRemindersCenter();
              }}
              className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors min-h-[44px]"
            >
              <span className="flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-indigo-500" />
                <span>Revision Reminders</span>
              </span>
              {dueRevisionsCount !== undefined && dueRevisionsCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500 text-white font-bold text-[10px] rounded-full">
                  {dueRevisionsCount}
                </span>
              )}
            </button>
          )}

          {/* Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-300 transition-colors min-h-[44px]"
          >
            <span className="flex items-center gap-2">
              {isDarkMode ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-slate-700" />
              )}
              <span>{isDarkMode ? 'Day Mode (Light)' : 'Night Mode (Dark)'}</span>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
