import { verifyToken } from '../utils/jwt.js';

export function requireAuth(req, res, next) {
    const token = req.cookies.token;
    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.userId = decoded.userId;
    next();
}