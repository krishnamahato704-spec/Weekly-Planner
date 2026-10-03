import type { Task, WeekPlan, ProgramTab, StudySession, ActiveStudySession, StudyGoals, DailyCapacityConfig, GoogleCalendarIntegrationConfig, SpacedRevisionSchedule, ReminderPreferences } from '../types';
import type { NcertProgressStore, NcertNotesStore, RevisionEvent } from './ncertData';
import type { FullBackupData } from '../components/UnifiedBackupModal';
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
const forbiddenKeys = new Set(['__proto__', 'prototype', 'constructor']);
export class DataValidationError extends Error {
}
const fail = (name: string): never => { throw new DataValidationError(`Invalid ${name}. Check the backup format and field limits.`); };
export function parseBoundedJson(text: string, maximum = MAX_BACKUP_BYTES): unknown {
    if (text.length > maximum || new TextEncoder().encode(text).length > maximum)
        throw new DataValidationError('The data exceeds the file size limit.');
    try {
        return JSON.parse(text, (key, value) => {
            if (forbiddenKeys.has(key))
                throw new DataValidationError('Reserved object keys are not allowed.');
            return value;
        });
    }
    catch (error) {
        if (error instanceof DataValidationError)
            throw error;
        throw new DataValidationError('The data must be valid JSON.');
    }
}
const object = (v: unknown, name: string): Record<string, unknown> => {
    if (!v || typeof v !== 'object' || Array.isArray(v) || Object.keys(v).some(k => forbiddenKeys.has(k)))
        return fail(name);
    return v as Record<string, unknown>;
};
const text = (v: unknown, name: string, max = 500, fallback?: string): string => {
    if (v === undefined && fallback !== undefined)
        return fallback;
    if (typeof v !== 'string' || v.length > max || v.includes('\u0000'))
        return fail(name);
    return v;
};
const optionalText = (v: unknown, name: string, max = 20000) => v === undefined ? undefined : text(v, name, max);
const id = (v: unknown): string => {
    const value = text(v, 'identifier', 128);
    return /^[A-Za-z0-9._:-]+$/.test(value) && !forbiddenKeys.has(value) ? value : fail('identifier');
};
const bool = (v: unknown, name: string, fallback = false): boolean => v === undefined ? fallback : typeof v === 'boolean' ? v : fail(name);
const number = (v: unknown, name: string, maximum: number, fallback?: number): number => {
    if (v === undefined && fallback !== undefined)
        return fallback;
    return typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= maximum ? v : fail(name);
};
const choice = <T extends string>(v: unknown, options: readonly T[], name: string, fallback?: T): T => {
    if (v === undefined && fallback !== undefined)
        return fallback;
    return options.includes(v as T) ? v as T : fail(name);
};
const array = <T>(v: unknown, name: string, maximum: number, validate: (item: unknown) => T): T[] => {
    if (!Array.isArray(v) || v.length > maximum)
        return fail(name);
    return v.map(validate);
};
const unique = <T extends {
    id: string;
}>(values: T[], name: string): T[] => new Set(values.map(v => v.id)).size === values.length ? values : fail(`duplicate ${name}`);
const date = (v: unknown, name: string): string => {
    const value = text(v, name, 40);
    if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/.test(value) || !Number.isFinite(Date.parse(value)))
        return fail(name);
    if (new Date(value.slice(0, 10)).toISOString().slice(0, 10) !== value.slice(0, 10) || (value.length > 10 && !/T(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d/.test(value)))
        return fail(name);
    return value;
};
const optionalDate = (v: unknown, name: string) => v === undefined ? undefined : date(v, name);
const activities = ['reading', 'notes', 'revision'] as const;
function ncertReference(v: unknown): Task['ncertRef'] {
    if (v === undefined)
        return undefined;
    const r = object(v, 'chapter reference');
    const classNum = number(r.classNum, 'class number', 12);
    if (!Number.isInteger(classNum) || classNum < 6)
        return fail('class number');
    return {
        classNum, subject: text(r.subject, 'subject', 100), bookTitle: text(r.bookTitle, 'book title'), bookId: r.bookId === undefined ? undefined : id(r.bookId), chapterId: id(r.chapterId), chapterTitle: text(r.chapterTitle, 'chapter title'), activity: choice(r.activity, activities, 'activity')
    };
}
export function validateTask(v: unknown, createdAt = '1970-01-01T00:00:00.000Z'): Task {
    const t = object(v, 'task');
    const title = text(t.title, 'task title');
    if (!title.trim())
        return fail('empty task title');
    const startTime = optionalText(t.startTime, 'start time', 5);
    if (startTime !== undefined && !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))
        return fail('start time');
    return {
        id: id(t.id), title, category: text(t.category, 'category', 100, 'Personal'), priority: choice(t.priority, ['High', 'Medium', 'Low'], 'priority', 'Medium'), completed: bool(t.completed, 'completion'), createdAt: t.createdAt === undefined ? createdAt : date(t.createdAt, 'creation date'), completedAt: optionalDate(t.completedAt, 'completion date'), carriedOverFrom: t.carriedOverFrom === undefined ? undefined : id(t.carriedOverFrom), isRecurring: t.isRecurring === undefined ? undefined : bool(t.isRecurring, 'recurrence'), notes: optionalText(t.notes, 'task notes'), scheduledDate: optionalDate(t.scheduledDate, 'scheduled date'), startTime, estimatedMinutes: t.estimatedMinutes === undefined ? undefined : number(t.estimatedMinutes, 'estimated minutes', 1440), ncertRef: ncertReference(t.ncertRef), externalCalendarProvider: optionalText(t.externalCalendarProvider, 'calendar provider', 100), externalCalendarId: optionalText(t.externalCalendarId, 'calendar identifier', 256), externalEventId: optionalText(t.externalEventId, 'event identifier', 256), lastSyncedAt: optionalDate(t.lastSyncedAt, 'sync date'), syncStatus: t.syncStatus === undefined ? undefined : choice(t.syncStatus, ['synced', 'pending', 'failed', 'conflict'] as const, 'sync status')
    };
}
export function validateWeeks(v: unknown): WeekPlan[] {
    let taskCount = 0;
    return unique(array(v, 'weekly plans', 520, value => {
        const w = object(value, 'week');
        const sundayDate = date(w.sundayDate, 'week date');
        const createdAt = w.createdAt === undefined ? sundayDate : date(w.createdAt, 'week creation date');
        const tasks = unique(array(w.tasks, 'tasks', 2000, t => validateTask(t, createdAt)), 'task identifiers');
        taskCount += tasks.length;
        if (taskCount > 10000)
            return fail('task count');
        return {
            id: id(w.id), sundayDate, title: text(w.title, 'week title'), focusGoal: optionalText(w.focusGoal, 'weekly goal'), tasks, createdAt, isArchived: w.isArchived === undefined ? undefined : bool(w.isArchived, 'archive flag')
        };
    }), 'week identifiers');
}
export function validatePrograms(v: unknown): ProgramTab[] {
    let chapterCount = 0;
    return unique(array(v, 'programs', 100, value => {
        const p = object(value, 'program');
        return {
            id: id(p.id), type: choice(p.type, ['bed', 'ma', 'ctet', 'ugc_net', 'canva', 'custom'], 'program type'), title: text(p.title, 'program title'), subtitle: optionalText(p.subtitle, 'subtitle', 500), badge: optionalText(p.badge, 'badge', 100), color: choice(p.color, ['indigo', 'emerald', 'blue', 'amber', 'purple', 'rose', 'cyan'], 'program color'), createdAt: p.createdAt === undefined ? '1970-01-01T00:00:00.000Z' : date(p.createdAt, 'program creation date'), siTasks: p.siTasks === undefined ? undefined : unique(array(p.siTasks, 'internship tasks', 500, value => {
                const t = object(value, 'internship task');
                return {
                    id: id(t.id), title: text(t.title, 'internship title'), targetCount: number(t.targetCount, 'target count', 100000), currentCount: number(t.currentCount, 'current count', 100000), status: choice(t.status, ['pending', 'in_progress', 'completed'], 'internship status'), notes: optionalText(t.notes, 'internship notes'), finishedAt: optionalDate(t.finishedAt, 'finished date')
                };
            }), 'internship identifiers'), subjects: p.subjects === undefined ? undefined : unique(array(p.subjects, 'subjects', 200, value => {
                const s = object(value, 'subject');
                const chapters = unique(array(s.chapters, 'chapters', 1000, value => {
                    const c = object(value, 'chapter');
                    if (++chapterCount > 20000)
                        return fail('chapter count');
                    return {
                        id: id(c.id), chapterNumber: number(c.chapterNumber, 'chapter number', 10000), title: text(c.title, 'chapter title'), readingNotes: bool(c.readingNotes, 'reading notes'), deepStudy: bool(c.deepStudy, 'deep study'), revision: bool(c.revision, 'revision'), isFinished: bool(c.isFinished, 'finished flag'), finishedAt: optionalDate(c.finishedAt, 'finished date'), notes: optionalText(c.notes, 'chapter notes')
                    };
                }), 'chapter identifiers');
                return {
                    id: id(s.id), code: optionalText(s.code, 'subject code', 100), name: text(s.name, 'subject name'), description: optionalText(s.description, 'subject description'), chapters
                };
            }), 'subject identifiers')
        };
    }), 'program identifiers');
}
const revisionEvent = (value: unknown): RevisionEvent => {
    const e = object(value, 'revision event');
    return {
        id: id(e.id), completedAt: e.completedAt === '' ? '' : date(e.completedAt, 'revision date'), legacy: e.legacy === undefined ? undefined : bool(e.legacy, 'legacy flag'), notes: optionalText(e.notes, 'revision notes'), taskId: e.taskId === undefined ? undefined : id(e.taskId)
    };
};
function record<T>(v: unknown, name: string, validate: (item: unknown) => T): Record<string, T> {
    const raw = object(v, name);
    if (Object.keys(raw).length > 1000)
        return fail(name);
    const result: Record<string, T> = {};
    for (const [key, value] of Object.entries(raw)) {
        if (key.length > 128 || !/^c(?:[6-9]|1[0-2])-[A-Za-z0-9-]+$/.test(key))
            return fail('chapter identifier');
        result[key] = validate(value);
    }
    return result;
}
export function validateNcertProgress(v: unknown): NcertProgressStore {
    return record(v, 'NCERT progress', value => {
        const p = object(value, 'chapter progress');
        return {
            reading: bool(p.reading, 'reading'), readingAt: optionalDate(p.readingAt, 'reading date'), notes: bool(p.notes, 'notes'), notesAt: optionalDate(p.notesAt, 'notes date'), revision: bool(p.revision, 'revision'), revisionAt: p.revisionAt === '' ? '' : optionalDate(p.revisionAt, 'revision date'), revisionHistory: p.revisionHistory === undefined ? undefined : unique(array(p.revisionHistory, 'revision history', 1000, revisionEvent), 'revision identifiers')
        };
    });
}
export function safeExternalUrl(value: string): string {
    const raw = value.trim();
    if (!raw)
        return '';
    if (raw.length > 2048 || /[\u0000-\u0020\u007f]/.test(raw))
        return fail('resource URL');
    const candidate = /^[a-z][a-z\d+.-]*:/i.test(raw) ? raw : `https://${raw}`;
    try {
        const url = new URL(candidate);
        if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password || !url.hostname)
            return fail('resource URL');
        return url.href;
    }
    catch {
        return fail('resource URL');
    }
}
export function validateNcertNotes(v: unknown): NcertNotesStore {
    return record(v, 'chapter notes', value => {
        const n = object(value, 'chapter note');
        return {
            text: text(n.text, 'note text', 20000, ''), primaryLink: safeExternalUrl(text(n.primaryLink, 'primary link', 2048, '')), updatedAt: optionalDate(n.updatedAt, 'note update date'), resources: unique(array(n.resources ?? [], 'resources', 100, value => { const r = object(value, 'resource'); return { id: id(r.id), title: text(r.title, 'resource title'), url: safeExternalUrl(text(r.url, 'resource URL', 2048)) }; }), 'resource identifiers')
        };
    });
}
export function validateStudySessions(v: unknown): StudySession[] {
    return unique(array(v, 'study sessions', 20000, value => {
        const s = object(value, 'study session');
        const startedAt = date(s.startedAt, 'session start'), endedAt = date(s.endedAt, 'session end');
        if (Date.parse(endedAt) < Date.parse(startedAt))
            return fail('session date order');
        return {
            id: id(s.id), taskId: s.taskId === undefined ? undefined : id(s.taskId), taskTitle: text(s.taskTitle, 'session title'), startedAt, endedAt, durationSeconds: number(s.durationSeconds, 'session duration', 7 * 86400), category: optionalText(s.category, 'session category', 100), ncertRef: ncertReference(s.ncertRef), notes: optionalText(s.notes, 'session notes'), isManual: s.isManual === undefined ? undefined : bool(s.isManual, 'manual flag')
        };
    }), 'session identifiers');
}
export function validateActiveSession(v: unknown): ActiveStudySession {
    const s = object(v, 'active session');
    return {
        taskId: s.taskId === undefined ? undefined : id(s.taskId), taskTitle: text(s.taskTitle, 'active session title'), category: optionalText(s.category, 'active category', 100), startedAt: number(s.startedAt, 'session start', 8.64e15), accumulatedSeconds: number(s.accumulatedSeconds, 'elapsed seconds', 7 * 86400), isPaused: bool(s.isPaused, 'pause flag'), lastPausedAt: s.lastPausedAt === undefined ? undefined : number(s.lastPausedAt, 'pause time', 8.64e15), ncertRef: ncertReference(s.ncertRef)
    };
}
export function validateGoals(v: unknown): StudyGoals { const g = object(v, 'study goals'); return {
    weeklyStudyMinutesGoal: number(g.weeklyStudyMinutesGoal, 'weekly minutes', 10080), weeklyTasksGoal: number(g.weeklyTasksGoal, 'weekly tasks', 10000), weeklyNcertChaptersGoal: number(g.weeklyNcertChaptersGoal, 'weekly chapters', 1000), weeklyRevisionSessionsGoal: number(g.weeklyRevisionSessionsGoal, 'weekly revisions', 10000)
}; }
export function validateCapacity(v: unknown): DailyCapacityConfig { const c = object(v, 'daily capacity'); return { weekdayCapacityMinutes: number(c.weekdayCapacityMinutes, 'weekday minutes', 1440), weekendCapacityMinutes: number(c.weekendCapacityMinutes, 'weekend minutes', 1440) }; }
export function validateSchedule(v: unknown): SpacedRevisionSchedule { const s = object(v, 'revision schedule'); const intervalsDays = array(s.intervalsDays, 'revision intervals', 30, v => number(v, 'interval days', 3650)); if (!intervalsDays.length || intervalsDays.some(v => !Number.isInteger(v) || v < 1))
    return fail('revision intervals'); return { intervalsDays, enabled: bool(s.enabled, 'schedule enabled', true) }; }
export function validateReminders(v: unknown): ReminderPreferences { const r = object(v, 'reminder preferences'); return {
    inAppRemindersEnabled: bool(r.inAppRemindersEnabled, 'in-app reminders', true), thresholdDays: number(r.thresholdDays, 'reminder days', 365), includeInTodayDashboard: bool(r.includeInTodayDashboard, 'today reminders', true), browserNotificationsEnabled: bool(r.browserNotificationsEnabled, 'browser notifications')
}; }
export function validateCalendar(v: unknown): GoogleCalendarIntegrationConfig { const c = object(v, 'calendar preferences'); return {
    connected: bool(c.connected, 'calendar connection'), accountEmail: optionalText(c.accountEmail, 'account email', 254), syncPlannerToGoogle: choice(c.syncPlannerToGoogle, ['off', 'timed_only', 'all'], 'outbound sync', 'off'), syncGoogleToPlanner: bool(c.syncGoogleToPlanner, 'inbound sync'), syncDirection: choice(c.syncDirection, ['planner_to_google', 'google_to_planner', 'two_way'], 'sync direction', 'planner_to_google'), lastSyncedAt: optionalDate(c.lastSyncedAt, 'last sync'), status: choice(c.status, ['not_connected', 'connecting', 'connected', 'error'], 'connection status', 'not_connected')
}; }
export function validateBackup(v: unknown): FullBackupData {
    const b = object(v, 'backup');
    const weeks = validateWeeks(b.weeks), programs = validatePrograms(b.programs);
    if (!weeks.length || !programs.length)
        return fail('empty planner backup');
    const activeWeekId = b.activeWeekId === undefined ? weeks[0].id : id(b.activeWeekId);
    if (!weeks.some(w => w.id === activeWeekId))
        return fail('active week');
    const preferences = b.preferences === undefined ? undefined : object(b.preferences, 'preferences');
    return {
        weeks, activeWeekId, programs, ncertProgress: validateNcertProgress(b.ncertProgress ?? {}), ncertNotes: b.ncertNotes === undefined ? undefined : validateNcertNotes(b.ncertNotes), ncertRevisionHistory: b.ncertRevisionHistory === undefined ? undefined : record(b.ncertRevisionHistory, 'revision history', v => unique(array(v, 'revision history', 1000, revisionEvent), 'revision identifiers')), studySessions: b.studySessions === undefined ? undefined : validateStudySessions(b.studySessions), goals: b.goals === undefined ? undefined : validateGoals(b.goals), dailyCapacity: b.dailyCapacity === undefined ? undefined : validateCapacity(b.dailyCapacity), revisionSchedule: b.revisionSchedule === undefined ? undefined : validateSchedule(b.revisionSchedule), reminderPreferences: b.reminderPreferences === undefined ? undefined : validateReminders(b.reminderPreferences), calendarConfig: b.calendarConfig === undefined ? undefined : validateCalendar(b.calendarConfig), preferences: preferences === undefined ? undefined : { isDarkMode: preferences.isDarkMode === undefined ? undefined : bool(preferences.isDarkMode, 'theme preference'), autoSyncNcert: preferences.autoSyncNcert === undefined ? undefined : bool(preferences.autoSyncNcert, 'auto sync') }
    };
}
