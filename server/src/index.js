import 'dotenv/config';
import express from 'express';
import { prisma } from './lib/prisma.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.post('/api/users', async (req, res) => {
    const { email, name } = req.body;

    const user = await prisma.user.create({
        data: { email, name },
    });

    res.json(user);
});

app.get('/api/users', async (req, res) => {
    const users = await prisma.user.findMany();
    res.json(users);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});