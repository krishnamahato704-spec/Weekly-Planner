import type { FullBackupData } from '../components/UnifiedBackupModal';
import { DataValidationError, parseBoundedJson, validateBackup, validateNcertProgress } from './dataValidation';
export function parseBackup(text: string, current: FullBackupData): FullBackupData {
    const parsed = parseBoundedJson(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
        throw new DataValidationError('A backup must be a JSON object.');
    const envelope = parsed as Record<string, unknown>;
    if (envelope.app === 'WeeklyPlan' && envelope.data) {
        if (envelope.backupVersion !== undefined && ![4, 5].includes(envelope.backupVersion as number))
            throw new DataValidationError('This backup version is not supported.');
        return validateBackup(envelope.data);
    }
    if (envelope.type === 'ncert_social_science_progress' && envelope.progress)
        return validateBackup({ ...current, ncertProgress: validateNcertProgress(envelope.progress) });
    if (envelope.weeks !== undefined || envelope.ncertProgress !== undefined)
        return validateBackup({ ...current, ...(envelope.weeks !== undefined ? { weeks: envelope.weeks, activeWeekId: undefined } : {}), ...(envelope.ncertProgress !== undefined ? { ncertProgress: envelope.ncertProgress } : {}) });
    throw new DataValidationError('Choose a WeeklyPlan backup JSON file.');
}
function mergeItems<T extends {
    id: string;
}>(current: T[] = [], incoming: T[] = [], merge?: (old: T, value: T) => T): T[] {
    const result = new Map(current.map(item => [item.id, item]));
    for (const item of incoming) {
        const old = result.get(item.id);
        result.set(item.id, old && merge ? merge(old, item) : item);
    }
    return [...result.values()];
}
export function mergeBackups(current: FullBackupData, incoming: FullBackupData): FullBackupData {
    const ncertProgress = { ...current.ncertProgress };
    for (const [id, value] of Object.entries(incoming.ncertProgress)) {
        const old = ncertProgress[id];
        if (!old) {
            ncertProgress[id] = value;
            continue;
        }
        const revisionHistory = mergeItems(old.revisionHistory, value.revisionHistory).sort((a, b) => Date.parse(a.completedAt || '1970-01-01') - Date.parse(b.completedAt || '1970-01-01'));
        ncertProgress[id] = {
            ...old, ...value, reading: old.reading || value.reading, notes: old.notes || value.notes, revision: old.revision || value.revision, readingAt: value.readingAt || old.readingAt, notesAt: value.notesAt || old.notesAt, revisionAt: revisionHistory.at(-1)?.completedAt || value.revisionAt || old.revisionAt, revisionHistory
        };
    }
    return validateBackup({
        ...current, ...incoming,
        weeks: mergeItems(current.weeks, incoming.weeks, (old, value) => ({ ...old, ...value, tasks: mergeItems(old.tasks, value.tasks) })),
        programs: mergeItems(current.programs, incoming.programs, (old, value) => ({
            ...old, ...value, siTasks: mergeItems(old.siTasks, value.siTasks), subjects: mergeItems(old.subjects, value.subjects, (oldSubject, subject) => ({ ...oldSubject, ...subject, chapters: mergeItems(oldSubject.chapters, subject.chapters) }))
        })),
        ncertProgress,
        ncertNotes: { ...current.ncertNotes, ...incoming.ncertNotes },
        studySessions: mergeItems(current.studySessions, incoming.studySessions),
    });
}
