import type { GoogleGenAI, Part } from '@google/genai';

export class HandwritingError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function createHandwritingParser(apiKey?: string) {
  let ai: GoogleGenAI | undefined;
  return async (payload: Record<string, unknown>, signal: AbortSignal) => {
    const { imageBase64, mimeType, additionalNotes } = payload ?? {};

    if ((imageBase64 != null && typeof imageBase64 !== 'string') ||
        (mimeType != null && typeof mimeType !== 'string') ||
        (additionalNotes != null && typeof additionalNotes !== 'string')) {
      throw new HandwritingError(400, 'Image, MIME type, and notes must be strings.');
    }

    if (!imageBase64 && !additionalNotes) {
      throw new HandwritingError(400, 'Please provide an image of your handwritten notes or text prompt.');
    }

    if (!apiKey) {
      throw new HandwritingError(500, 'GEMINI_API_KEY is not configured on the server.');
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
        abortSignal: signal,
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
    return {
      success: true,
      data: parsed,
    };
  };
}
