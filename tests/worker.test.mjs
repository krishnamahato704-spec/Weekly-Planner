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
  assert.equal(result.status, 500);
  assert.match((await result.json()).error, /GEMINI_API_KEY/);
});
