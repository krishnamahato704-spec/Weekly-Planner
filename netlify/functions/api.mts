import type { Config, Context } from '@netlify/functions';
import { createNetlifyApiHandler } from '../../server/netlifyApi';

let handler: ReturnType<typeof createNetlifyApiHandler> | undefined;

export default async function api(request: Request, context: Context): Promise<Response> {
  handler ??= createNetlifyApiHandler();
  return handler(request, {
    GEMINI_API_KEY: Netlify.env.get('GEMINI_API_KEY'),
    TRANSCRIPTION_ACCESS_TOKEN: Netlify.env.get('TRANSCRIPTION_ACCESS_TOKEN'),
  }, context.ip);
}

export const config: Config = { path: ['/api', '/api/*'] };
