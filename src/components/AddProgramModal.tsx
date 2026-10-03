import React, { useState } from 'react';
import { X, Plus, Trash2, GraduationCap, BookOpen, Layers } from 'lucide-react';
import { ProgramTab, SubjectModule } from '../types';

interface AddProgramModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddProgram: (program: ProgramTab) => void;
}

const COLOR_OPTIONS = [
  { id: 'indigo', label: 'Indigo', bg: 'bg-indigo-600', ring: 'ring-indigo-500' },
  { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-600', ring: 'ring-emerald-500' },
  { id: 'blue', label: 'Blue', bg: 'bg-blue-600', ring: 'ring-blue-500' },
  { id: 'amber', label: 'Amber', bg: 'bg-amber-600', ring: 'ring-amber-500' },
  { id: 'purple', label: 'Purple', bg: 'bg-purple-600', ring: 'ring-purple-500' },
  { id: 'rose', label: 'Rose', bg: 'bg-rose-600', ring: 'ring-rose-500' },
  { id: 'cyan', label: 'Cyan', bg: 'bg-cyan-600', ring: 'ring-cyan-500' },
];

export const AddProgramModal: React.FC<AddProgramModalProps> = ({
  isOpen,
  onClose,
  onAddProgram,
}) => {
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [selectedColor, setSelectedColor] = useState('indigo');
  const [initialSubjects, setInitialSubjects] = useState<
    { code: string; name: string; chaptersText: string }[]
  >([
    { code: 'SUB-1', name: '', chaptersText: '' },
  ]);

  if (!isOpen) return null;

  const handleAddSubjectField = () => {
    setInitialSubjects((prev) => [
      ...prev,
      { code: `SUB-${prev.length + 1}`, name: '', chaptersText: '' },
    ]);
  };

  const handleRemoveSubjectField = (index: number) => {
    setInitialSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (
    index: number,
    field: 'code' | 'name' | 'chaptersText',
    val: string
  ) => {
    setInitialSubjects((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: val } : s))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const programId = `prog-${Date.now()}`;

    // Transform initialSubjects into SubjectModule[]
    const builtSubjects: SubjectModule[] = initialSubjects
      .filter((s) => s.name.trim().length > 0)
      .map((s, sIdx) => {
        const lines = s.chaptersText
          .split('\n')
          .map((line) => line.trim())
          .filter((line) => line.length > 0);

        const chaps = lines.length > 0
          ? lines.map((titleText, cIdx) => ({
              id: `${programId}-s${sIdx + 1}-c${cIdx + 1}`,
              chapterNumber: cIdx + 1,
              title: titleText,
              readingNotes: false,
              deepStudy: false,
              revision: false,
              isFinished: false,
            }))
          : [
              {
                id: `${programId}-s${sIdx + 1}-c1`,
                chapterNumber: 1,
                title: 'Introduction & Core Foundations',
                readingNotes: false,
                deepStudy: false,
                revision: false,
                isFinished: false,
              },
            ];

        return {
          id: `${programId}-sub-${sIdx + 1}`,
          code: s.code.trim() || `SUB-${sIdx + 1}`,
          name: s.name.trim(),
          chapters: chaps,
        };
      });

    // If user provided no subjects, give a default subject with 1 chapter
    if (builtSubjects.length === 0) {
      builtSubjects.push({
        id: `${programId}-sub-1`,
        code: 'MOD-1',
        name: `${title.trim()} Fundamentals`,
        chapters: [
          {
            id: `${programId}-sub-1-c1`,
            chapterNumber: 1,
            title: 'Foundational Concepts & Overview',
            readingNotes: false,
            deepStudy: false,
            revision: false,
            isFinished: false,
          },
        ],
      });
    }

    const newProg: ProgramTab = {
      id: programId,
      type: 'custom',
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      badge: badge.trim() || undefined,
      color: selectedColor,
      createdAt: new Date().toISOString(),
      subjects: builtSubjects,
    };

    onAddProgram(newProg);
    onClose();
    // Reset form
    setTitle('');
    setSubtitle('');
    setBadge('');
    setSelectedColor('indigo');
    setInitialSubjects([{ code: 'SUB-1', name: '', chaptersText: '' }]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="modal-panel overflow-y-auto w-full max-w-xl flex flex-col bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200/80 dark:border-slate-800 "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <GraduationCap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Create New Academic Track
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track subjects, chapters, and multi-stage revisions for any curriculum
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-6 space-y-5">
          {/* Title & Badge */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Track / Program Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. KVS TGT, Python, DSSSB PRT"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Badge / Tag
              </label>
              <input
                type="text"
                placeholder="e.g. 2026, Prep"
                value={badge}
                onChange={(e) => setBadge(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Subtitle / Overview
            </label>
            <input
              type="text"
              placeholder="e.g. Complete Syllabus with Subject Modules & Revisions"
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          {/* Color theme */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Color Accent
            </label>
            <div className="flex flex-wrap gap-2.5">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.id}
                  onClick={() => setSelectedColor(c.id)}
                  className={`w-7 h-7 rounded-full ${c.bg} transition-transform ${
                    selectedColor === c.id
                      ? `ring-3 ${c.ring} ring-offset-2 dark:ring-offset-slate-900 scale-110`
                      : 'opacity-70 hover:opacity-100'
                  }`}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>

          {/* Initial Subjects / Modules */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
                Initial Subjects & Chapters
              </label>
              <button
                type="button"
                onClick={handleAddSubjectField}
                className="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Subject
              </button>
            </div>

            <div className="space-y-3">
              {initialSubjects.map((sub, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2.5"
                >
                  <div className="subject-fields">
                    <input
                      type="text"
                      placeholder="Code (e.g. SUB-1)"
                      value={sub.code}
                      onChange={(e) => handleSubjectChange(idx, 'code', e.target.value)}
                      className="w-24 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    <input
                      type="text"
                      placeholder="Subject Name (e.g. General English, Pedagogy)"
                      value={sub.name}
                      onChange={(e) => handleSubjectChange(idx, 'name', e.target.value)}
                      className="min-w-0 flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                    />
                    {initialSubjects.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveSubjectField(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div>
                    <textarea
                      rows={2}
                      placeholder="Chapter titles (one per line, e.g.&#10;1. Nouns and Pronouns&#10;2. Subject-Verb Agreement)"
                      value={sub.chaptersText}
                      onChange={(e) => handleSubjectChange(idx, 'chaptersText', e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim()}
              className="px-4 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-colors"
            >
              Create Track
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
