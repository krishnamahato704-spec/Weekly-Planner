import {
  StudyGoals,
  DailyCapacityConfig,
  GoogleCalendarIntegrationConfig,
  Task,
} from '../types';

export const STUDY_GOALS_STORAGE_KEY = 'sunday_plan_study_goals_v1';
export const DAILY_CAPACITY_STORAGE_KEY = 'sunday_plan_daily_capacity_v1';
export const GOOGLE_CALENDAR_STORAGE_KEY = 'sunday_plan_google_calendar_v1';

export const DEFAULT_STUDY_GOALS: StudyGoals = {
  weeklyStudyMinutesGoal: 600, // 10 hours
  weeklyTasksGoal: 15,
  weeklyNcertChaptersGoal: 5,
  weeklyRevisionSessionsGoal: 8,
};

export const DEFAULT_DAILY_CAPACITY: DailyCapacityConfig = {
  weekdayCapacityMinutes: 150, // 2h 30m
  weekendCapacityMinutes: 240, // 4h
};

export const DEFAULT_GOOGLE_CALENDAR_CONFIG: GoogleCalendarIntegrationConfig = {
  connected: false,
  syncPlannerToGoogle: 'off',
  syncGoogleToPlanner: false,
  syncDirection: 'planner_to_google',
  status: 'not_connected',
};

export const loadStudyGoals = (): StudyGoals => {
  try {
    const saved = localStorage.getItem(STUDY_GOALS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.weeklyStudyMinutesGoal === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load study goals:', err);
  }
  return DEFAULT_STUDY_GOALS;
};

export const saveStudyGoals = (goals: StudyGoals): void => {
  try {
    localStorage.setItem(STUDY_GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (err) {
    console.error('Failed to save study goals:', err);
  }
};

export const loadDailyCapacity = (): DailyCapacityConfig => {
  try {
    const saved = localStorage.getItem(DAILY_CAPACITY_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.weekdayCapacityMinutes === 'number') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load daily capacity:', err);
  }
  return DEFAULT_DAILY_CAPACITY;
};

export const saveDailyCapacity = (capacity: DailyCapacityConfig): void => {
  try {
    localStorage.setItem(DAILY_CAPACITY_STORAGE_KEY, JSON.stringify(capacity));
  } catch (err) {
    console.error('Failed to save daily capacity:', err);
  }
};

export const loadGoogleCalendarConfig = (): GoogleCalendarIntegrationConfig => {
  try {
    const saved = localStorage.getItem(GOOGLE_CALENDAR_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed.connected === 'boolean') {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load google calendar config:', err);
  }
  return DEFAULT_GOOGLE_CALENDAR_CONFIG;
};

export const saveGoogleCalendarConfig = (config: GoogleCalendarIntegrationConfig): void => {
  try {
    localStorage.setItem(GOOGLE_CALENDAR_STORAGE_KEY, JSON.stringify(config));
  } catch (err) {
    console.error('Failed to save google calendar config:', err);
  }
};

export interface DayWorkloadSummary {
  dateStr: string; // YYYY-MM-DD
  dayName: string; // "Monday", "Tuesday", etc.
  isWeekend: boolean;
  totalPlannedMinutes: number;
  unscheduledCount: number;
  capacityMinutes: number;
  isOverloaded: boolean;
  overloadMinutes: number;
  tasks: Task[];
}

/**
 * Calculates workload across dates in a week
 */
export const calculateWeekWorkload = (
  dates: string[], // list of YYYY-MM-DD for the week (Mon to Sun)
  allTasks: Task[],
  capacityConfig: DailyCapacityConfig = DEFAULT_DAILY_CAPACITY
): DayWorkloadSummary[] => {
  return dates.map((dateStr) => {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dateObj = new Date(y, m - 1, d);
    const dayOfWeek = dateObj.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const capacityMinutes = isWeekend
      ? capacityConfig.weekendCapacityMinutes
      : capacityConfig.weekdayCapacityMinutes;

    const dayName = new Intl.DateTimeFormat('en-US', { weekday: 'long' }).format(dateObj);

    const dayTasks = allTasks.filter((t) => t.scheduledDate === dateStr);
    let totalPlannedMinutes = 0;
    let unscheduledCount = 0;

    for (const t of dayTasks) {
      if (t.estimatedMinutes) {
        totalPlannedMinutes += t.estimatedMinutes;
      } else {
        unscheduledCount += 1;
      }
    }

    const isOverloaded = totalPlannedMinutes > capacityMinutes;
    const overloadMinutes = Math.max(0, totalPlannedMinutes - capacityMinutes);

    return {
      dateStr,
      dayName,
      isWeekend,
      totalPlannedMinutes,
      unscheduledCount,
      capacityMinutes,
      isOverloaded,
      overloadMinutes,
      tasks: dayTasks,
    };
  });
};
