export const ErrorCode = {
    // auth middleware
    UNAUTHENTICATED: 'UNAUTHENTICATED',
    INVALID_TOKEN: 'INVALID_TOKEN',

    // auth routes
    EMAIL_TAKEN: 'EMAIL_TAKEN',
    INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

    // recording routes
    LIBRARY_FULL: 'LIBRARY_FULL',
    NOT_FULL: 'NOT_FULL',
    MISSING_FILES: 'MISSING_FILES',
    RECORDING_NOT_FOUND: 'RECORDING_NOT_FOUND',
    
    // generic
    NOT_FOUND: 'NOT_FOUND',
    VALIDATION_FAILED: 'VALIDATION_FAILED',
    INTERNAL_ERROR: 'INTERNAL_ERROR',
}

export function err(code, message) {
    return { error: { code, message } };
}