import express from 'express';

const app = express();
const PORT = 3001;

app.use(express.json());

app.post('/api/echo', (req, res) => {
    res.json({
        message: 'You sent me:',
        data: req.body,
    });
});

app.get('/api/health', (req, res) => {
    // res.json({ status: 'ok', message: 'Server is running!' });
    res.send('Hello world.');
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});