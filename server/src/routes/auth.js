import express from 'express';
import { prisma } from '../lib/prisma.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { sendAuthCookie, clearAuthCookie } from '../utils/auth.js';
import { requireAuth } from '../middleware/auth.js';
import { validateRegisterBody } from '../utils/validation.js';

// Mounted at /api/auth
const router = express.Router();

// POST /api/auth/register - Register a new user
router.post('/register', async (req, res) => {
    const result = validateRegisterBody(req.body);
    if (!result.valid) return res.status(400).json({ error: result.error });
    const { email, name, password } = result.data;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
        return res.status(409).json({
            error: {
                code: 'EMAIL_TAKEN',
                message: 'Email already registered',
            }
        });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data: { email, name, passwordHash },
    });

    sendAuthCookie(res, user.id);

    res.status(201).json({
        user: {
            id: user.id, email: user.email, name: user.name
        }
    });
});

// POST /api/auth/login - Authenticate user and issue token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({
            error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
            }
        });
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
        return res.status(401).json({
            error: {
                code: 'INVALID_CREDENTIALS',
                message: 'Invalid email or password',
            }
        });
    }

    sendAuthCookie(res, user.id);

    res.json({ 
        user: {
            id: user.id, email: user.email, name: user.name
        }
    });
});

// POST /api/auth/logout - Log user out, clear cookie
router.post('/logout', (req, res) => {
    clearAuthCookie(res);
    res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me - Get own user information
router.get('/me', requireAuth, async (req, res) => {
    const user = await prisma.user.findUnique({
        where: { id: req.userId },
        select: { id: true, email: true, name: true }, // Omit password
    });

    res.json({ user } );
});

export default router;