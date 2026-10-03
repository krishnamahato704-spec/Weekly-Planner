import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Support JSON and base64 image payloads up to 25MB
  app.use(express.json({ limit: '25mb' }));

  // Initialize server-side Gemini client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // POST /api/ai/parse-handwritten-plan
  // Accepts a base64 image or text notes and returns structured tasks
  app.post('/api/ai/parse-handwritten-plan', async (req, res) => {
    try {
      const { imageBase64, mimeType, additionalNotes } = req.body;

      if (!imageBase64 && !additionalNotes) {
        return res.status(400).json({ error: 'Please provide an image of your handwritten notes or text prompt.' });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: 'GEMINI_API_KEY is not configured on the server.' });
      }

      const parts: any[] = [];

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
      console.error('Error parsing handwritten plan with Gemini:', err);
      return res.status(500).json({
        error: err.message || 'Failed to analyze handwritten notes. Please try a clearer photo or enter manually.',
      });
    }
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // Mount Vite middlewares in development or static serve in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
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
