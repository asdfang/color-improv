/**
 * Utility functions for loading environment variables from .env and validating them.
 */
export function requireEnv(name) {
    const value = process.env[name];
    if (value === undefined || value === null || value.trim() === '') {
        throw new Error(`Missing required environment variable: ${name}`);
    }

    return value.trim();
}