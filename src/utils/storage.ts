import { MAX_BACKUP_BYTES, parseBoundedJson } from './dataValidation';
export interface StorageIssue {
    key: string;
    kind: 'unavailable' | 'invalid';
}
const issues = new Map<string, StorageIssue>();
const protectedKeys = new Set<string>();
const pending = new Map<string, string>();
const listeners = new Set<() => void>();
let snapshot: readonly StorageIssue[] = [];
function report(key: string, kind?: StorageIssue['kind']) {
    if (issues.get(key)?.kind === kind)
        return;
    if (kind)
        issues.set(key, { key, kind });
    else
        issues.delete(key);
    snapshot = [...issues.values()];
    listeners.forEach(listener => listener());
}
export const subscribeStorage = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export const getStorageIssues = () => snapshot;
export function readStoredText(key: string): string | null {
    try {
        return localStorage.getItem(key);
    }
    catch {
        report(key, 'unavailable');
        return null;
    }
}
export function readStored<T>(keys: string | string[], validate: (value: unknown) => T, fallback: T): T {
    const candidates = typeof keys === 'string' ? [keys] : keys;
    for (const key of candidates) {
        const raw = readStoredText(key);
        if (raw === null)
            continue;
        try {
            const value = validate(parseBoundedJson(raw));
            protectedKeys.delete(key);
            report(key);
            return value;
        }
        catch {
            // Preserve the original value. Initialization must not overwrite damaged data.
            protectedKeys.add(key);
            protectedKeys.add(candidates[0]);
            report(key, 'invalid');
            return fallback;
        }
    }
    return fallback;
}
export function writeStoredText(key: string, value: string): boolean {
    pending.set(key, value);
    if (protectedKeys.has(key))
        return false;
    try {
        if (value.length > MAX_BACKUP_BYTES)
            throw new Error('Storage value too large');
        localStorage.setItem(key, value);
        pending.delete(key);
        report(key);
        return true;
    }
    catch {
        report(key, 'unavailable');
        return false;
    }
}
export function writeStored(key: string, value: unknown): boolean {
    try {
        return writeStoredText(key, JSON.stringify(value));
    }
    catch {
        report(key, 'unavailable');
        return false;
    }
}
export function removeStored(key: string): boolean {
    try {
        localStorage.removeItem(key);
        pending.delete(key);
        protectedKeys.delete(key);
        report(key);
        return true;
    }
    catch {
        report(key, 'unavailable');
        return false;
    }
}
// Used only after an explicit, validated restore/reset, never during initialization.
export function allowStorageReplacement(keys: string[]) {
    for (const key of keys) {
        protectedKeys.delete(key);
        report(key);
    }
}
export function retryStorage() {
    for (const [key, value] of pending)
        writeStoredText(key, value);
}
export function restoreStored(values: Record<string, unknown>) {
    const serialized = Object.entries(values).map(([key, value]) => [key, JSON.stringify(value)] as const);
    if (serialized.some(([, value]) => value.length > MAX_BACKUP_BYTES))
        throw new Error('The backup exceeds the storage limit. Existing data is unchanged.');
    const previous = new Map<string, string | null>();
    const written: string[] = [];
    try {
        for (const [key] of serialized)
            previous.set(key, localStorage.getItem(key));
        for (const [key, value] of serialized) {
            localStorage.setItem(key, value);
            written.push(key);
        }
    }
    catch {
        for (const key of written.reverse()) {
            try {
                const value = previous.get(key);
                if (value == null)
                    localStorage.removeItem(key);
                else
                    localStorage.setItem(key, value);
            }
            catch {
                report(key, 'unavailable');
            }
        }
        serialized.forEach(([key]) => report(key, 'unavailable'));
        throw new Error('The backup could not be saved. Free browser storage and try again.');
    }
    for (const [key] of serialized) {
        pending.delete(key);
        protectedKeys.delete(key);
        report(key);
    }
}
export function downloadRecoveryData() {
    const savedValues: Record<string, string> = {};
    try {
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && /^(sunday_plan_|ncert|academicPrograms$)/.test(key))
                savedValues[key] = localStorage.getItem(key) ?? '';
        }
    }
    catch { /* Pending in-memory values remain available when storage is blocked. */ }
    const blob = new Blob([JSON.stringify({ app: 'WeeklyPlan-recovery', savedValues, pendingValues: Object.fromEntries(pending) }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'weeklyplan-recovery.json';
    anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
