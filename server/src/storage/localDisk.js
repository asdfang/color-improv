import path from 'path';
import fs from 'fs/promises';

const EXT_BY_AUDIO_MIME = {
    'audio/webm': 'webm',
    'audio/mp4': 'mp4',
}

export function audioExtFor(audioMimeType) {
    const ext = EXT_BY_AUDIO_MIME[audioMimeType];
    if (!ext) throw new Error(`Unsupported audio MIME type: ${audioMimeType}`);
    return ext;
}

export function pathFor(userId, baseFilename, extension) {
    return path.resolve('uploads', userId, `${baseFilename}.${extension}`);
}

/**
 * Unlinks audio and log files to clean up already-written files in case of validation failure or library full error.
 * @param {string} audioPath 
 * @param {string} logPath 
 */
export async function cleanupRecordingFiles(userId, baseFilename, audioMimeType) {
    await Promise.allSettled([
        fs.unlink(pathFor(userId, baseFilename, audioExtFor(audioMimeType))),
        fs.unlink(pathFor(userId, baseFilename, 'json')),
    ]);
}