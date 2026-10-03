import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createHandwritingParser } from './server/handwriting';
import { authorizeTranscription, createRequestGate, safeApiError, securityHeaders, validateApiRequest } from './server/security';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  const PORT = Number(process.env.PORT) || 3000;

  const apiKey = process.env.GEMINI_API_KEY;
  const parseHandwriting = createHandwritingParser(apiKey);
  const enterRequest = createRequestGate();
  app.use((req, res, next) => {
    res.set(securityHeaders(req.secure || process.env.APP_URL?.startsWith('https://') === true, process.env.NODE_ENV !== 'production'));
    if (req.path.startsWith('/api/')) res.set('Cache-Control', 'no-store');
    next();
  });
  app.use('/api/ai/parse-handwritten-plan', async (req, res, next) => {
    if (req.method !== 'POST') return res.status(405).set('Allow', 'POST').json({ error: 'Use POST for planner transcription.' });
    try {
      const origin = process.env.APP_URL && /^https?:\/\//.test(process.env.APP_URL) ? new URL(process.env.APP_URL).origin : `${req.protocol}://${req.get('host')}`;
      validateApiRequest(req.get('origin'), req.get('sec-fetch-site'), req.get('content-type'), origin);
      const release = enterRequest(req.ip || 'local');
      res.once('close', release);
      res.once('finish', release);
      await authorizeTranscription(apiKey, process.env.TRANSCRIPTION_ACCESS_TOKEN, req.get('authorization'));
      next();
    } catch (error) {
      const result = safeApiError(error);
      if (result.retryAfter) res.set('Retry-After', String(result.retryAfter));
      return res.status(result.status).json({ error: result.error });
    }
  });

  // POST /api/ai/parse-handwritten-plan
  // Accepts a base64 image or text notes and returns structured tasks
  app.post('/api/ai/parse-handwritten-plan', express.json({ limit: '25mb' }), async (req, res) => {
    const controller = new AbortController();
    const cancelRequest = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.once('close', cancelRequest);
    try {
      return res.json(await parseHandwriting(req.body ?? {}, controller.signal));
    } catch (err: unknown) {
      if (controller.signal.aborted) return;
      const result = safeApiError(err);
      return res.status(result.status).json({ error: result.error });
    } finally {
      res.off('close', cancelRequest);
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });
  app.all('/api/health', (req, res) => res.status(405).set('Allow', 'GET, HEAD').json({ error: 'Use GET for the health check.' }));
  app.use('/api', (req, res) => res.status(404).json({ error: 'API endpoint not found.' }));
  app.use((error: { type?: string; status?: number }, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (!req.path.startsWith('/api/')) return next(error);
    const status = error.type === 'entity.too.large' ? 413 : error.type === 'entity.parse.failed' ? 400 : error.status === 415 ? 415 : 500;
    return res.status(status).json({ error: status === 413 ? 'Planner data exceeds the 25 MiB request limit.' : status === 400 ? 'Planner data must be valid JSON.' : 'The planner upload could not be read.' });
  });

  // Mount Vite middlewares in development or static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Vite puts content hashes in asset names; cache those files across visits.
    app.use('/assets', express.static(path.resolve(__dirname, 'dist/assets'), {
      immutable: true,
      maxAge: '1y',
    }));
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`SundayPlan server running on http://0.0.0.0:${PORT}`);
  });
  server.requestTimeout = 30_000;
  server.headersTimeout = 15_000;
}

startServer();
