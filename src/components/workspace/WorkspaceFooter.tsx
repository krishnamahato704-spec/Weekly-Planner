import { useSyncExternalStore } from 'react';
import { ArrowUp } from 'lucide-react';
import { getStorageIssues, subscribeStorage } from '../../utils/storage';

export function WorkspaceFooter({ onOpenBackup }: { onOpenBackup: () => void }) {
  const issues = useSyncExternalStore(subscribeStorage, getStorageIssues);
  return <footer className="workspace-footer">
    <div><p className="footer-brand">WeeklyPlan<span aria-hidden="true">.</span></p><p className="footer-description">Your work, week by week.</p></div>
    <div className="footer-controls">
      <p className="footer-storage"><span className={`status-dot ${issues.length ? 'status-warning' : ''}`} aria-hidden="true" />{issues.length ? 'Saving needs attention' : 'Stored in this browser'}</p>
      <button type="button" className="footer-link" onClick={onOpenBackup}>Backup & restore</button>
      <button type="button" className="icon-button" aria-label="Back to top" onClick={() => {
        document.getElementById('main-content')?.focus({ preventScroll: true });
        window.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }}><ArrowUp size={18} aria-hidden="true" /></button>
    </div>
  </footer>;
}
