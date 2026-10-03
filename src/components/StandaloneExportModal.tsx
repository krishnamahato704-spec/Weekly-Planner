import React, { useState, useMemo } from 'react';
import { X, Copy, Check, Download, FileCode } from 'lucide-react';
import { generateStandaloneHtml } from '../utils/generateStandaloneHtml';
import { useTimeout } from '../hooks/useTimeout';

interface StandaloneExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const StandaloneExportModal: React.FC<StandaloneExportModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const { schedule } = useTimeout();
  const htmlContent = useMemo(() => isOpen ? generateStandaloneHtml() : '', [isOpen]);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(htmlContent);
      setCopied(true);
      schedule(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy standalone HTML:', error);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'weekly_task_and_progress_tracker.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white dark:bg-neutral-900 rounded-xl border border-neutral-200 dark:border-neutral-800 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200 dark:border-neutral-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FileCode className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                Standalone Single-File HTML
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Self-contained HTML, CSS & JavaScript with CDN libraries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <p className="text-xs text-neutral-600 dark:text-neutral-400">
            This single <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-emerald-600 font-mono text-[11px]">.html</code> file includes all styles (Tailwind CSS CDN), Lucide icons, Chart.js, Canvas-Confetti, persistent <code className="px-1.5 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-emerald-600 font-mono text-[11px]">localStorage</code>, and complete UI. You can double-click and run it directly in any browser without needing Node.js or a server.
          </p>

          <div className="relative rounded-lg border border-neutral-200 dark:border-neutral-800 bg-neutral-950 p-4 font-mono text-xs text-neutral-300 max-h-72 overflow-y-auto">
            <pre><code>{htmlContent.slice(0, 1500)}...

{`<!-- [Full code with embedded Chart.js, Confetti, Tailwind, and LocalStorage logic] -->`}</code></pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 flex items-center justify-between shrink-0 bg-neutral-50 dark:bg-neutral-900">
          <span className="text-xs text-neutral-500 dark:text-neutral-400">
            Self-contained file ~ 18 KB
          </span>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied HTML!' : 'Copy Code'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 rounded-lg shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download index.html</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
