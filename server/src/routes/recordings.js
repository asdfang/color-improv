// Routes for handling recording routes - uploading, serving audio/log files.
// Requires authentication for all routes. 
// TODO: swap disk storage for cloud storage.
// Known issue: TOCTOU race condition

import express from 'express';
import { prisma } from '../lib/prisma.js';
import fs from 'fs/promises';
import { requireAuth } from '../middleware/auth.js';
import { recordingUpload } from '../middleware/upload.js';
import { validateRecordingMetadata } from '../utils/validation.js';
import { MAX_RECORDINGS_PER_USER } from '../constants.js';
import { audioExtFor, pathFor, cleanupRecordingFiles } from '../storage/localDisk.js';

// Mounted at /api/recordings, all routes here require auth
const router = express.Router();
router.use(requireAuth); // req.userId becomes available in all routes below

/**
 * Helper function to load a recording by ID, ensuring it belongs to the authenticated user.
 * NOTE: could be extracted
 * @param {Request} req 
 * @returns 
 */
async function loadOwnedRecording(req) {
    return await prisma.recording.findFirst({
        where: { id: req.params.id, userId: req.userId }
    });
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
        await cleanupRecordingFiles(req.userId, req.recordingBaseName, audioFile.mimetype);
        return res.status(400).json({ error: recordingMetadataResult.error });
    }

    const count = await prisma.recording.count({ where: { userId: req.userId }});
    if (count >= MAX_RECORDINGS_PER_USER) {
        await cleanupRecordingFiles(req.userId, req.recordingBaseName, audioFile.mimetype);

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
        await cleanupRecordingFiles(req.userId, req.recordingBaseName, audioFile.mimetype);
        throw error;
    }
});

// Serves the specified audio file.
router.get('/:id/audio', async (req, res) => {
    const recording = await loadOwnedRecording(req);
    if (!recording) return res.status(404).json({ error: 'Not found' });
    const ext = audioExtFor(recording.audioMimeType);
    const audioPath = pathFor(req.userId, recording.baseFilename, ext); // TODO: change for cloud storage
    res.sendFile(audioPath, {
        headers: { 'Content-Type': recording.audioMimeType }
    });
});

// Serves the specified log file.
router.get('/:id/log', async (req, res) => {
    const recording = await loadOwnedRecording(req);
    if (!recording) return res.status(404).json({ error: 'Not found' });
    const logPath = pathFor(req.userId, recording.baseFilename, 'json'); // TODO: change for cloud storage
    res.sendFile(logPath, {
        headers: { 'Content-Type': 'application/json' }
    });
});

export default router;