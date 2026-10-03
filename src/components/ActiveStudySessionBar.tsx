import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, X, Clock, Sparkles } from 'lucide-react';
import { ActiveStudySession } from '../types';
import { calculateActiveElapsedSeconds, formatDurationHMS } from '../utils/studySessionUtils';

interface ActiveStudySessionBarProps {
  activeSession: ActiveStudySession;
  onPause: () => void;
  onResume: () => void;
  onFinish: () => void;
  onCancel: () => void;
}

export const ActiveStudySessionBar: React.FC<ActiveStudySessionBarProps> = ({
  activeSession,
  onPause,
  onResume,
  onFinish,
  onCancel,
}) => {
  // Isolate the 1-second interval inside this bar component to satisfy P2.8 (no full-app rerenders)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(() =>
    calculateActiveElapsedSeconds(activeSession)
  );

  useEffect(() => {
    // Initial sync
    setElapsedSeconds(calculateActiveElapsedSeconds(activeSession));

    if (activeSession.isPaused) {
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(calculateActiveElapsedSeconds(activeSession));
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession]);

  const formattedTime = formatDurationHMS(elapsedSeconds);

  return (
    <aside
      aria-label="Active study session bar"
      className="fixed bottom-3 sm:bottom-5 left-3 right-3 sm:left-auto sm:right-6 sm:max-w-md z-40 bg-slate-900/95 dark:bg-slate-950/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 backdrop-blur-md p-3 sm:p-3.5 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="flex items-center justify-between gap-3">
        {/* Left: Indicator & Task info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border transition-all ${
              activeSession.isPaused
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 shadow-xs shadow-emerald-500/20'
            }`}
          >
            <Clock className={`w-4 h-4 ${!activeSession.isPaused ? 'animate-pulse' : ''}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${
                  activeSession.isPaused ? 'bg-amber-400' : 'bg-emerald-400 animate-ping'
                }`}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                {activeSession.isPaused ? 'Paused' : 'Studying Now'}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-bold text-white truncate leading-tight mt-0.5">
              {activeSession.taskTitle}
            </p>
          </div>
        </div>

        {/* Center: Live Timer Display */}
        <div className="text-right shrink-0 px-2">
          <div className="font-mono font-bold text-base sm:text-lg tabular-nums text-emerald-400 dark:text-emerald-300 tracking-wider">
            {formattedTime}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          {activeSession.isPaused ? (
            <button
              type="button"
              onClick={onResume}
              className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center shadow-xs"
              title="Resume study timer"
              aria-label="Resume study session"
            >
              <Play className="w-4 h-4 fill-white" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onPause}
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl transition-colors border border-slate-700 min-h-[38px] min-w-[38px] flex items-center justify-center"
              title="Pause study timer"
              aria-label="Pause study session"
            >
              <Pause className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={onFinish}
            className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-colors min-h-[38px] flex items-center gap-1.5 shadow-xs"
            title="Finish session and save time"
            aria-label="Finish study session"
          >
            <Square className="w-3.5 h-3.5 fill-white" />
            <span>Finish</span>
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-xl transition-colors min-h-[38px] min-w-[38px] flex items-center justify-center"
            title="Cancel session without saving"
            aria-label="Discard session"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
