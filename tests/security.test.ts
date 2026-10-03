import assert from 'node:assert/strict';
import { test } from 'node:test';
import { getStarterWeek, STARTER_WEEK_DATE } from '../src/utils/sampleData';
import { INITIAL_PROGRAM_TABS } from '../src/utils/academicProgramsData';
import { parseBoundedJson, safeExternalUrl, validateBackup, validateWeeks, validatePrograms, validateGoals, validateActiveSession, validateNcertNotes } from '../src/utils/dataValidation';
import { mergeBackups, parseBackup } from '../src/utils/backup';
import { validateTranscriptionInput } from '../src/utils/transcription';
import { authorizeTranscription, createRequestGate, HandwritingError, safeApiError, validateApiRequest } from '../server/security';
import { createHandwritingParser } from '../server/handwriting';
import { readStored, writeStored, restoreStored, retryStorage, getStorageIssues } from '../src/utils/storage';

const current = () => ({ weeks: [getStarterWeek()], activeWeekId: STARTER_WEEK_DATE, programs: INITIAL_PROGRAM_TABS, ncertProgress: {} });
const png = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aH4kAAAAASUVORK5CYII=';

test('real planner defaults and legacy backups validate without dropping programs', () => {
  const backup = validateBackup(current());
  assert.equal(backup.weeks[0].sundayDate, '2026-10-04');
  assert.equal(backup.weeks[0].tasks.length, current().weeks[0].tasks.length);
  assert.equal(validatePrograms(INITIAL_PROGRAM_TABS).length, INITIAL_PROGRAM_TABS.length);
  assert.deepEqual(parseBackup(JSON.stringify({ app: 'WeeklyPlan', backupVersion: 5, data: current() }), current()), backup);
  assert.equal(parseBackup(JSON.stringify({ weeks: current().weeks }), current()).weeks.length, 1);
});

test('backups reject reserved keys, invalid shapes, duplicates, dates and resource URLs', () => {
  for (const json of ['{"__proto__":{"polluted":true}}', '{"a":{"constructor":{}}}', '[1,2', 'null']) {
    assert.throws(() => parseBackup(json, current()));
  }
  assert.equal(({} as { polluted?: boolean }).polluted, undefined);
  const clone = structuredClone(current());
  clone.weeks[0].tasks.push({ ...clone.weeks[0].tasks[0] });
  assert.throws(() => validateBackup(clone), /duplicate/);
  assert.throws(() => validateWeeks([{ ...current().weeks[0], sundayDate: '2026-02-31' }]));
  assert.throws(() => validateWeeks([{ ...current().weeks[0], createdAt: '2026-02-31T00:00:00Z' }]));
  assert.throws(() => validateBackup({ ...current(), weeks: [{ id: 'broken' }] }));
  assert.throws(() => validateGoals({ weeklyStudyMinutesGoal: -1 }));
  assert.throws(() => validateActiveSession({ startedAt: 12, taskTitle: 'Study', accumulatedSeconds: 'forever' }));
  assert.throws(() => validateNcertNotes({ 'c6-b1-ch1': { text: '', primaryLink: 'javascript:alert(1)', resources: [] } }));
});

test('data limits reject oversize input and duplicate controls while preserving plain text', () => {
  assert.throws(() => parseBoundedJson(' '.repeat(65), 64), /size limit/);
  const payload = '<img src=x onerror=alert(1)> "; DROP TABLE tasks; --';
  const clone = structuredClone(current());
  clone.weeks[0].tasks[0].title = payload;
  assert.equal(validateBackup(clone).weeks[0].tasks[0].title, payload);
  clone.weeks[0].tasks[0].id = "x');alert(1);//";
  assert.throws(() => validateBackup(clone), /identifier/);
});

test('merge retains existing tasks, chapters, sessions and completed NCERT stages', () => {
  const original = validateBackup(current()), incoming = validateBackup(current());
  const originalTask = original.weeks[0].tasks[0];
  incoming.weeks[0].tasks = [{ ...originalTask, id: 'new-task', title: 'Imported task' }];
  original.ncertProgress = { 'c6-b1-ch1': { reading: true, notes: false, revision: false } };
  incoming.ncertProgress = { 'c6-b1-ch1': { reading: false, notes: true, revision: false } };
  incoming.programs[0].subjects = [];
  const merged = mergeBackups(original, incoming);
  assert(merged.weeks[0].tasks.some(t => t.id === originalTask.id));
  assert(merged.weeks[0].tasks.some(t => t.id === 'new-task'));
  assert.equal(merged.programs[0].subjects?.length, original.programs[0].subjects?.length);
  assert.equal(merged.ncertProgress['c6-b1-ch1'].reading, true);
  assert.equal(merged.ncertProgress['c6-b1-ch1'].notes, true);
});

test('resource links accept HTTP/HTTPS and reject executable schemes and credentials', () => {
  assert.equal(safeExternalUrl('example.com/chapter'), 'https://example.com/chapter');
  for (const value of ['javascript:alert(1)', 'data:text/html,<script>', 'file:///secret', 'https://user:password@example.com', 'https://exa\nmple.com']) assert.throws(() => safeExternalUrl(value));
});

test('image input enforces base64 size, allowed MIME types, content signatures and bounded notes', () => {
  assert.equal(validateTranscriptionInput({ imageBase64: 'data:image/png;base64,' + png, mimeType: 'image/png' }).imageBase64, png);
  for (const input of [{ imageBase64: png, mimeType: 'image/svg+xml' }, { imageBase64: png, mimeType: 'image/jpeg' }, { imageBase64: '<script>' }, { additionalNotes: ' ' }, { additionalNotes: 'x'.repeat(10001) }, { additionalNotes: 'Study', apiKey: 'not-allowed' }]) assert.throws(() => validateTranscriptionInput(input));
});

test('CSRF guards reject cross-origin, sibling-origin and simple-content-type requests', () => {
  validateApiRequest('https://planner.test', 'same-origin', 'application/json; charset=utf-8', 'https://planner.test');
  for (const [origin, site, type] of [['https://evil.test', 'cross-site', 'application/json'], ['https://sibling.planner.test', 'same-site', 'application/json'], ['null', 'none', 'application/json'], ['', 'none', 'text/plain'], ['', 'none', 'application/json-fake']]) assert.throws(() => validateApiRequest(origin, site, type, 'https://planner.test'));
});

test('provider configuration fails closed without a separate strong access code', async () => {
  await authorizeTranscription(undefined, undefined, undefined);
  await assert.rejects(authorizeTranscription('provider-key', undefined, undefined), { status: 503 });
  await assert.rejects(authorizeTranscription('provider-key', 'short', 'Bearer short'), { status: 503 });
  const code = 'test-only-access-code-that-is-32-characters';
  await assert.rejects(authorizeTranscription('provider-key', code, 'Bearer wrong'), { status: 401 });
  await authorizeTranscription('provider-key', code, 'Bearer ' + code);
  assert(!JSON.stringify(safeApiError(new Error('SECRET_PROVIDER_KEY'))).includes('SECRET_PROVIDER_KEY'));
});

test('request gate bounds bursts, concurrent work, client memory and resets expired windows', () => {
  let time = 0;
  const enter = createRequestGate({ limit: 2, windowMs: 1000, maxConcurrent: 1, maxClients: 2, now: () => time });
  const release = enter('a');
  assert.throws(() => enter('b'), { status: 429 });
  release(); release();
  enter('a')();
  assert.throws(() => enter('a'), { status: 429 });
  assert.throws(() => enter('c'), { status: 429 });
  time = 1001;
  enter('c')();
});

test('provider output is validated and provider failures never return raw diagnostics', async () => {
  const signal = new AbortController().signal;
  const valid = createHandwritingParser('test-only-key', { generateContent: async () => JSON.stringify({ tasks: [{ title: 'Read', category: 'Study', priority: 'High' }] }) });
  assert.equal((await valid({ additionalNotes: 'Read' }, signal)).data.tasks[0].title, 'Read');
  for (const output of ['{"tasks":[null]}', '{"tasks":{}}', '{"tasks":[{"title":42}]}', '{"tasks":[{"title":"Read","priority":"Invalid"}]}', '{"tasks":[],"__proto__":{}}']) {
    const parse = createHandwritingParser('test-only-key', { generateContent: async () => output });
    await assert.rejects(parse({ additionalNotes: 'Read' }, signal), { status: 502 });
  }
  const failure = createHandwritingParser('test-only-key', { generateContent: async () => { throw new Error('SECRET_PROVIDER_DIAGNOSTIC'); } });
  await assert.rejects(failure({ additionalNotes: 'Read' }, signal), error => error instanceof HandwritingError && error.status === 502 && !error.message.includes('SECRET'));
});

test('provider deadlines and cancellation abort work and clean up', async () => {
  let aborted = false;
  const parse = createHandwritingParser('test-only-key', { timeoutMs: 20, generateContent: async (_, signal) => { signal.addEventListener('abort', () => { aborted = true; }); return new Promise(() => {}); } });
  await assert.rejects(parse({ additionalNotes: 'Read' }, new AbortController().signal), { status: 504 });
  assert.equal(aborted, true);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(parse({ additionalNotes: 'Read' }, controller.signal), { status: 499 });
});

test('damaged storage is preserved; quota errors fall back in memory and retry safely', () => {
  const values = new Map<string, string>();
  let unavailable = false;
  const fake = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { if (unavailable) throw new Error('Quota'); values.set(key, value); }, removeItem: (key: string) => { values.delete(key); } };
  Object.defineProperty(globalThis, 'localStorage', { value: fake, configurable: true });
  values.set('damaged', '[{"id":"broken"}]');
  assert.deepEqual(readStored('damaged', validateWeeks, []), []);
  assert.equal(writeStored('damaged', current().weeks), false);
  assert.equal(values.get('damaged'), '[{"id":"broken"}]');
  unavailable = true;
  assert.equal(writeStored('quota', { title: 'Unsaved work' }), false);
  assert(getStorageIssues().some(issue => issue.key === 'quota'));
  unavailable = false; retryStorage();
  assert.equal(JSON.parse(values.get('quota')!).title, 'Unsaved work');
  restoreStored({ damaged: current().weeks });
  assert.equal(validateWeeks(JSON.parse(values.get('damaged')!)).length, 1);
});

test('backup writes roll back completed keys when storage rejects a later key', () => {
  const values = new Map([['one', '"original"'], ['two', '"original-two"']]);
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, value: string) => { if (key === 'two' && value === '"new-two"') throw new Error('Quota'); values.set(key, value); }, removeItem: (key: string) => values.delete(key) }, configurable: true });
  assert.throws(() => restoreStored({ one: 'new-one', two: 'new-two' }), /could not be saved/);
  assert.equal(values.get('one'), '"original"');
  assert.equal(values.get('two'), '"original-two"');
});
