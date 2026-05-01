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

export const recordingUpload = multer({
    storage,
    limits: { fileSize: MAX_MB_PER_FILE * 1024 * 1024 }, // 15MB limit for each file
    fileFilter: (req, file, cb) => {
        if (file.fieldname === 'audio'
            && (file.mimetype === 'audio/webm' || file.mimetype === 'audio/mp4')) {
            cb(null, true);
        }
        if (file.fieldname === 'log' && file.mimetype === 'application/json') {
            cb(null, true)
        }
        cb(new Error('Invalid file type'), false);
    },
}).fields([
    { name: 'audio', maxCount: 1 },
    { name: 'log', maxCount: 1 },
]);
