import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';
import { validatePreferencesBody } from '../utils/validation.js';
import { PREFERENCE_DEFAULTS } from '../constants.js';

// Mount at /api/preferences, all routes here require auth
const router = express.Router();
router.use(requireAuth);

/**
 * Converts a preferences object to a response-friendly format, removing any user-specific information.
 * @param {object} preferences 
 * @returns {object} Response-friendly preferences object
 */
function toPreferencesResponse(preferences) {
    if (!preferences) return null;
    return Object.fromEntries(
        Object.keys(PREFERENCE_DEFAULTS).map(key => [key, preferences[key]])
    );
}

// GET /api/preferences - Get current user's preferences
router.get('/', async (req, res) => {
    const userId = req.userId;
    let preferences = await prisma.userPreferences.findUnique({
        where: { userId },
    });
    if (!preferences) preferences = { ...PREFERENCE_DEFAULTS };

    res.json({ preferences: toPreferencesResponse(preferences) });
});

// PUT /api/preferences - Update current user's preferences
router.put('/', async (req, res) => {
    const userId = req.userId;

    const result = validatePreferencesBody(req.body);
    if (!result.valid) return res.status(400).json({ error: result.error });

    const {
        difficulty,
        backingTrackVolume,
        samplesVolume,
        backingTrackMuted,
        samplesMuted,
    } = result.data;

    const preferences = await prisma.userPreferences.upsert({
        where: { userId },
        update: {
            ...(difficulty !== undefined && { difficulty }),
            ...(backingTrackVolume !== undefined && { backingTrackVolume }),
            ...(samplesVolume !== undefined && { samplesVolume }),
            ...(backingTrackMuted !== undefined && { backingTrackMuted }),
            ...(samplesMuted !== undefined && { samplesMuted }),
        },
        create: {
            // Defaults provided if optional fields are missing
            userId,
            difficulty: difficulty ?? PREFERENCE_DEFAULTS.difficulty,
            backingTrackVolume: backingTrackVolume ?? PREFERENCE_DEFAULTS.backingTrackVolume,
            samplesVolume: samplesVolume ?? PREFERENCE_DEFAULTS.samplesVolume,
            backingTrackMuted: backingTrackMuted ?? PREFERENCE_DEFAULTS.backingTrackMuted,
            samplesMuted: samplesMuted ?? PREFERENCE_DEFAULTS.samplesMuted,
        },
    });

    res.json({ preferences: toPreferencesResponse(preferences) });
});

export default router;