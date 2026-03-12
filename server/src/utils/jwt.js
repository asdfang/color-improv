import jwt from 'jsonwebtoken';
import requireEnv from './env.js';

const JWT_SECRET = requireEnv('JWT_SECRET');
const JWT_EXPIRES_IN = '7d';

export function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    }
    catch (err) {
        return null;
    }
}