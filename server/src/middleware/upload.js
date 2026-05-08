// Multer middleware for recording uploads.
// Parses multipart/form-data requests with 'audio' and 'log' fields,
// writes to disk in user-specific folders with shared base filename.
// Enforces file type and size limits.
// Requires auth middleware to set req.userId first.

import multer from 'multer';
import path from 'path';
import { mkdirSync } from 'fs';
import fs from 'fs/promises';
import { MAX_MB_PER_FILE } from '../constants.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads');

// Ensure upload directory exists
mkdirSync(UPLOAD_DIR, { recursive: true });

function getFileExtension(file) {
    if (file.fieldname === 'log') return 'json';
    if (file.mimetype === 'audio/webm') return 'webm';
    if (file.mimetype === 'audio/mp4') return 'mp4';
    throw new Error(`Unsupported file type: ${file.mimetype}`);
}

function generateBaseFilename(userId) {
    return `rec_${userId}_${Date.now()}`;
}

// Return instance with user_id subdirectory, create if it doesn't exist - ex: uploads/{user_id}/
const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const userUploadDir = path.join(UPLOAD_DIR, req.userId);
            await fs.mkdir(userUploadDir, { recursive: true });
            cb(null, userUploadDir);
        } catch (err) {
            cb(err);
        }
    },
    filename: (req, file, cb) => {
        try {
            // Ensure both audio and log file share base name
            const base = req.recordingBaseName ?? (req.recordingBaseName = generateBaseFilename(req.userId));
            const ext = getFileExtension(file);
            cb(null, `${base}.${ext}`);
        } catch (err) {
            cb(err);
        }
    },
});

/**
 * Multer middleware to handle recording uploads.
 * On success, populates req.files.audio[0] and req.files.log[0] with multer file objects already written to disk.
 * req.body will hold text fields (title, notes, durationSeconds).
 */
export const recordingUpload = multer({
    storage,
    limits: { fileSize: MAX_MB_PER_FILE * 1024 * 1024 }, // 15MB limit for each file
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audio'
            && (file.mimetype === 'audio/webm' || file.mimetype === 'audio/mp4')) {
            return cb(null, true);
        }
        if (file.fieldname === 'log' && file.mimetype === 'application/json') {
            return cb(null, true)
        }
        cb(new Error('Invalid file type'), false);
    },
}).fields([
    { name: 'audio', maxCount: 1 },
    { name: 'log', maxCount: 1 },
]);
