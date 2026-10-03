import React from 'react';
import { X, Moon, Sun, RotateCcw, Download, Upload, NotebookPen, ArrowUpRight, CheckCheck } from 'lucide-react';
import { Dialog } from './ui/Dialog';
import { destinations, isDestinationActive, NavDestination } from './navigation';

export type { NavDestination } from './navigation';
export interface NavigationContentProps {
  currentSection: NavDestination;
  onSelectDestination: (destination: NavDestination) => void;
  pendingTasksCount: number;
  ncertPercent: number;
  onOpenUploadScanModal: () => void;
  onOpenNotebookModal: () => void;
  onOpenExportModal: () => void;
  onOpenBackupModal?: () => void;
}
export function Brand() {
  return <span className="flex items-center gap-3">
    <span className="brand-mark"><CheckCheck size={22} strokeWidth={2.2} aria-hidden="true" /></span>
    <span className="text-left"><span className="block font-display font-bold text-[17px] tracking-tight">WeeklyPlan</span>
      <span className="block text-[11px] font-medium text-muted">Your weekly workspace</span></span>
  </span>;
}
export function NavigationContent({ currentSection, onSelectDestination, pendingTasksCount, ncertPercent,
  onOpenUploadScanModal, onOpenNotebookModal, onOpenExportModal, onOpenBackupModal }: NavigationContentProps) {
  const tools = [
    { label: 'Scan a handwritten plan', icon: Upload, action: onOpenUploadScanModal },
    { label: 'Notebook reference', icon: NotebookPen, action: onOpenNotebookModal },
    { label: 'Export planner', icon: ArrowUpRight, action: onOpenExportModal },
    ...(onOpenBackupModal ? [{ label: 'Backup & restore', icon: Download, action: onOpenBackupModal }] : []),
  ];
  return <>
    <p className="nav-label">Workspace</p>
    <nav aria-label="Main navigation" className="space-y-1">
      {destinations.map(({ id, label, icon: Icon }) => {
        const active = isDestinationActive(id, currentSection);
        const badge = id === 'weekly_planning' && pendingTasksCount > 0 ? pendingTasksCount : id === 'ncert' && ncertPercent > 0 ? `${ncertPercent}%` : null;
        return <button key={id} type="button" onClick={() => onSelectDestination(id)}
          className="nav-item" aria-current={active ? 'page' : undefined}>
          <Icon size={18} aria-hidden="true" /><span className="flex-1">{label}</span>
          {badge !== null && <span className="nav-badge">{badge}</span>}
        </button>;
      })}
    </nav>
    <p className="nav-label mt-8">Tools</p>
    <div className="space-y-1">
      {tools.map(({ label, icon: Icon, action }) => <button key={label} type="button" className="nav-item nav-tool" onClick={action}>
        <Icon size={17} aria-hidden="true" /><span>{label}</span>
      </button>)}
    </div>
  </>;
}
interface MobileNavDrawerProps extends NavigationContentProps {
  isOpen: boolean;
  onClose: () => void;
  dueRevisionsCount?: number;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenRemindersCenter?: () => void;
}
export function MobileNavDrawer({ isOpen, onClose, isDarkMode, onToggleDarkMode, dueRevisionsCount = 0,
  onOpenRemindersCenter, ...navigation }: MobileNavDrawerProps) {
  const closeThen = (action: () => void) => () => { onClose(); action(); };
  return <Dialog isOpen={isOpen} onClose={onClose} label="Mobile Navigation Menu" className="navigation-dialog">
  <div className="flex items-center justify-between gap-2 mb-8">
    <Brand />
    <button type="button" className="icon-button" onClick={onClose} aria-label="Close navigation menu"><X aria-hidden="true" size={20} /></button>
  </div>
  <NavigationContent {...navigation}
    onSelectDestination={destination => { onClose(); navigation.onSelectDestination(destination); }}
    onOpenUploadScanModal={closeThen(navigation.onOpenUploadScanModal)}
    onOpenNotebookModal={closeThen(navigation.onOpenNotebookModal)}
    onOpenExportModal={closeThen(navigation.onOpenExportModal)}
    onOpenBackupModal={navigation.onOpenBackupModal && closeThen(navigation.onOpenBackupModal)} />
  <div className="mt-auto pt-8 space-y-1">
    {onOpenRemindersCenter && <button type="button" className="nav-item" onClick={closeThen(onOpenRemindersCenter)}>
      <RotateCcw aria-hidden="true" size={18} /><span className="flex-1">Revision Reminders</span>{dueRevisionsCount > 0 && <span className="nav-badge">{dueRevisionsCount}</span>}
    </button>}
    <button type="button" className="nav-item" onClick={onToggleDarkMode}>
      {isDarkMode ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}<span>{isDarkMode ? 'Day Mode (Light)' : 'Night Mode (Dark)'}</span>
    </button>
  </div>
</Dialog>;
}
