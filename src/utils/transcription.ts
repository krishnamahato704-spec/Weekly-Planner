import { DataValidationError, validateTask } from './dataValidation';
export const MAX_IMAGE_BYTES = 16 * 1024 * 1024;
export const IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;
export function validateTranscriptionInput(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new DataValidationError('Send a JSON object containing an image or notes.');
    const raw = value as Record<string, unknown>;
    if (Object.keys(raw).some(key => !['imageBase64', 'mimeType', 'additionalNotes'].includes(key)))
        throw new DataValidationError('Unexpected transcription fields.');
    const { imageBase64, mimeType, additionalNotes } = raw;
    if ((imageBase64 !== undefined && typeof imageBase64 !== 'string') || (mimeType !== undefined && typeof mimeType !== 'string') || (additionalNotes !== undefined && typeof additionalNotes !== 'string'))
        throw new DataValidationError('Image, MIME type, and notes must be strings.');
    const notes = (additionalNotes as string | undefined)?.trim() ?? '';
    if (notes.length > 10000)
        throw new DataValidationError('Notes must be at most 10,000 characters.');
    if (!imageBase64 && !notes)
        throw new DataValidationError('Provide a planner image or text notes.');
    if (!imageBase64)
        return { additionalNotes: notes };
    let data = imageBase64 as string;
    const dataUrl = data.match(/^data:([^;,]+);base64,/);
    if (dataUrl)
        data = data.slice(dataUrl[0].length);
    const type = (mimeType || dataUrl?.[1] || 'image/jpeg') as typeof IMAGE_MIME_TYPES[number];
    if (!IMAGE_MIME_TYPES.includes(type) || (dataUrl && dataUrl[1] !== type))
        throw new DataValidationError('Use a JPEG, PNG, or WebP image with a matching MIME type.');
    if (!data.length || data.length > Math.ceil(MAX_IMAGE_BYTES / 3) * 4 || data.length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(data))
        throw new DataValidationError('The image must be valid base64 and at most 16 MiB.');
    const padding = data.endsWith('==') ? 2 : data.endsWith('=') ? 1 : 0;
    if (data.length / 4 * 3 - padding > MAX_IMAGE_BYTES)
        throw new DataValidationError('The image exceeds the 16 MiB limit.');
    const bytes = Uint8Array.from(atob(data.slice(0, 32)), char => char.charCodeAt(0));
    const matches = type === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
        : type === 'image/png' ? [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b)
            : [82, 73, 70, 70].every((b, i) => bytes[i] === b) && [87, 69, 66, 80].every((b, i) => bytes[i + 8] === b);
    if (!matches)
        throw new DataValidationError('The image contents do not match its MIME type.');
    return { imageBase64: data, mimeType: type, additionalNotes: notes };
}
export function validateTranscription(value: unknown) {
    if (!value || typeof value !== 'object' || Array.isArray(value))
        throw new DataValidationError('The transcription response is invalid.');
    const raw = value as Record<string, unknown>;
    if (!Array.isArray(raw.tasks) || !raw.tasks.length || raw.tasks.length > 500)
        throw new DataValidationError('The transcription must contain between 1 and 500 tasks.');
    const tasks = raw.tasks.map((value, index) => {
        if (!value || typeof value !== 'object' || Array.isArray(value))
            throw new DataValidationError('The transcription contains an invalid task.');
        const rawTask = value as Record<string, unknown>;
        const { title, category, priority, notes } = validateTask({
            id: `scan-${index}`, title: rawTask.title, category: rawTask.category, priority: rawTask.priority, notes: rawTask.notes
        });
        return {
            title, category, priority, notes
        };
    });
    if ((raw.weekTitle !== undefined && (typeof raw.weekTitle !== 'string' || raw.weekTitle.length > 500)) || (raw.focusGoal !== undefined && (typeof raw.focusGoal !== 'string' || raw.focusGoal.length > 20000)))
        throw new DataValidationError('The transcription headings are invalid.');
    return { weekTitle: raw.weekTitle as string | undefined, focusGoal: raw.focusGoal as string | undefined, tasks };
}
