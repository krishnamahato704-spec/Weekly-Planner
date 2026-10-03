import assert from 'node:assert/strict';
import { spawn, type ChildProcess } from 'node:child_process';
import { createServer } from 'node:net';
import { readdir } from 'node:fs/promises';
import { after, before, test } from 'node:test';

let server: ChildProcess;
let baseUrl: string;

before(async () => {
  const probe = createServer();
  await new Promise<void>((resolve) => probe.listen(0, '127.0.0.1', resolve));
  const address = probe.address();
  assert(address && typeof address === 'object');
  const port = address.port;
  await new Promise<void>((resolve, reject) => probe.close(error => error ? reject(error) : resolve()));
  baseUrl = `http://127.0.0.1:${port}`;
  server = spawn(process.execPath, ['--import', 'tsx', 'server.ts'], {
    cwd: new URL('..', import.meta.url),
    env: { ...process.env, PORT: String(port), NODE_ENV: 'production', GEMINI_API_KEY: '' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise<void>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Server did not start: ${output}`)), 10_000);
    let output = '';
    server.stderr?.on('data', chunk => { output += chunk; });
    server.once('error', error => { clearTimeout(timer); reject(error); });
    server.once('exit', code => { clearTimeout(timer); reject(new Error(`Server exited ${code}: ${output}`)); });
    server.stdout?.on('data', chunk => {
      output += chunk;
      if (output.includes('server running')) {
        clearTimeout(timer);
        resolve();
      }
    });
  });
});

after(async () => {
  if (server && server.exitCode === null) {
    const exited = new Promise<void>(resolve => server.once('exit', () => resolve()));
    server.kill();
    await exited;
  }
});

async function parse(body: unknown) {
  return fetch(`${baseUrl}/api/ai/parse-handwritten-plan`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
}

test('production server starts and responds to health checks without a Gemini key', async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  const body = await response.json();
  assert.equal(body.status, 'ok');
  assert(!Number.isNaN(Date.parse(body.time)));
});

test('AI route rejects empty and invalid input before invoking the provider', async () => {
  assert.equal((await parse({})).status, 400);
  assert.equal((await parse({ imageBase64: 42 })).status, 400);
  assert.equal((await parse({ additionalNotes: { text: 'notes' } })).status, 400);
  assert.equal((await parse({ imageBase64: 'image', mimeType: [] })).status, 400);
});

test('AI route reports a missing key only when valid input requires the provider', async () => {
  const response = await parse({ additionalNotes: 'Read chapter one' });
  assert.equal(response.status, 500);
  assert.match((await response.json()).error, /GEMINI_API_KEY/);
});

test('production assets can be cached while the application HTML revalidates', async () => {
  const assets = await readdir(new URL('../dist/assets', import.meta.url));
  const filename = assets.find(name => name.endsWith('.js'));
  assert(filename, 'Run the production build before testing asset delivery');
  const asset = await fetch(`${baseUrl}/assets/${filename}`);
  assert.equal(asset.status, 200);
  assert.match(asset.headers.get('cache-control') ?? '', /max-age=31536000.*immutable/);
  const html = await fetch(baseUrl);
  assert.equal(html.status, 200);
  assert(!html.headers.get('cache-control')?.includes('immutable'));
});
