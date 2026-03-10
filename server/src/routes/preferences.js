import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

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
    return {
        difficulty: preferences.difficulty,
        backingTrackVolume: preferences.backingTrackVolume,
        samplesVolume: preferences.samplesVolume,
        backingTrackMuted: preferences.backingTrackMuted,
        samplesMuted: preferences.samplesMuted,
    };
}

// GET /api/preferences - Get current user's preferences
// TODO: fix hardcoded default preferences?
router.get('/', async (req, res) => {
const userId = req.userId;
    let preferences = await prisma.userPreferences.findUnique({
        where: { userId },
    });
    if (!preferences) {
        preferences = {
            difficulty: 'easy',
            backingTrackVolume: 0.6,
            samplesVolume: 0.8,
            backingTrackMuted: false,
            samplesMuted: false,
        };
    }

    console.log('Fetched preferences for user (only returning preferences):', preferences); // Debug log

    res.json({ preferences: toPreferencesResponse(preferences) });
});

// PUT /api/preferences - Update current user's preferences
router.put('/', async (req, res) => {
    const userId = req.userId;
    const {
        difficulty,
        backingTrackVolume,
        samplesVolume,
        backingTrackMuted,
        samplesMuted,
    } = req.body;
    
    if (difficulty && ![ 'EASY', 'MEDIUM', 'HARD' ].includes(difficulty)) {
        return res.status(400).json({
            error: `Invalid difficulty value: ${difficulty}. Must be 'EASY', 'MEDIUM', or 'HARD'.`
        });
    }

    const preferences = await prisma.userPreferences.upsert({
        where: { userId },
        update: {
            ...(difficulty && { difficulty }),
            ...(backingTrackVolume !== undefined && { backingTrackVolume }),
            ...(samplesVolume !== undefined && { samplesVolume }),
            ...(backingTrackMuted !== undefined && { backingTrackMuted }),
            ...(samplesMuted !== undefined && { samplesMuted }),
        },
        create: {
            userId,
            difficulty: difficulty || 'EASY',
            backingTrackVolume: backingTrackVolume ?? 0.6,
            samplesVolume: samplesVolume ?? 0.8,
            backingTrackMuted: backingTrackMuted ?? false,
            samplesMuted: samplesMuted ?? false,
        },
    });

    console.log('Updated preferences for user', userId, preferences); // Debug log

    res.json({ preferences: toPreferencesResponse(preferences) });
});

export default router;