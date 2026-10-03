export const MAX_BODY_BYTES = 25 * 1024 * 1024;
export class HandwritingError extends Error {
    constructor(public status: number, message: string, public retryAfter?: number) { super(message); }
}
export function securityHeaders(secure: boolean, development = false): Record<string, string> {
    return {
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        ...(secure ? { 'Strict-Transport-Security': 'max-age=31536000' } : {}),
        ...(!development ? { 'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self'; object-src 'none'; base-uri 'none'; form-action 'self'; frame-ancestors 'self' https://chatgpt.com https://chat.openai.com" } : {}),
    };
}
export function validateApiRequest(origin: string | null | undefined, fetchSite: string | null | undefined, type: string | null | undefined, expectedOrigin: string) {
    if (origin && origin !== expectedOrigin)
        throw new HandwritingError(403, 'Cross-origin transcription requests are not allowed.');
    if (fetchSite && !['same-origin', 'none'].includes(fetchSite))
        throw new HandwritingError(403, 'Cross-origin transcription requests are not allowed.');
    if (type?.split(';')[0].trim().toLowerCase() !== 'application/json')
        throw new HandwritingError(415, 'Send the planner data as JSON.');
}
export function safeApiError(error: unknown): {
    status: number;
    error: string;
    retryAfter?: number;
} {
    if (error instanceof HandwritingError)
        return { status: error.status, error: error.message, retryAfter: error.retryAfter };
    return { status: 500, error: 'The planner request could not be completed. Try again or add tasks manually.' };
}
export async function authorizeTranscription(apiKey: string | undefined, accessToken: string | undefined, authorization: string | null | undefined) {
    // An unconfigured provider is handled after input validation by the parser.
    if (!apiKey)
        return;
    if (!accessToken || accessToken.length < 32 || accessToken.length > 256)
        throw new HandwritingError(503, 'Image transcription is currently unavailable. Add tasks manually or try again later.');
    const provided = authorization?.match(/^Bearer (.{1,256})$/i)?.[1] ?? '';
    const encoder = new TextEncoder();
    const [expectedHash, providedHash] = await Promise.all([accessToken, provided].map(value => crypto.subtle.digest('SHA-256', encoder.encode(value))));
    const expected = new Uint8Array(expectedHash), candidate = new Uint8Array(providedHash);
    let difference = 0;
    for (let index = 0; index < expected.length; index++)
        difference |= expected[index] ^ candidate[index];
    if (difference !== 0)
        throw new HandwritingError(401, 'Enter the transcription access code, then try again.');
}
// Limits are local to the process/Worker isolate. A public, paid provider needs
// authentication and a shared edge quota before this endpoint is enabled at scale.
export function createRequestGate({ limit = 20, windowMs = 60000, maxConcurrent = 2, maxClients = 1024, now = Date.now } = {}) {
    const clients = new Map<string, {
        count: number;
        expires: number;
    }>();
    let active = 0;
    return (client: string) => {
        const time = now();
        for (const [key, entry] of clients)
            if (entry.expires <= time)
                clients.delete(key);
        let entry = clients.get(client);
        if (!entry) {
            if (clients.size >= maxClients)
                throw new HandwritingError(429, 'Transcription is busy. Try again in a minute.', 60);
            entry = { count: 0, expires: time + windowMs };
            clients.set(client, entry);
        }
        if (entry.count >= limit)
            throw new HandwritingError(429, 'Too many transcription requests. Try again later.', Math.max(1, Math.ceil((entry.expires - time) / 1000)));
        entry.count++;
        if (active >= maxConcurrent)
            throw new HandwritingError(429, 'Transcription is busy. Try again shortly.', 5);
        active++;
        let released = false;
        return () => { if (!released) {
            released = true;
            active--;
        } };
    };
}
