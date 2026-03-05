import express from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middleware/auth.js';

// Mount at /api/preferences, all routes here require auth
const router = express.Router();
router.use(requireAuth); 

// GET /api/preferences - Get current user's preferences
// TODO: fix hardcoded default preferences?
router.get('/', async (req, res) => {
    const userId = req.userId;
    let preferences = await prisma.userPreferences.findUnique({
        where: { userId },
    });
    if (!preferences) {
        preferences = {
            difficulty: 'EASY',
            backingTrackVolume: 0.6,
            samplesVolume: 0.8,
            backingTrackMuted: false,
            samplesMuted: false,
        };
    }

    res.json({ preferences });
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
        return res.status(400).json({ error: 'Invalid difficulty value' });
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

    res.json({ preferences });
});

export default router;