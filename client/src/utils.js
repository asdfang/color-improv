import JSZip from 'jszip';
import mime from 'mime-types';

/** @typedef {import('./constants').NoteEventName} NoteEventName */

/**
 * Dispatches a note event with the specified parameters.
 * For ease, KeyboardHandler and touch input both use KeyCode,
 * so active notes can be tracked in a single set.
 * @param {NoteEventName} eventName 
 * @param {string} uniqueID 
 * @param {number} midiNumber 
 */
export function dispatchNoteEvent(eventName, uniqueID, midiNumber) {
    const event = new CustomEvent(eventName, {
        detail: {
            uniqueID,
            midiNumber,
            timestamp: performance.now(),
        }
    });
    document.dispatchEvent(event);
}

/**
 * @param {string} mimeType
 * @returns {string} file extension without dot
 */
function normalizeRecordingExtension(mimeType) {
    let extension = mime.extension(mimeType) || 'webm';
    // Force better compatibility with common browsers
    if (extension === 'weba') extension = 'webm';
    if (extension === 'mp4') extension = 'm4a';
    return extension;
}

/**
 * Removes characters that are invalid in filenames, and truncates to a reasonable length.
 * @param {string|undefined} name 
 * @returns {string} sanitized filename or default 'performance' if name is empty/undefined after sanitization
 */
function sanitizeFilename(name) {
    return (name || 'performance').replace(/[/\\:*?"<>|]/g, '_').trim().slice(0, 80) || 'performance';
}

/**
 * Downloads a zip file containing the recording audio and log data.
 * @param {Blob|undefined} audioBlob
 * @param {Object|undefined} logObject
 * @param {string|undefined} title - Optional title for the downloaded file
 * @returns {Promise<void>}
 */
export async function downloadRecordingZip(audioBlob, logObject, title='') {
    if (!audioBlob || !logObject) return;
    const zip = new JSZip();
    const ext = normalizeRecordingExtension(audioBlob.type);
    zip.file(`recording.${ext}`, audioBlob);
    zip.file('log.json', JSON.stringify(logObject, null, 2));

    const zipBlob = await zip.generateAsync({ type: 'blob' });
    const zipUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = zipUrl;
    a.download = `${sanitizeFilename(title)}_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(zipUrl), 100);
}