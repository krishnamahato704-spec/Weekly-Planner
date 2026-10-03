import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  ExternalLink,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  BookOpen,
  Link2,
  Globe,
  Check
} from 'lucide-react';
import { ChapterNoteData, ChapterResourceLink } from '../utils/ncertData';

interface NcertChapterNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  chapterId: string;
  chapterTitle: string;
  chapterNumber: number;
  bookTitle: string;
  className: string;
  subject: string;
  initialNotes?: ChapterNoteData;
  isNotesCompleted: boolean;
  onSaveNotes: (chapterId: string, data: ChapterNoteData) => void;
  onToggleNotesComplete: (chapterId: string) => void;
}

export const NcertChapterNotesModal: React.FC<NcertChapterNotesModalProps> = ({
  isOpen,
  onClose,
  chapterId,
  chapterTitle,
  chapterNumber,
  bookTitle,
  className,
  subject,
  initialNotes,
  isNotesCompleted,
  onSaveNotes,
  onToggleNotesComplete,
}) => {
  const [text, setText] = useState('');
  const [primaryLink, setPrimaryLink] = useState('');
  const [resources, setResources] = useState<ChapterResourceLink[]>([]);
  const [newResTitle, setNewResTitle] = useState('');
  const [newResUrl, setNewResUrl] = useState('');
  const [isAddingResource, setIsAddingResource] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (initialNotes) {
      setText(initialNotes.text || '');
      setPrimaryLink(initialNotes.primaryLink || '');
      setResources(initialNotes.resources || []);
    } else {
      setText('');
      setPrimaryLink('');
      setResources([]);
    }
    setIsAddingResource(false);
    setNewResTitle('');
    setNewResUrl('');
    setHasUnsavedChanges(false);
  }, [isOpen, chapterId, initialNotes]);

  if (!isOpen) return null;

  const handleSave = () => {
    const updatedData: ChapterNoteData = {
      text: text.trim(),
      primaryLink: primaryLink.trim(),
      resources,
      updatedAt: new Date().toISOString(),
    };
    onSaveNotes(chapterId, updatedData);
    setHasUnsavedChanges(false);
  };

  const handleAddResource = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newResUrl.trim()) return;

    let url = newResUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = `https://${url}`;
    }

    const title = newResTitle.trim() || 'Resource Link';
    const newRes: ChapterResourceLink = {
      id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      url,
    };

    setResources((prev) => [...prev, newRes]);
    setNewResTitle('');
    setNewResUrl('');
    setIsAddingResource(false);
    setHasUnsavedChanges(true);
  };

  const handleRemoveResource = (id: string) => {
    setResources((prev) => prev.filter((r) => r.id !== id));
    setHasUnsavedChanges(true);
  };

  // Safe external link opener
  const handleOpenExternal = (url: string) => {
    let safeUrl = url.trim();
    if (!safeUrl.startsWith('http://') && !safeUrl.startsWith('https://')) {
      safeUrl = `https://${safeUrl}`;
    }
    window.open(safeUrl, '_blank', 'noopener,noreferrer');
  };

  const hasValidPrimaryLink = primaryLink.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chapter-notes-title"
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 flex flex-col max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-start justify-between gap-3 bg-white/95 dark:bg-slate-900/95 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-md border border-amber-200/60 dark:border-amber-900/40">
                Chapter Notes
              </span>
              <span className="text-xs text-slate-400">·</span>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                {className} · {subject}
              </span>
            </div>
            <h2
              id="chapter-notes-title"
              className="text-base sm:text-lg font-bold text-slate-950 dark:text-white mt-1 leading-snug"
            >
              Ch {chapterNumber}: {chapterTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
              {bookTitle}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            aria-label="Close notes modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {/* Section 1: Notes Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-500" />
                <span>My Notes & Key Concepts</span>
              </label>
              <span className="text-[11px] text-slate-400">
                Plain text or bullet points
              </span>
            </div>
            <textarea
              rows={6}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Jot down key takeaways, important dates, formulas, memory tricks, or exam focal points..."
              className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/50 leading-relaxed font-sans"
            />
          </div>

          {/* Section 2: External Primary Notes Link */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-indigo-500" />
                <span>External Notes Link</span>
              </label>
              {hasValidPrimaryLink && (
                <button
                  type="button"
                  onClick={() => handleOpenExternal(primaryLink)}
                  className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                >
                  <span>Open Notes</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
            <input
              type="url"
              value={primaryLink}
              onChange={(e) => {
                setPrimaryLink(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="e.g. Google Docs, Google Drive, Notion, or OneNote link"
              className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-950/50 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            />
            <p className="text-[11px] text-slate-400">
              Paste your digital notebook or Google Doc URL for instant 1-click access.
            </p>
          </div>

          {/* Section 3: Optional Supporting Resource Links */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-teal-500" />
                <span>Supporting Resources ({resources.length})</span>
              </label>
              {!isAddingResource && (
                <button
                  type="button"
                  onClick={() => setIsAddingResource(true)}
                  className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Link</span>
                </button>
              )}
            </div>

            {/* List of Resource Links */}
            {resources.length > 0 && (
              <div className="space-y-1.5">
                {resources.map((res) => (
                  <div
                    key={res.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-xs"
                  >
                    <div className="min-w-0 flex-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-teal-500 shrink-0" />
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {res.title}
                      </span>
                      <span className="text-slate-400 text-[11px] truncate hidden sm:inline">
                        ({res.url})
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenExternal(res.url)}
                        className="p-1 text-slate-500 hover:text-indigo-600 dark:hover:text-indigo-400 rounded-md hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                        title="Open external resource"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveResource(res.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                        title="Remove link"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add Resource Inline Form */}
            {isAddingResource && (
              <form
                onSubmit={handleAddResource}
                className="p-3 rounded-xl border border-teal-200 dark:border-teal-800/80 bg-teal-50/40 dark:bg-teal-950/20 space-y-2 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newResTitle}
                    onChange={(e) => setNewResTitle(e.target.value)}
                    placeholder="Resource Title (e.g. NCERT PDF, YouTube Lecture)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                  <input
                    type="url"
                    required
                    value={newResUrl}
                    onChange={(e) => setNewResUrl(e.target.value)}
                    placeholder="URL (https://...)"
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingResource(false)}
                    className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 text-white bg-teal-600 hover:bg-teal-700 rounded-md font-semibold"
                  >
                    Add Resource
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
          {/* Mark Notes Complete Action (per P1.3 requirement) */}
          <button
            type="button"
            onClick={() => onToggleNotesComplete(chapterId)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-colors flex items-center justify-center gap-1.5 min-h-[40px] ${
              isNotesCompleted
                ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-300 text-amber-800 dark:text-amber-300'
                : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-amber-400'
            }`}
          >
            {isNotesCompleted ? (
              <>
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Notes Stage: Completed ✓</span>
              </>
            ) : (
              <>
                <span>○</span>
                <span>Mark Notes Complete</span>
              </>
            )}
          </button>

          {/* Save & Close */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200/70 dark:hover:bg-slate-800 rounded-xl transition-colors min-h-[40px]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl shadow-xs transition-colors flex items-center gap-1.5 min-h-[40px]"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
