import 'dotenv/config';
import express from 'express';
import { prisma } from './lib/prisma.js';
import { hashPassword, comparePassword } from './utils/password.js';
import { generateToken, verifyToken } from './utils/jwt.js';
import cookieParser from 'cookie-parser';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());
app.use(cookieParser());

app.post('/api/users', async (req, res) => {
    const { email, name, password } = req.body;

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            email,
            name,
            passwordHash
        },
    });

    res.json(user);

    const { password: _, ...userWithoutPassword } = userWithoutPassword;
    res.json(userWithoutPassword);
});

app.get('/api/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
        return res.status(401).json({error: 'Invalid email or password'});
    }

    const isValidPassword = await comparePassword(password, user.passwordHash);
    if (!isValidPassword) {
        return res.status(401).json({error: 'Invalid email or password'});
    }

    // User authenticated, generate JWT
    const token = generateToken(user.id);

    // Set token in secure cookie
    res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
        message: `Hello, ${user.name}! Login successful`,
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
        },
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});