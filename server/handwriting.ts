import type { GoogleGenAI, Part } from '@google/genai';
import { DataValidationError, parseBoundedJson } from '../src/utils/dataValidation';
import { validateTranscriptionInput, validateTranscription } from '../src/utils/transcription';
import { HandwritingError } from './security';
export { HandwritingError } from './security';

type Input = ReturnType<typeof validateTranscriptionInput>;
interface ParserOptions { timeoutMs?: number; generateContent?: (input: Input, signal: AbortSignal) => Promise<string> }

export function createHandwritingParser(apiKey?: string, { timeoutMs = 60_000, generateContent }: ParserOptions = {}) {
  let ai: GoogleGenAI | undefined;
  const generate = generateContent ?? (async ({ imageBase64, mimeType, additionalNotes }: Input, signal: AbortSignal) => {
    // Load the SDK on the first AI request and reuse its client thereafter.
    const { GoogleGenAI, Type } = await import('@google/genai');
    ai ??= new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: 60_000, headers: { 'User-Agent': 'aistudio-build' } },
    });
    const parts: Part[] = [];

    if (imageBase64) {
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: imageBase64,
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

    return response.text || '{}';
  });
  return async (payload: unknown, signal: AbortSignal) => {
    let input: Input;
    try { input = validateTranscriptionInput(payload); }
    catch (error) { throw new HandwritingError(400, error instanceof DataValidationError ? error.message : 'Invalid planner input.'); }
    if (!apiKey) throw new HandwritingError(503, 'Image transcription is currently unavailable. Add tasks manually or try again later.');
    if (signal.aborted) throw new HandwritingError(499, 'The transcription request was cancelled.');
    const controller = new AbortController();
    let timedOut = false;
    let timer: ReturnType<typeof setTimeout>;
    let abortListener: () => void = () => {};
    const interrupted = new Promise<never>((_, reject) => {
      abortListener = () => { controller.abort(); reject(new HandwritingError(499, 'The transcription request was cancelled.')); };
      if (signal.aborted) abortListener(); else signal.addEventListener('abort', abortListener, { once: true });
      timer = setTimeout(() => { timedOut = true; controller.abort(); reject(new HandwritingError(504, 'Transcription took too long. Try again or add tasks manually.')); }, timeoutMs);
    });
    try {
      const output = await Promise.race([generate(input, controller.signal), interrupted]);
      try { return { success: true, data: validateTranscription(parseBoundedJson(output, 1024 * 1024)) }; }
      catch { throw new HandwritingError(502, 'The transcription service returned an invalid planner. Try again or add tasks manually.'); }
    } catch (error) {
      if (timedOut) throw new HandwritingError(504, 'Transcription took too long. Try again or add tasks manually.');
      if (signal.aborted) throw new HandwritingError(499, 'The transcription request was cancelled.');
      if (error instanceof HandwritingError) throw error;
      throw new HandwritingError(502, 'The transcription service could not analyze this planner. Try again or add tasks manually.');
    } finally {
      clearTimeout(timer!);
      signal.removeEventListener('abort', abortListener);
    }
  };
}
