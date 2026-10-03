import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { test } from 'node:test';
const { default: worker } = await import('../dist/server/index.js');
const origin = 'https://planner.test';
const fetchWorker = (pathname, init) => worker.fetch(new Request(origin + pathname, init), {});

test('hosted build serves HTML, every built asset, and crawler metadata', async () => {
  const response = await fetchWorker('/');
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /rel="canonical"/);
  assert.match(html, /property="og:url"/);
  assert.match(html, /WeeklyPlan/);
  assert.equal(response.headers.get('cache-control'), 'no-cache');
  for (const asset of await fs.readdir(new URL('../dist/client/assets/', import.meta.url))) {
    const result = await fetchWorker('/assets/' + asset);
    assert.equal(result.status, 200, asset);
    assert.match(result.headers.get('cache-control'), /immutable/);
    assert((await result.text()).length > 0);
  }
  for (const asset of ['/robots.txt', '/sitemap.xml', '/favicon.svg']) assert.equal((await fetchWorker(asset)).status, 200, asset);
  assert.equal((await fetchWorker('/missing-page')).status, 404);
  assert.equal(await (await fetchWorker('/', { method: 'HEAD' })).text(), '');
});

test('hosted API handles health, method, malformed input, size limits, and missing credentials', async () => {
  assert.equal((await (await fetchWorker('/api/health')).json()).status, 'ok');
  const endpoint = '/api/ai/parse-handwritten-plan';
  assert.equal((await fetchWorker(endpoint)).status, 405);
  const json = body => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  assert.equal((await fetchWorker(endpoint, json({}))).status, 400);
  assert.equal((await fetchWorker(endpoint, json({ imageBase64: 42 }))).status, 400);
  assert.equal((await fetchWorker(endpoint, { ...json({}), body: '{' })).status, 400);
  assert.equal((await fetchWorker(endpoint, { ...json({}), headers: { 'Content-Type': 'application/json', 'Content-Length': String(26 * 1024 * 1024) } })).status, 413);
  const result = await fetchWorker(endpoint, json({ additionalNotes: 'Study chapter one' }));
  assert.equal(result.status, 503);
  assert.match((await result.json()).error, /unavailable/);
});

test('hosted requests enforce security headers, origin checks, auth and safe errors', async () => {
  const page = await fetchWorker('/');
  assert.match(page.headers.get('content-security-policy'), /script-src 'self'/);
  assert.equal(page.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(page.headers.get('strict-transport-security'), 'max-age=31536000');
  const endpoint = '/api/ai/parse-handwritten-plan';
  const json = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' };
  assert.equal((await fetchWorker(endpoint, { ...json, headers: { ...json.headers, Origin: 'https://evil.test' } })).status, 403);
  assert.equal((await fetchWorker(endpoint, { ...json, headers: { ...json.headers, 'Sec-Fetch-Site': 'same-site' } })).status, 403);
  assert.equal((await fetchWorker(endpoint, { ...json, headers: { 'Content-Type': 'text/plain' } })).status, 415);
  assert.equal((await fetchWorker('/api/missing')).status, 404);
  assert.equal((await fetchWorker('/api/health', { method: 'POST' })).status, 405);
  const protectedRequest = new Request(origin + endpoint, json);
  const disabled = await worker.fetch(protectedRequest, { GEMINI_API_KEY: 'test-only-key' });
  assert.equal(disabled.status, 503);
  assert(!JSON.stringify(await disabled.json()).includes('test-only-key'));
  const unauthorized = await worker.fetch(new Request(origin + endpoint, json), { GEMINI_API_KEY: 'test-only-key', TRANSCRIPTION_ACCESS_TOKEN: 'a-test-access-token-over-32-characters' });
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorized.headers.get('cache-control'), 'no-store');
});

test('streamed uploads without a declared length are bounded and cancelled', async () => {
  let cancelled = false;
  const stream = new ReadableStream({ start(controller) { for (let i = 0; i < 26; i++) controller.enqueue(new Uint8Array(1024 * 1024).fill(32)); }, cancel() { cancelled = true; } });
  const request = new Request(origin + '/api/ai/parse-handwritten-plan', { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': 'stream-test' }, body: stream, duplex: 'half' });
  const result = await worker.fetch(request, {});
  assert.equal(result.status, 413);
  assert.equal(cancelled, true);
});

test('hosted transcription bursts receive a retry deadline', async () => {
  const endpoint = '/api/ai/parse-handwritten-plan';
  const init = { method: 'POST', headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': 'burst-test' }, body: JSON.stringify({ additionalNotes: 'Read chapter one' }) };
  for (let i = 0; i < 20; i++) assert.equal((await fetchWorker(endpoint, init)).status, 503);
  const limited = await fetchWorker(endpoint, init);
  assert.equal(limited.status, 429);
  assert(Number(limited.headers.get('retry-after')) > 0);
});
