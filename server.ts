import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import type { GoogleGenAI, Part } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  const apiKey = process.env.GEMINI_API_KEY;
  let ai: GoogleGenAI | undefined;

  // POST /api/ai/parse-handwritten-plan
  // Accepts a base64 image or text notes and returns structured tasks
  app.post('/api/ai/parse-handwritten-plan', express.json({ limit: '25mb' }), async (req, res) => {
    const controller = new AbortController();
    const cancelRequest = () => {
      if (!res.writableEnded) controller.abort();
    };
    res.once('close', cancelRequest);
    try {
      const { imageBase64, mimeType, additionalNotes } = req.body ?? {};

      if ((imageBase64 != null && typeof imageBase64 !== 'string') ||
          (mimeType != null && typeof mimeType !== 'string') ||
          (additionalNotes != null && typeof additionalNotes !== 'string')) {
        return res.status(400).json({ error: 'Image, MIME type, and notes must be strings.' });
      }

      if (!imageBase64 && !additionalNotes) {
        return res.status(400).json({ error: 'Please provide an image of your handwritten notes or text prompt.' });
      }

      if (!apiKey) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }

      // Load the SDK on the first AI request and reuse its client thereafter.
      const { GoogleGenAI, Type } = await import('@google/genai');
      ai ??= new GoogleGenAI({
        apiKey,
        httpOptions: { timeout: 60_000, headers: { 'User-Agent': 'aistudio-build' } },
      });
      const parts: Part[] = [];

      if (imageBase64) {
        const cleanBase64 = imageBase64.replace(/^data:image\/[a-z]+;base64,/, '');
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/jpeg',
            data: cleanBase64,
          },
        });
      }

      parts.push({
        text: `You are an expert handwriting transcription assistant for weekly task planners, study logs, and notebooks.
Examine this handwritten planner image or notes.
1. Transcribe each individual task or goal item accurately.
2. Note common abbreviations: e.g. "Re J" means "Reflective Journal", "CDP" means "Child Development & Pedagogy", "NET" means "UGC NET exam prep", "NCERT" means "NCERT textbooks".
3. Categorize each item intelligently (e.g. Study, Research, Exam Prep, Skills, Work, Personal).
4. Assign Priority: 'High', 'Medium', or 'Low' (items with circles, stars, underlines, or critical exams are High).
5. Extract sub-targets, quantities, chapters, hours, or timeframes (e.g. "6 activities", "100 vocab + 50 idioms", "3 chapters", "7 lessons 1 hour each", "Till 3 October") into the notes field.
6. Extract or suggest the week title (e.g. "Week of Sunday, Oct 4") and weekly focus goal.

${additionalNotes ? `Additional user instructions: ${additionalNotes}` : ''}`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts,
          },
        ],
        config: {
          abortSignal: controller.signal,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              weekTitle: { type: Type.STRING, description: 'Suggested week title, e.g. Week of Sunday, Oct 4' },
              focusGoal: { type: Type.STRING, description: 'Overall weekly objective or heading' },
              tasks: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    title: { type: Type.STRING, description: 'Clean, transcribed task title' },
                    category: { type: Type.STRING, description: 'Study, Research, Exam Prep, Skills, Work, Personal' },
                    priority: { type: Type.STRING, enum: ['High', 'Medium', 'Low'], description: 'Priority level' },
                    notes: { type: Type.STRING, description: 'Sub-targets, chapter counts, hours, or deadlines' },
                  },
                  required: ['title', 'category', 'priority'],
                },
              },
            },
            required: ['tasks'],
          },
        },
      });

      const parsed = JSON.parse(response.text || '{}');
      return res.json({
        success: true,
        data: parsed,
      });
    } catch (err: any) {
      if (controller.signal.aborted) return;
      console.error('Error parsing handwritten plan with Gemini:', err);
      return res.status(500).json({
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
