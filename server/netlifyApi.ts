import { createHandwritingParser } from './handwriting';
import { readJsonBody } from './requestBody';
import { authorizeTranscription, createRequestGate, safeApiError, securityHeaders, validateApiRequest } from './security';

// Leave room for the platform's invocation envelope within its 6 MB payload limit.
export const NETLIFY_MAX_BODY_BYTES = 4 * 1024 * 1024;
interface Environment { GEMINI_API_KEY?: string; TRANSCRIPTION_ACCESS_TOKEN?: string }

export function createNetlifyApiHandler() {
  const enterRequest = createRequestGate();
  let configuredKey: string | undefined;
  let parseHandwriting = createHandwritingParser(undefined, { timeoutMs: 45_000 });

  return async (request: Request, env: Environment, clientIp: string): Promise<Response> => {
    const url = new URL(request.url);
    const headers = new Headers({ ...securityHeaders(url.protocol === 'https:'), 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' });
    const json = (body: unknown, status = 200) => {
      headers.set('Content-Type', 'application/json; charset=utf-8');
      return new Response(request.method === 'HEAD' ? null : JSON.stringify(body), { status, headers });
    };
    if (url.pathname === '/api/health') {
      if (!['GET', 'HEAD'].includes(request.method)) {
        headers.set('Allow', 'GET, HEAD');
        return json({ error: 'Use GET for the health check.' }, 405);
      }
      return json({ status: 'ok', time: new Date().toISOString() });
    }
    if (url.pathname !== '/api/ai/parse-handwritten-plan') return json({ error: 'API endpoint not found.' }, 404);
    if (request.method !== 'POST') {
      headers.set('Allow', 'POST');
      return json({ error: 'Use POST for planner transcription.' }, 405);
    }
    let release: (() => void) | undefined;
    try {
      validateApiRequest(request.headers.get('origin'), request.headers.get('sec-fetch-site'), request.headers.get('content-type'), url.origin);
      release = enterRequest(clientIp);
      await authorizeTranscription(env.GEMINI_API_KEY, env.TRANSCRIPTION_ACCESS_TOKEN, request.headers.get('authorization'));
      const payload = await readJsonBody(request, NETLIFY_MAX_BODY_BYTES, 10_000);
      if (env.GEMINI_API_KEY !== configuredKey) {
        configuredKey = env.GEMINI_API_KEY;
        parseHandwriting = createHandwritingParser(configuredKey, { timeoutMs: 45_000 });
      }
      return json(await parseHandwriting(payload, request.signal));
    } catch (error) {
      const result = safeApiError(error);
      if (result.retryAfter) headers.set('Retry-After', String(result.retryAfter));
      return json({ error: result.error }, result.status);
    } finally { release?.(); }
  };
}
