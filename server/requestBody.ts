import { HandwritingError, MAX_BODY_BYTES } from './security';

export async function readJsonBody(request: Request, maxBytes = MAX_BODY_BYTES, timeoutMs = 30_000): Promise<unknown> {
  const tooLarge = () => new HandwritingError(413, `Planner data exceeds the ${maxBytes / 1024 / 1024} MiB request limit. Choose a smaller image.`);
  const rawLength = request.headers.get('content-length');
  if (rawLength && (!/^\d+$/.test(rawLength) || Number(rawLength) > maxBytes)) throw tooLarge();
  const reader = request.body?.getReader();
  if (!reader) throw new HandwritingError(400, 'Planner data must be valid JSON.');
  let timer: ReturnType<typeof setTimeout>;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new HandwritingError(408, 'The upload took too long. Try a smaller image.')), timeoutMs);
  });
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = '', bytes = 0;
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), timeout]);
      if (done) break;
      bytes += value.byteLength;
      if (bytes > maxBytes) throw tooLarge();
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    try { return JSON.parse(text); }
    catch { throw new HandwritingError(400, 'Planner data must be valid JSON.'); }
  } catch (error) {
    // A disconnected upload must not delay the error response during cancellation.
    void reader.cancel().catch(() => {});
    if (error instanceof HandwritingError) throw error;
    throw new HandwritingError(400, 'The planner upload could not be read.');
  } finally { clearTimeout(timer!); reader.releaseLock(); }
}
