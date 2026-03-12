/**
 * Utility functions for validating and sanitizing request body inputs.
 * Validators return { valid, error, data }
 */

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function validateRequiredString(input, fieldName, minLength = 1) {
    if (typeof input !== 'string') {
        return { valid: false, error: `${fieldName} is required` };
    }
    if (input.trim().length < minLength) {
        return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }
    return { valid: true, data: input.trim() };
}

export function validateEmail(input) {
    const stringResult = validateRequiredString(input, 'Email');
    if (!stringResult.valid) return stringResult;

    const email = stringResult.data;
    const emailRegex = /^[^@]+@[^.]+\..+$/; // Finds @ followed by . later in the string
    if (!emailRegex.test(email)) {
        return { valid: false, error: 'Invalid email format' };
    }

    return { valid: true, data: email };
}

export function validateDifficulty(input) {
    if (input === undefined) return { valid: true, data: undefined }; // Optional field
    const valid = ['EASY', 'MEDIUM', 'HARD'];
    if (!valid.includes(input)) {
        return { valid: false, error: `Invalid difficulty value: ${input}. Must be ${valid.join(', ')}` };
    }

    return { valid: true, data: input };
}

export function validateVolume(input) {
    if (input === undefined) return { valid: true, data: undefined }; // Optional field
    if (typeof input !== 'number' || isNaN(input)) {
        return { valid: false, error: `Invalid volume value: ${input}. Must be a number between 0 and 1.` };
    }

    return { valid: true, data: clamp(input, 0, 1) };
}

export function validateBoolean(input, fieldName) {
    if (input === undefined) return { valid: true, data: undefined }; // Optional field
    if (typeof input !== 'boolean') {
        return { valid: false, error: `${fieldName} must be true or false.` };
    }
    return { valid: true, data: input };
}

export function validateRegisterBody({ email, name, password } = {}) {
    const emailResult = validateEmail(email);
    if (!emailResult.valid) return emailResult;

    const nameResult = validateRequiredString(name, 'Name');
    if (!nameResult.valid) return nameResult;

    const passwordResult = validateRequiredString(password, 'Password', 6);
    if (!passwordResult.valid) return passwordResult;

    return {
        valid: true,
        data: {
            email: emailResult.data,
            name: nameResult.data,
            password: passwordResult.data
        }
    };
}

export function validateLoginBody({ email, password } = {}) {
    const emailResult = validateEmail(email);
    if (!emailResult.valid) return emailResult;

    const passwordResult = validateRequiredString(password, 'Password', 6);
    if (!passwordResult.valid) return passwordResult;

    return {
        valid: true,
        data: {
            email: emailResult.data,
            password: passwordResult.data
        }
    };
}

export function validatePreferencesBody({ difficulty, backingTrackVolume, samplesVolume, backingTrackMuted, samplesMuted } = {}) {
    const difficultyResult = validateDifficulty(difficulty);
    if (!difficultyResult.valid) return difficultyResult;

    const backingTrackVolumeResult = validateVolume(backingTrackVolume);
    if (!backingTrackVolumeResult.valid) return backingTrackVolumeResult;

    const samplesVolumeResult = validateVolume(samplesVolume);
    if (!samplesVolumeResult.valid) return samplesVolumeResult;

    const backingTrackMutedResult = validateBoolean(backingTrackMuted, 'backingTrackMuted');
    if (!backingTrackMutedResult.valid) return backingTrackMutedResult;

    const samplesMutedResult = validateBoolean(samplesMuted, 'samplesMuted');
    if (!samplesMutedResult.valid) return samplesMutedResult;

    return {
        valid: true,
        data: {
            difficulty: difficultyResult.data,
            backingTrackVolume: backingTrackVolumeResult.data,
            samplesVolume: samplesVolumeResult.data,
            backingTrackMuted: backingTrackMutedResult.data,
            samplesMuted: samplesMutedResult.data,
        }
    };
}
