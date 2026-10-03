import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createNetlifyApiHandler, NETLIFY_MAX_BODY_BYTES } from '../server/netlifyApi';
import { readJsonBody } from '../server/requestBody';

const origin = 'https://planner.test';
const endpoint = origin + '/api/ai/parse-handwritten-plan';
const post = (body: unknown) => ({ method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('Netlify health, HEAD, missing paths and method errors stay JSON and uncached', async () => {
  const api = createNetlifyApiHandler();
  const response = await api(new Request(origin + '/api/health'), {}, 'test');
  assert.equal((await response.json()).status, 'ok');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.equal(response.headers.get('x-content-type-options'), 'nosniff');
  assert.match(response.headers.get('content-security-policy')!, /script-src 'self'/);
  assert.equal(await (await api(new Request(origin + '/api/health', { method: 'HEAD' }), {}, 'test')).text(), '');
  assert.equal((await api(new Request(origin + '/api/unknown'), {}, 'test')).status, 404);
  assert.equal((await api(new Request(endpoint), {}, 'test')).headers.get('allow'), 'POST');
});

test('Netlify rejects cross-origin requests, bad media types and malformed JSON', async () => {
  const api = createNetlifyApiHandler();
  for (const [headers, status] of [
    [{ 'Content-Type': 'application/json', Origin: 'https://evil.test' }, 403],
    [{ 'Content-Type': 'application/json', 'Sec-Fetch-Site': 'same-site' }, 403],
    [{ 'Content-Type': 'text/plain' }, 415],
  ] as const) assert.equal((await api(new Request(endpoint, { ...post({}), headers }), {}, 'test')).status, status);
  assert.equal((await api(new Request(endpoint, { ...post({}), body: '{' }), {}, 'test')).status, 400);
  assert.equal((await api(new Request(endpoint, post({ imageBase64: 42 })), {}, 'test')).status, 400);
});

test('Netlify bounds declared and streamed uploads before parsing', async () => {
  const api = createNetlifyApiHandler();
  assert.equal((await api(new Request(endpoint, { ...post({}), headers: { 'Content-Type': 'application/json', 'Content-Length': String(NETLIFY_MAX_BODY_BYTES + 1) } }), {}, 'test')).status, 413);
  let cancelled = false;
  const body = new ReadableStream({ start(controller) { controller.enqueue(new Uint8Array(NETLIFY_MAX_BODY_BYTES + 1)); }, cancel() { cancelled = true; } });
  const response = await api(new Request(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body, duplex: 'half' } as RequestInit), {}, 'stream');
  assert.equal(response.status, 413);
  assert.equal(cancelled, true);
});

test('upload deadlines cancel stalled streams and return a readable error', async () => {
  let cancelled = false;
  const body = new ReadableStream({ cancel() { cancelled = true; } });
  await assert.rejects(readJsonBody(new Request(endpoint, { method: 'POST', body, duplex: 'half' } as RequestInit), 64, 20), { status: 408 });
  assert.equal(cancelled, true);
});

test('Netlify optional transcription fails safely without exposing configured secrets', async () => {
  const api = createNetlifyApiHandler();
  const request = () => new Request(endpoint, post({ additionalNotes: 'Read chapter one' }));
  assert.equal((await api(request(), {}, 'test')).status, 503);
  const env = { GEMINI_API_KEY: 'test-provider-secret', TRANSCRIPTION_ACCESS_TOKEN: 'test-access-token-over-32-characters' };
  const response = await api(request(), env, 'test');
  assert.equal(response.status, 401);
  assert(!JSON.stringify(await response.json()).includes(env.GEMINI_API_KEY));
});

test('Netlify limits repeated transcription requests and provides a retry deadline', async () => {
  const api = createNetlifyApiHandler();
  for (let i = 0; i < 20; i++) assert.equal((await api(new Request(endpoint, post({ additionalNotes: 'Read' })), {}, 'burst')).status, 503);
  const response = await api(new Request(endpoint, post({ additionalNotes: 'Read' })), {}, 'burst');
  assert.equal(response.status, 429);
  assert(Number(response.headers.get('retry-after')) > 0);
});
