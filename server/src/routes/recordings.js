// Routes for handling recording uploads
// Known issue: TOCTOU race condition

import express from 'express';
import { prisma } from '../lib/prisma.js';
import fs from 'fs/promises';
import { requireAuth } from '../middleware/auth.js';
import { recordingUpload } from '../middleware/upload.js';
import { validateRecordingMetadata } from '../utils/validation.js';
import { MAX_RECORDINGS_PER_USER } from '../constants.js';

// Mounted at /api/recordings, all routes here require auth
const router = express.Router();
router.use(requireAuth);

// Extract to another file?
/**
 * Unlinks audio and log files to clean up already-written files in case of validation failure or library full error.
 * @param {string} audioPath 
 * @param {string} logPath 
 */
async function cleanupSavedFiles(audioPath, logPath) {
    await Promise.allSettled([
        fs.unlink(audioPath),
        fs.unlink(logPath),
    ]);
}

/**
 * Handles recording uploads with recordingUpload multer middleware.
 * Validates metadata and checks library limits before creating a new recording entry in the database.
 * Cleans up files already written by multer if validation fails or library is full to prevent orphaned files.
 */
router.post('/', recordingUpload, async (req, res) => {
    const audioFile = req.files?.audio?.[0];
    const logFile = req.files?.log?.[0];
    if (!audioFile || !logFile) {
        return res.status(400).json({error: 'Audio and log files are required'});
    }

    const recordingMetadataResult = validateRecordingMetadata(req.body);
    if (!recordingMetadataResult.valid) {
        await cleanupSavedFiles(audioFile.path, logFile.path);
        return res.status(400).json({ error: recordingMetadataResult.error });
    }

    const count = await prisma.recording.count({ where: { userId: req.userId }});
    if (count >= MAX_RECORDINGS_PER_USER) {
        await cleanupSavedFiles(audioFile.path, logFile.path);

        return res.status(409).json({
            error: {
                code: 'LIBRARY_FULL',
                message: `Limit of ${MAX_RECORDINGS_PER_USER} recordings reached.`
            },
        });
    }

    try {
        const recording = await prisma.recording.create({
            data: {
                userId: req.userId,
                title: recordingMetadataResult.data.title,
                notes: recordingMetadataResult.data.notes,
                durationSeconds: recordingMetadataResult.data.durationSeconds,
                baseFilename: req.recordingBaseName,
                audioMimeType: audioFile.mimetype,
                audioFileSizeBytes: audioFile.size,
                logFileSizeBytes: logFile.size,
            }
        });
        res.status(201).json({ recording });
    } catch (error) {
        await cleanupSavedFiles(audioFile.path, logFile.path);
        throw error;
    }
});

export default router;