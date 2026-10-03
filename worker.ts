import { createHandwritingParser } from './server/handwriting';
import { HandwritingError, MAX_BODY_BYTES, authorizeTranscription, createRequestGate, safeApiError, securityHeaders, validateApiRequest } from './server/security';

// Filled by build-site.mjs. The Worker is self-contained and needs no asset binding.
declare const __PLANNER_ASSETS__: Record<string, { body: string; contentType: string }>;
const assets = __PLANNER_ASSETS__;
const enterRequest = createRequestGate();
let configuredKey: string | undefined;
let parseHandwriting = createHandwritingParser();
interface Environment { GEMINI_API_KEY?: string; TRANSCRIPTION_ACCESS_TOKEN?: string }

async function readJson(request: Request): Promise<unknown> {
  const rawLength = request.headers.get('content-length');
  if (rawLength && (!/^\d+$/.test(rawLength) || Number(rawLength) > MAX_BODY_BYTES)) throw new HandwritingError(413, 'Planner data exceeds the 25 MiB request limit.');
  const reader = request.body?.getReader();
  if (!reader) throw new HandwritingError(400, 'Planner data must be valid JSON.');
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => { timer = setTimeout(() => reject(new HandwritingError(408, 'The upload took too long. Try a smaller image.')), 30_000); });
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = '', bytes = 0;
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > MAX_BODY_BYTES) throw new HandwritingError(413, 'Planner data exceeds the 25 MiB request limit.');
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    try { return JSON.parse(text); }
    catch { throw new HandwritingError(400, 'Planner data must be valid JSON.'); }
  } catch (error) {
    await reader.cancel().catch(() => {});
    if (error instanceof HandwritingError) throw error;
    throw new HandwritingError(400, 'The planner upload could not be read.');
  } finally { clearTimeout(timer!); reader.releaseLock(); }
}

async function handleRequest(request: Request, env: Environment): Promise<Response> {
  const url = new URL(request.url);
  if (url.pathname === '/api/health') {
    if (!['GET', 'HEAD'].includes(request.method)) return Response.json({ error: 'Use GET for the health check.' }, { status: 405, headers: { Allow: 'GET, HEAD' } });
    return Response.json({ status: 'ok', time: new Date().toISOString() });
  }
  if (url.pathname === '/api/ai/parse-handwritten-plan') {
    if (request.method !== 'POST') return Response.json({ error: 'Use POST for planner transcription.' }, { status: 405, headers: { Allow: 'POST' } });
    let release: (() => void) | undefined;
    try {
      validateApiRequest(request.headers.get('origin'), request.headers.get('sec-fetch-site'), request.headers.get('content-type'), url.origin);
      release = enterRequest(request.headers.get('CF-Connecting-IP') || 'local');
      await authorizeTranscription(env.GEMINI_API_KEY, env.TRANSCRIPTION_ACCESS_TOKEN, request.headers.get('authorization'));
      const payload = await readJson(request);
      if (env.GEMINI_API_KEY !== configuredKey) {
        configuredKey = env.GEMINI_API_KEY;
        parseHandwriting = createHandwritingParser(configuredKey);
      }
      return Response.json(await parseHandwriting(payload, request.signal));
    } catch (error) {
      const result = safeApiError(error);
      return Response.json({ error: result.error }, { status: result.status, headers: result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {} });
    } finally { release?.(); }
  }
  if (url.pathname.startsWith('/api/')) return Response.json({ error: 'API endpoint not found.' }, { status: 404 });
  if (!['GET', 'HEAD'].includes(request.method)) return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
  const name = url.pathname === '/' ? '/index.html' : url.pathname;
  if (!Object.hasOwn(assets, name)) return new Response('Page not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  const asset = assets[name];
  return new Response(asset.body, { headers: {
    'Content-Type': asset.contentType,
    'Cache-Control': name.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
  } });
}

export default {
  async fetch(request: Request, env: Environment) {
    let response: Response;
    try { response = await handleRequest(request, env); }
    catch { response = Response.json({ error: 'The planner request could not be completed. Try again later.' }, { status: 500 }); }
    const url = new URL(request.url);
    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(securityHeaders(url.protocol === 'https:'))) headers.set(key, value);
    if (url.pathname.startsWith('/api/')) headers.set('Cache-Control', 'no-store');
    return new Response(request.method === 'HEAD' ? null : response.body, { status: response.status, headers });
  },
};
