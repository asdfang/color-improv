import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.post('/api/echo', (req, res) => {
    res.json({
        message: 'You sent me:',
        data: req.body,
    });
});

app.get('/api/secret', (req, res) => {
    res.json({ secret: process.env.SECRET_MESSAGE });
});

app.get('/api/health', (req, res) => {
    // res.json({ status: 'ok', message: 'Server is running!' });
    res.send('Hello world.');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});