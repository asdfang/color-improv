import 'dotenv/config';
import express from 'express';
import { prisma } from './lib/prisma.js';
import { hashPassword, comparePassword } from './utils/password.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

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

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});