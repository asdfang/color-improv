/**
 * PreferencesManager class handles loading, validating, and saving user preferences with debouncing to optimize storage writes.
 * It uses a provided storage backend (like LocalStorageBackend) to persist preferences across sessions.
 * The schema defines expected keys and validation logic for each preference.
 */

import { PREFERENCE_DEFAULTS } from "/src/constants.js";

export class PreferencesManager {
    constructor(storageBackend) {
        this.schema = {
            difficulty: (d) => ['easy', 'medium', 'hard'].includes(d) ? d : undefined,
            backingTrackVolume: (vol) => this.isNumberInRange(vol, 0, 1) ? vol : undefined,
            samplesVolume: (vol) => this.isNumberInRange(vol, 0, 1) ? vol : undefined,
            backingTrackMuted: (bool) => typeof bool === 'boolean' ? bool : undefined,
            samplesMuted: (bool) => typeof bool === 'boolean' ? bool : undefined,
        }
        
        this.storageBackend = storageBackend;
        this.preferences = this.load();
        this.persistTimerId = null;
    }

    /**
     * Loads preferences from storage, sanitizes them, and merges with defaults.
     * @returns {object} the merged preferences object
     */
    load() {
        const loadedData = this.storageBackend.load();
        const sanitizedData = this.sanitizeObject(loadedData, this.schema);
        return { ...PREFERENCE_DEFAULTS, ...sanitizedData };
    }

    /**
     * @param {string} key 
     * @returns
     */
    get(key) {
        return key in this.preferences ? this.preferences[key] : undefined;
    }

    /**
     * Returns a copy to prevent external mutation.
     * @returns {object} a copy of the preferences object
     */
    getAll() {
        return  { ...this.preferences };
    }

    /**
     * Validates and sets a preference key-value pair, then persists to storage with debouncing.
     * @param {*} key valid key in schema
     * @param {*} value valid value according to schema
     * @returns validated value if successful, otherwise undefined
     */
    set(key, value) {
        if (!(key in this.schema)) return undefined;
        const validatedValue = this.schema[key](value);
        if (validatedValue === undefined) return undefined;
        this.preferences[key] = validatedValue;

        // Debounce saving by 500ms to avoid excessive writes
        if (this.persistTimerId) clearTimeout(this.persistTimerId);

        this.persistTimerId = setTimeout(() => {
            this.storageBackend.save(this.preferences);
            this.persistTimerId = null;
        }, 500);

        return validatedValue;
    }

    /**
     * @param {object} input object to be sanitized
     * @param {object} schema object of validator functions
     * @returns {object} sanitized object, or undefined if nothing was valid
     */
    sanitizeObject(input, schema) {
        console.log('Sanitizing input:', input);
        if (typeof input !== 'object' || input === null) return undefined;

        const result = {};

        for (const [key, validator] of Object.entries(schema)) {
            if (!(key in input)) continue;

            const validatedValue = validator(input[key]);
            if (validatedValue !== undefined) {
                result[key] = validatedValue;
            }
        }

        return Object.keys(result).length ? result : undefined;
    }

    /**
     * @param {number} input
     * @param {number} min 
     * @param {number} max 
     * @returns true if input is number between min and max (inclusive), otherwise false
     */
    isNumberInRange(input, min, max) {
        return typeof input === 'number' && Number.isFinite(input) && input >= min && input <= max;
    }
}