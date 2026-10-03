import { StudySession, ActiveStudySession, Task } from '../types';

export const STUDY_SESSIONS_STORAGE_KEY = 'sunday_plan_study_sessions_v1';
export const ACTIVE_SESSION_STORAGE_KEY = 'sunday_plan_active_study_session_v1';

/**
 * Returns today's date in local YYYY-MM-DD format
 */
export const getTodayDateString = (): string => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Formats a YYYY-MM-DD date into friendly string, e.g. "Wednesday, 30 September"
 */
export const formatFriendlyDate = (dateStr: string): string => {
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      }).format(d);
    }
  } catch {
    // fallback
  }
  return dateStr;
};

/**
 * Returns time of day greeting
 */
export const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/**
 * Loads all recorded study sessions from localStorage
 */
export const loadStudySessions = (): StudySession[] => {
  try {
    const saved = localStorage.getItem(STUDY_SESSIONS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to load study sessions:', err);
  }
  return [];
};

/**
 * Saves all study sessions to localStorage
 */
export const saveStudySessions = (sessions: StudySession[]): void => {
  try {
    localStorage.setItem(STUDY_SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.error('Failed to save study sessions:', err);
  }
};

/**
 * Loads currently active study session if one was running
 */
export const loadActiveStudySession = (): ActiveStudySession | null => {
  try {
    const saved = localStorage.getItem(ACTIVE_SESSION_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.startedAt === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load active study session:', err);
  }
  return null;
};

/**
 * Persists active study session
 */
export const saveActiveStudySession = (active: ActiveStudySession | null): void => {
  try {
    if (!active) {
      localStorage.removeItem(ACTIVE_SESSION_STORAGE_KEY);
    } else {
      localStorage.setItem(ACTIVE_SESSION_STORAGE_KEY, JSON.stringify(active));
    }
  } catch (err) {
    console.error('Failed to save active study session:', err);
  }
};

/**
 * Calculates current live elapsed seconds for an active session
 */
export const calculateActiveElapsedSeconds = (session: ActiveStudySession): number => {
  if (session.isPaused) {
    return Math.max(0, session.accumulatedSeconds);
  }
  const currentStint = Math.floor((Date.now() - session.startedAt) / 1000);
  return Math.max(0, session.accumulatedSeconds + Math.max(0, currentStint));
};

/**
 * Formats seconds into HH:MM:SS (or MM:SS)
 */
export const formatDurationHMS = (seconds: number): string => {
  const safeSec = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);
  const s = safeSec % 60;

  const mStr = String(m).padStart(2, '0');
  const sStr = String(s).padStart(2, '0');

  if (h > 0) {
    const hStr = String(h).padStart(2, '0');
    return `${hStr}:${mStr}:${sStr}`;
  }
  return `${mStr}:${sStr}`;
};

/**
 * Formats duration in friendly text, e.g. "1h 35m", "45m", "25s"
 */
export const formatDurationFriendly = (seconds: number): string => {
  const safeSec = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safeSec / 3600);
  const m = Math.floor((safeSec % 3600) / 60);

  if (h > 0 && m > 0) {
    return `${h}h ${m}m`;
  }
  if (h > 0) {
    return `${h}h`;
  }
  if (m > 0) {
    return `${m}m`;
  }
  return `${safeSec}s`;
};

/**
 * Formats minutes into friendly string, e.g. 155 -> "2h 35m", 45 -> "45 min"
 */
export const formatMinutesFriendly = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m} min`;
};

/**
 * Calculates study metrics for today
 */
export const getTodayStudyMetrics = (sessions: StudySession[]) => {
  const todayStr = getTodayDateString();
  const todaySessions = sessions.filter((s) => {
    // Check if startedAt matches today
    return s.startedAt.startsWith(todayStr);
  });

  const totalSeconds = todaySessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  return {
    sessionsCount: todaySessions.length,
    totalSeconds,
    friendlyStudyTime: formatDurationFriendly(totalSeconds),
  };
};

/**
 * Calculates study metrics for a given Sunday week (Sunday through Saturday)
 */
export const getWeekStudyMetrics = (sessions: StudySession[], sundayDateStr: string) => {
  try {
    const [y, m, d] = sundayDateStr.split('-').map(Number);
    const startOfWeek = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endOfWeek = new Date(y, m - 1, d + 7, 0, 0, 0, 0);

    const weekSessions = sessions.filter((s) => {
      const sessionDate = new Date(s.startedAt);
      return sessionDate >= startOfWeek && sessionDate < endOfWeek;
    });

    const totalSeconds = weekSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
    return {
      sessionsCount: weekSessions.length,
      totalSeconds,
      friendlyStudyTime: formatDurationFriendly(totalSeconds),
    };
  } catch {
    return { sessionsCount: 0, totalSeconds: 0, friendlyStudyTime: '0m' };
  }
};

/**
 * Gets recorded study stats for a specific task ID
 */
export const getTaskStudyStats = (sessions: StudySession[], taskId: string) => {
  const taskSessions = sessions.filter((s) => s.taskId === taskId);
  const totalSeconds = taskSessions.reduce((acc, s) => acc + s.durationSeconds, 0);
  return {
    sessionsCount: taskSessions.length,
    totalSeconds,
    totalMinutes: Math.round(totalSeconds / 60),
    friendlyStudyTime: formatDurationFriendly(totalSeconds),
  };
};
