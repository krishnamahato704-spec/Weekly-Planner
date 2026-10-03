import React, { useCallback, useState, useSyncExternalStore } from 'react';
import { subscribeStorage, getStorageIssues } from '../utils/storage';
import { Menu, Plus, Moon, Sun, RotateCcw, Download, ChevronRight } from 'lucide-react';
import { Brand, MobileNavDrawer, NavigationContent } from './MobileNavDrawer';
import { destinations, isDestinationActive, NavDestination } from './navigation';

interface NavbarProps {
  currentSection: NavDestination;
  onSelectDestination: (destination: NavDestination) => void;
  pendingTasksCount?: number;
  dueRevisionsCount?: number;
  ncertPercent?: number;
  onOpenAddTask: () => void;
  onOpenNotebookModal: () => void;
  onOpenUploadScanModal: () => void;
  onOpenExportModal?: () => void;
  onOpenBackupModal?: () => void;
  onOpenRemindersCenter?: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
}
export function Navbar({ currentSection, onSelectDestination, pendingTasksCount = 0, dueRevisionsCount = 0,
  ncertPercent = 0, onOpenAddTask, onOpenNotebookModal, onOpenUploadScanModal, onOpenExportModal = () => {},
  onOpenBackupModal, onOpenRemindersCenter, isDarkMode, onToggleDarkMode }: NavbarProps) {
  const storageIssues = useSyncExternalStore(subscribeStorage, getStorageIssues);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = useCallback(() => setDrawerOpen(false), []);
  const section = destinations.find(destination => isDestinationActive(destination.id, currentSection));
  const navigation = { currentSection, onSelectDestination, pendingTasksCount, ncertPercent,
    onOpenNotebookModal, onOpenUploadScanModal, onOpenExportModal, onOpenBackupModal };
  return <>
    <aside className="app-sidebar">
      <button type="button" className="brand-button" onClick={() => onSelectDestination('weekly_planning')} aria-label="WeeklyPlan home"><Brand /></button>
      <NavigationContent {...navigation} />
      <div className="sidebar-note">
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300"><Plus aria-hidden="true" size={16} /></span>
        <p className="mt-3 text-sm font-semibold">Plan your next step.</p>
        <p className="mt-1 text-xs leading-relaxed text-muted">Capture a task, then follow it through to completion.</p>
        <button type="button" className="button button-secondary mt-4 w-full" onClick={onOpenAddTask}>Add a task <ChevronRight aria-hidden="true" size={15} /></button>
      </div>
      <div className="sidebar-footer" aria-live="polite"><span className={`h-1.5 w-1.5 rounded-full ${storageIssues.length ? 'bg-amber-600' : 'bg-emerald-500'}`} /> {storageIssues.length ? 'Saving needs attention' : 'Saved on this device'}</div>
    </aside>
    <header className="app-topbar">
      <div className="flex min-w-0 items-center gap-3">
        <button type="button" className="icon-button lg:hidden" onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu" aria-haspopup="dialog" aria-expanded={drawerOpen}><Menu aria-hidden="true" size={21} /></button>
        <span className="hidden lg:inline text-sm text-muted">Workspace</span>
        <ChevronRight className="hidden lg:block text-muted" size={14} aria-hidden="true" />
        <span className="truncate text-sm font-semibold">{section?.label ?? 'Weekly Tasks'}</span>
      </div>
      <div className="flex items-center gap-1 sm:gap-2">
        {onOpenRemindersCenter && <button type="button" className="icon-button relative hidden sm:inline-flex" onClick={onOpenRemindersCenter}
          aria-label="View Spaced Revision Reminders" title="Revision reminders"><RotateCcw aria-hidden="true" size={18} />
          {dueRevisionsCount > 0 && <span className="notification-dot" />}
        </button>}
        {onOpenBackupModal && <button type="button" className="icon-button hidden sm:inline-flex" onClick={onOpenBackupModal} aria-label="Data Backup & Restore" title="Backup & restore"><Download aria-hidden="true" size={18} /></button>}
        <button type="button" className="icon-button" onClick={onToggleDarkMode}
          aria-label={isDarkMode ? 'Switch to Day Mode (Light)' : 'Switch to Night Mode (Dark)'} title={isDarkMode ? 'Use light theme' : 'Use dark theme'}>
          {isDarkMode ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
        </button>
        <button type="button" className="button button-primary topbar-add" onClick={onOpenAddTask} aria-label="Add task to weekly plan">
          <Plus aria-hidden="true" size={18} /><span className="hidden sm:inline">Add Task</span>
        </button>
      </div>
    </header>
    <MobileNavDrawer {...navigation} isOpen={drawerOpen} onClose={closeDrawer} dueRevisionsCount={dueRevisionsCount}
      isDarkMode={isDarkMode} onToggleDarkMode={onToggleDarkMode} onOpenRemindersCenter={onOpenRemindersCenter} />
  </>;
}
