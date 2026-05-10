/**
 * Utility functions for validating and sanitizing request body inputs.
 * Validators return { valid, error, data }
 * Note: some constraints are hardcoded for now.
 */

function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
}

export function validateRequiredString(input, fieldName, minLength = 1, maxLength = 100) {
    if (minLength < 1) {
        throw new Error('minLength must be at least 1 for required strings');
    }
    if (typeof input !== 'string') {
        return { valid: false, error: `${fieldName} is required` };
    }
    if (input.trim().length < minLength) {
        return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }
    if (input.trim().length > maxLength) {
        return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
    }
    return { valid: true, data: input.trim() };
}

export function validateOptionalString(input, fieldName, minLength = 0, maxLength = 100) {
    if (input === undefined || input === '') {
        return { valid: true, data: undefined };
    }
    if (typeof input !== 'string') {
        return { valid: false, error: `${fieldName} must be a string` };
    }
    const trimmed = input.trim();
    if (trimmed === '') {
        return { valid: true, data: undefined };
    }
    if (trimmed.length < minLength) {
        return { valid: false, error: `${fieldName} must be at least ${minLength} characters` };
    }
    if (trimmed.length > maxLength) {
        return { valid: false, error: `${fieldName} must be at most ${maxLength} characters` };
    }
    return { valid: true, data: trimmed };
}

// Email is always required
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

// Returns valid with undefined 'data' property when title is absent, only checks when value is provided.
export function validateTitle(title) {
    return validateOptionalString(title, 'Title', 1, 100);
}

// Returns valid with undefined 'data' property when notes is absent, only checks when value is provided.
export function validateNotes(notes) {
    return validateOptionalString(notes, 'Notes', 0, 500);
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

/**
 * Validates recording metadata for creation. Title and duration are required, notes is optional.
 * @param {{title: string, notes: string, durationSeconds: number}}
 * @returns 
 */
export function validateRecordingMetadataOnCreate({ title, notes, durationSeconds } = {}) {
    const titleResult = validateTitle(title);
    if (!titleResult.valid) return titleResult;
    if (titleResult.data === undefined) {
        return { valid: false, error: 'Title is required' };
    }

    const notesResult = validateNotes(notes);
    if (!notesResult.valid) return notesResult;

    if (durationSeconds === undefined || durationSeconds === '') {
        return { valid: false, error: 'Duration is required' };
    }
    const duration = Number(durationSeconds); // Convert multer string to number
    if (!Number.isFinite(duration) || duration < 0) {
        return { valid: false, error: 'Duration must be a non-negative number' };
    }

    return {
        valid: true,
        data: {
            title: titleResult.data,
            notes: notesResult.data,
            durationSeconds: duration, // Keep as number
        }
    };
}

/**
 * Validates recording metadata for updates. At least one of title or notes must be provided.
 * @param {{title: string, notes: string}}
 * @returns 
 */
export function validateRecordingMetadataOnUpdate({ title, notes } = {}) {
    const titleResult = validateTitle(title);
    if (!titleResult.valid) return titleResult;

    const notesResult = validateNotes(notes);
    if (!notesResult.valid) return notesResult;

    if (titleResult.data === undefined && notesResult.data === undefined) {
        return { valid: false, error: 'At least one of title or notes must be provided' };
    }

    return {
        valid: true,
        data: {
            title: titleResult.data,
            notes: notesResult.data,
        }
    };
}