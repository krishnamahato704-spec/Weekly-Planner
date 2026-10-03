import React, { useSyncExternalStore } from 'react';
import { downloadRecoveryData, getStorageIssues, retryStorage, subscribeStorage } from '../../utils/storage';

export function StorageStatus() {
  const issues = useSyncExternalStore(subscribeStorage, getStorageIssues);
  if (!issues.length) return null;
  const invalid = issues.some(issue => issue.kind === 'invalid');
  return <div role="alert" className="mx-auto my-3 w-full max-w-7xl rounded-xl border border-amber-700 bg-amber-50 p-4 text-sm text-slate-950 dark:bg-slate-900 dark:text-white">
    <p className="font-semibold">{invalid ? 'Some saved data could not be loaded.' : 'Changes are not being saved in this browser.'}</p>
    <p className="mt-1">{invalid ? 'The original saved data is preserved. Download recovery data, then restore a valid backup from the backup center.' : 'You can keep planning in this tab. Download a backup before closing it, or retry saving.'}</p>
    <div className="mt-2 flex flex-wrap gap-2">
      <button type="button" className="button button-secondary" onClick={downloadRecoveryData}>Download recovery data</button>
      {!invalid && <button type="button" className="button button-secondary" onClick={retryStorage}>Retry saving</button>}
    </div>
  </div>;
}

export class ErrorBoundary extends React.Component<React.PropsWithChildren, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  componentDidCatch(error: Error) { console.error('Planner view could not open:', error.name); }
  render() {
    if (!this.state.failed) return this.props.children;
    return <main className="mx-auto max-w-xl p-6 text-slate-950 dark:text-white">
      <h1 className="text-2xl font-bold">This view could not open</h1>
      <p role="alert" className="my-4">Your saved planner data has not been deleted. Download recovery data before reloading, especially if saving was unavailable.</p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="button button-secondary" onClick={downloadRecoveryData}>Download recovery data</button>
        <button type="button" className="button button-primary" onClick={() => window.location.reload()}>Reload planner</button>
      </div>
    </main>;
  }
}
