// Routes for handling recording routes - uploading, serving audio/log files.
// Requires authentication for all routes. 
// TODO: swap disk storage for cloud storage.
// Known issue: TOCTOU race condition

import express from 'express';
import { prisma } from '../lib/prisma.js';
import fs from 'fs/promises';
import { requireAuth } from '../middleware/auth.js';
import { recordingUpload } from '../middleware/upload.js';
import { validateAllowedFields, validateRecordingMetadataOnCreate, validateRecordingMetadataOnUpdate } from '../utils/validation.js';
import { MAX_RECORDINGS_PER_USER } from '../constants.js';
import { audioExtFor, pathFor, cleanupRecordingFiles } from '../storage/localDisk.js';

// Mounted at /api/recordings, all routes here require auth
const router = express.Router();
router.use(requireAuth); // req.userId becomes available in all routes below

/**
 * Helper function to load a recording by ID, ensuring it belongs to the authenticated user.
 * Returns the recording row if found, or null if not found or does not belong to user.
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
 * POST /api/recordings - handles recording uploads with recordingUpload multer middleware.
 * Validates metadata and checks library limits before creating a new recording entry in the database.
 * Cleans up files already written by multer if validation fails or library is full to prevent orphaned files.
 */
router.post('/', recordingUpload, async (req, res) => {
    const audioFile = req.files?.audio?.[0];
    const logFile = req.files?.log?.[0];
    if (!audioFile || !logFile) {
        return res.status(400).json({error: 'Audio and log files are required'});
    }
    
    const allowedFieldsResult = validateAllowedFields(req.body, ['title', 'notes', 'durationSeconds']);
    if (!allowedFieldsResult.valid) {
        await cleanupRecordingFiles(req.userId, req.recordingBaseName, audioFile.mimetype);
        return res.status(400).json({ error: allowedFieldsResult.error });
    }

    const recordingMetadataResult = validateRecordingMetadataOnCreate(req.body);
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
            },
            omit: { userId: true, baseFilename: true },
        });
        res.status(201).json({ recording });
    } catch (error) {
        await cleanupRecordingFiles(req.userId, req.recordingBaseName, audioFile.mimetype);
        throw error;
    }
});

// GET /api/recordings/:id/audio - Serves the specified audio file.
router.get('/:id/audio', async (req, res) => {
    const recording = await loadOwnedRecording(req);
    if (!recording) return res.status(404).json({ error: 'Not found' });
    const ext = audioExtFor(recording.audioMimeType);
    const audioPath = pathFor(req.userId, recording.baseFilename, ext); // TODO: change for cloud storage
    res.sendFile(audioPath, {
        headers: { 'Content-Type': recording.audioMimeType }
    });
});

// GET /api/recordings/:id/log - Serves the specified log file.
router.get('/:id/log', async (req, res) => {
    const recording = await loadOwnedRecording(req);
    if (!recording) return res.status(404).json({ error: 'Not found' });
    const logPath = pathFor(req.userId, recording.baseFilename, 'json'); // TODO: change for cloud storage
    res.sendFile(logPath, {
        headers: { 'Content-Type': 'application/json' }
    });
});

// GET /api/recordings - Returns a list of all the authenticated user's recordings.
router.get('/', async (req, res) => {
    const recordings = await prisma.recording.findMany({
        where: { userId: req.userId },
        orderBy: { createdAt: 'desc' },
        omit: { userId: true, baseFilename: true },
    });
    res.status(200).json({ recordings });
});

// PATCH /api/recordings/:id - Updates one or both title/notes metadata for the specified recording.
router.patch('/:id', async (req, res) => {
    const allowedFieldsResult = validateAllowedFields(req.body, ['title', 'notes']);
    if (!allowedFieldsResult.valid) {
        return res.status(400).json({ error: allowedFieldsResult.error });
    }

    const recordingMetadataResult = validateRecordingMetadataOnUpdate(req.body);
    if (!recordingMetadataResult.valid) {
        return res.status(400).json({ error: recordingMetadataResult.error });
    }

    try {
        const recording = await prisma.recording.update({
            where: { id: req.params.id, userId: req.userId },
            data: {
                title: recordingMetadataResult.data.title,
                notes: recordingMetadataResult.data.notes,
            },
            omit: { userId: true, baseFilename: true },
        });
        res.status(200).json({ recording });
    } catch (error) {
        if (error.code === 'P2025') { // Prisma "Record to update not found" error
            return res.status(404).json({ error: 'Not found' });
        }
        throw error;
    }
});

// DELETE /api/recordings/:id - Deletes the specified recording and its associated files.
// No catching for TOCTOU or infrastructure failure; send straight to global error handler.
router.delete('/:id', async (req, res) => {
    const recording = await loadOwnedRecording(req);
    if (!recording) return res.status(404).json({ error: 'Not found' });

    await prisma.recording.delete({ where: { id: recording.id }});
    await cleanupRecordingFiles(recording.userId, recording.baseFilename, recording.audioMimeType);
    res.status(204).send();
});

export default router;