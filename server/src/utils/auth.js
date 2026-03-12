import { generateToken } from './jwt.js';

const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

export function sendAuthCookie(res, userId) {
    const token = generateToken(userId);
    res.cookie('token', token, COOKIE_OPTIONS);

    return token;
}

export function clearAuthCookie(res) {
    res.clearCookie('token', COOKIE_OPTIONS);
}