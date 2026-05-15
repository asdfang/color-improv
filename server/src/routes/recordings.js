// Routes for handling recording routes - uploading, serving audio/log files.
// Requires authentication for all routes. 
// TODO: periodic cleanup of orphaned files.
// Known issue: TOCTOU race condition

import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { recordingUpload } from '../middleware/upload.js';
import { validateAllowedFields, validateRecordingMetadataOnCreate, validateRecordingMetadataOnUpdate } from '../utils/validation.js';
import { MAX_RECORDINGS_PER_USER } from '../constants.js';
import { audioExtFor, keyFor, getFromR2, uploadToR2, cleanupByKeys } from '../lib/storage.js';
import { err, ErrorCode } from '../utils/errors.js';

// Mounted at /api/recordings, all routes here require auth
const router = express.Router();
router.use(requireAuth); // req.userId becomes available in all routes below

/**
 * Helper function to load a recording by ID, ensuring it belongs to the authenticated user.
 * Returns the recording row if found, or null if not found or does not belong to user.
 * NOTE: could be extracted
 * @param {string} recordingId 
 * @param {string} userId 
 * @returns 
 */
async function loadOwnedRecording(recordingId, userId) {
    return await prisma.recording.findFirst({
        where: { id: recordingId, userId: userId }
    });
}

/**
 * POST /api/recordings - handles recording uploads with recordingUpload multer middleware.
 * Validates metadata and checks library limits before creating a new recording entry in the database.
 * Optionally accepts a replacesId field in the body to indicate which recording is being replaced when library is full (throws if library isn't full).
 * 
 * Expected multipart/form-data body with:
 * - title (string, required)
 * - notes (string, optional)
 * - durationSeconds (number, required)
 * - replacesId (string, optional) - ID of existing recording this upload replaces because library is full.
 */
router.post('/', recordingUpload, async (req, res) => {
    const baseFilename = `rec_${req.userId}_${Date.now()}`;
    const audioFile = req.files?.audio?.[0];
    const logFile = req.files?.log?.[0];
    if (!audioFile || !logFile) {
        return res.status(400).json(err(ErrorCode.MISSING_FILES, 'Audio and log files are required'));
    }

    const allowedFieldsResult = validateAllowedFields(req.body, ['title', 'notes', 'durationSeconds', 'replacesId']);
    if (!allowedFieldsResult.valid) {
        return res.status(400).json(err(ErrorCode.VALIDATION_FAILED, allowedFieldsResult.error));
    }

    const recordingMetadataResult = validateRecordingMetadataOnCreate(req.body);
    if (!recordingMetadataResult.valid) {
        return res.status(400).json(err(ErrorCode.VALIDATION_FAILED, recordingMetadataResult.error));
    }

    const replacesId = recordingMetadataResult.data.replacesId;
    const replacingExisting = Boolean(replacesId);
    const count = await prisma.recording.count({ where: { userId: req.userId }});

    if (!replacingExisting && count >= MAX_RECORDINGS_PER_USER) {
        return res.status(409).json(err(ErrorCode.LIBRARY_FULL, `Limit of ${MAX_RECORDINGS_PER_USER} recordings reached.`));
    } else if (replacingExisting && count < MAX_RECORDINGS_PER_USER) {
        return res.status(409).json(err(ErrorCode.NOT_FULL, 'Library is not full, cannot replace existing recording. Please omit replacesId field.'));
    }

    let recordingToReplace = null;
    if (replacingExisting) {
        recordingToReplace = await loadOwnedRecording(replacesId, req.userId);
        if (!recordingToReplace) {
            return res.status(404).json(err(ErrorCode.RECORDING_NOT_FOUND, 'Recording to replace not found. Please check replacesId field.'));
        }
    }

    // Upload to R2
    const audioKey = keyFor(req.userId, baseFilename, audioExtFor(req.files.audio[0].mimetype));
    const logKey = keyFor(req.userId, baseFilename, 'json');
    try {
        await Promise.all([
            uploadToR2(audioKey, audioFile.buffer, req.files.audio[0].mimetype),
            uploadToR2(logKey, logFile.buffer, 'application/json'),
        ]);
    } catch (error) {
        await cleanupByKeys([
            audioKey,
            logKey,
        ]);
        throw error;
    }

    // At this point, all validation has passed.
    // Replacing -> delete and create; on success, delete old files. Else, just create.
    // On failure in both cases, delete new files.
    const createOptions = {
        data: {
            userId: req.userId,
            title: recordingMetadataResult.data.title,
            notes: recordingMetadataResult.data.notes,
            durationSeconds: recordingMetadataResult.data.durationSeconds,
            baseFilename,
            audioMimeType: audioFile.mimetype,
            audioFileSizeBytes: audioFile.size,
            logFileSizeBytes: logFile.size,
        },
        omit: { userId: true, baseFilename: true }
    };

    // Update database
    let recording;
    try {
        if (replacingExisting) {
            recording = await prisma.$transaction(async (tx) => {
                await tx.recording.delete({ where: { id: recordingToReplace.id }});
                return await tx.recording.create(createOptions);
            });
            await cleanupByKeys([
                keyFor(req.userId, recordingToReplace.baseFilename, audioExtFor(recordingToReplace.audioMimeType)),
                keyFor(req.userId, recordingToReplace.baseFilename, 'json'),
            ]);
        } else {
            recording = await prisma.recording.create(createOptions);
        }
        res.status(201).json({ recording });
    } catch (error) {
        await cleanupByKeys([
            audioKey,
            logKey,
        ]);
        throw error;
    }
});

// GET /api/recordings/:id/audio - Serves the specified audio file.
router.get('/:id/audio', async (req, res) => {
    const recording = await loadOwnedRecording(req.params.id, req.userId);
    if (!recording) return res.status(404).json(err(ErrorCode.NOT_FOUND, 'Not found'));
    const ext = audioExtFor(recording.audioMimeType);
    const audioKey = keyFor(req.userId, recording.baseFilename, ext);

    try {
        const result = await getFromR2(audioKey);
        res.setHeader('Content-Type', result.ContentType);
        if (result.ContentLength) res.setHeader('Content-Length', result.ContentLength);
        result.Body.pipe(res);
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            return res.status(404).json(err(ErrorCode.NOT_FOUND, 'Audio file not found'));
        }
        throw error;
    }
});

// GET /api/recordings/:id/log - Serves the specified log file.
router.get('/:id/log', async (req, res) => {
    const recording = await loadOwnedRecording(req.params.id, req.userId);
    if (!recording) return res.status(404).json(err(ErrorCode.NOT_FOUND, 'Not found'));
    const logKey = keyFor(req.userId, recording.baseFilename, 'json');

    try {
        const result = await getFromR2(logKey);
        res.setHeader('Content-Type', result.ContentType);
        if (result.ContentLength) res.setHeader('Content-Length', result.ContentLength);
        result.Body.pipe(res);
    } catch (error) {
        if (error.name === 'NoSuchKey') {
            return res.status(404).json(err(ErrorCode.NOT_FOUND, 'Log file not found'));
        }
        throw error;
    }
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
        return res.status(400).json(err(ErrorCode.VALIDATION_FAILED, allowedFieldsResult.error));
    }

    const recordingMetadataResult = validateRecordingMetadataOnUpdate(req.body);
    if (!recordingMetadataResult.valid) {
        return res.status(400).json(err(ErrorCode.VALIDATION_FAILED, recordingMetadataResult.error));
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
            return res.status(404).json(err(ErrorCode.NOT_FOUND, 'Not found'));
        }
        throw error;
    }
});

// DELETE /api/recordings/:id - Deletes the specified recording and its associated files.
// No catching for TOCTOU or infrastructure failure; send straight to global error handler.
router.delete('/:id', async (req, res) => {
    const recording = await loadOwnedRecording(req.params.id, req.userId);
    if (!recording) return res.status(404).json(err(ErrorCode.NOT_FOUND, 'Not found'));

    await prisma.recording.delete({ where: { id: recording.id }});
    await cleanupByKeys([
        keyFor(req.userId, recording.baseFilename, audioExtFor(recording.audioMimeType)),
        keyFor(req.userId, recording.baseFilename, 'json'),
    ]);
    res.status(204).send();
});

export default router;