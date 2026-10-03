import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createHandwritingParser, HandwritingError } from './server/handwriting';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const apiKey = process.env.GEMINI_API_KEY;
  const parseHandwriting = createHandwritingParser(apiKey);

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
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.error('Error parsing handwritten plan with Gemini:', err);
      return res.status(err instanceof HandwritingError ? err.status : 500).json({
        error: err.message || 'Failed to analyze handwritten notes. Please try a clearer photo or enter manually.',
      });
    } finally {
      res.off('close', cancelRequest);
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
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

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SundayPlan server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
