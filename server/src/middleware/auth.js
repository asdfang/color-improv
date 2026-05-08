// Middleware to enforce authentication on protected routes.
// Checks for/verifies JWT token in cookies and attaches userId to req if valid.
// Returns 401 error if no token or invalid/expired token.

import { verifyToken } from '../utils/jwt.js';

/**
 * Attaches userId to req if valid token found in cookies. Otherwise returns 401 error.
 * @param {Request} req 
 * @param {Response} res 
 * @param {NextFunction} next 
 * @returns 
 */
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