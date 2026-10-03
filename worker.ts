import { createHandwritingParser, HandwritingError } from './server/handwriting';

// Filled by build-site.mjs. The Worker is self-contained and needs no asset binding.
declare const __PLANNER_ASSETS__: Record<string, { body: string; contentType: string }>;
const assets = __PLANNER_ASSETS__;
const MAX_BODY_BYTES = 25 * 1024 * 1024;
let configuredKey: string | undefined;
let parseHandwriting = createHandwritingParser();

interface Environment { GEMINI_API_KEY?: string }

export default {
  async fetch(request: Request, env: Environment) {
    const url = new URL(request.url);
    if (url.pathname === '/api/health') return Response.json({ status: 'ok', time: new Date().toISOString() });
    if (url.pathname === '/api/ai/parse-handwritten-plan') {
      if (request.method !== 'POST') return Response.json({ error: 'Use POST for planner transcription.' }, { status: 405, headers: { Allow: 'POST' } });
      try {
        if (!request.headers.get('content-type')?.includes('application/json')) throw new HandwritingError(415, 'Send the planner data as JSON.');
        const length = Number(request.headers.get('content-length'));
        if (length > MAX_BODY_BYTES) throw new HandwritingError(413, 'Planner data exceeds the 25 MiB request limit.');
        const reader = request.body?.getReader();
        const decoder = new TextDecoder();
        let text = '', bytes = 0;
        if (reader) try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            bytes += value.byteLength;
            if (bytes > MAX_BODY_BYTES) { await reader.cancel(); throw new HandwritingError(413, 'Planner data exceeds the 25 MiB request limit.'); }
            text += decoder.decode(value, { stream: true });
          }
          text += decoder.decode();
        } finally { reader.releaseLock(); }
        let payload: Record<string, unknown>;
        try { payload = JSON.parse(text); } catch { throw new HandwritingError(400, 'Planner data must be valid JSON.'); }
        if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new HandwritingError(400, 'Planner data must be a JSON object.');
        if (env.GEMINI_API_KEY !== configuredKey) {
          configuredKey = env.GEMINI_API_KEY;
          parseHandwriting = createHandwritingParser(configuredKey);
        }
        return Response.json(await parseHandwriting(payload, request.signal));
      } catch (error) {
        return Response.json({ error: error instanceof Error ? error.message : 'Unable to transcribe this planner.' }, { status: error instanceof HandwritingError ? error.status : 500 });
      }
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    const asset = assets[url.pathname === '/' ? '/index.html' : url.pathname];
    if (!asset) return new Response('Page not found', { status: 404, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
    return new Response(request.method === 'HEAD' ? null : asset.body, { headers: {
      'Content-Type': asset.contentType,
      'Cache-Control': url.pathname.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    } });
  },
};
