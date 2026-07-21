import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import preferencesRoutes from './routes/preferences.js';
import recordingsRoutes from './routes/recordings.js';
import { err, ErrorCode } from './utils/errors.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json()); // req.body available for JSON payloads
app.use(cookieParser());
app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true
}));

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/recordings', recordingsRoutes);

// SPA catch-all route
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const clientDistPath = path.join(__dirname, '../../client/dist');

app.use(express.static(clientDistPath));
app.get('{*path}', (req, res, next) => {
    if (req.path.startsWith('/api/')) {
        return next(); // fall through to error handler or 404
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
});

app.use((error, req, res, next) => {
    if (res.headersSent) {
        return next(error); // pass on to Express's built-in error handler
    }
    console.error('Error:', error);
    res.status(500).json(err(ErrorCode.INTERNAL_ERROR, 'Internal server error'));
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});