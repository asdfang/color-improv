/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PREFERENCE_DEFAULTS, SCHEMA } from "../constants";
/** @typedef {import('/src/constants.js').UserPreferences} UserPreferences */

const STORAGE_KEY = 'color-improv:prefs';

/**                                                                                                                                                                                                                             
 * @typedef {{
 *   preferences: UserPreferences,
 *   setPreference: (key: keyof typeof SCHEMA, value: unknown) => void,
 *   applyAllPreferences: (prefs: Partial<UserPreferences>) => void,
 * }} PreferencesContextValue                                                                                         
 */  
export const PreferencesContext = createContext(
    /** @type {PreferencesContextValue | null} */
    (null));                                         

/**
 * This provider manages user preferences, including loading/debounced saving to localStorage and validating input.
 * @param {{ children: import('react').ReactNode }} props
 */
export function PreferencesProvider({ children }) {
    const [preferences, setPreferences] = useState(loadFromLocalStorage);

    // Debounced save to localStorage
    useEffect(() => {
        const timeoutID = setTimeout(() => {
            saveToLocalStorage(preferences);
        }, 500);

        return () => clearTimeout(timeoutID);
    }, [preferences]);

    /** @param {keyof typeof SCHEMA} key @param {any} value */
    const setPreference = (key, value) => {
        const validatedValue = key in SCHEMA
            ? SCHEMA[key](value)
            : undefined;
        
        if (validatedValue !== undefined) {
            setPreferences(prev => ({ ...prev, [key]: validatedValue}));
        }
    }

    /** @param {Partial<UserPreferences>} prefs */
    const applyAllPreferences = (prefs) => {
        const sanitizedData = sanitizeObject(prefs, SCHEMA);
        setPreferences({ ...PREFERENCE_DEFAULTS, ...sanitizedData });
    }

    return (
        <PreferencesContext value={{preferences, setPreference, applyAllPreferences}}>
            {children}
        </PreferencesContext>
    );
}

export function usePreferences() {
    const context = useContext(PreferencesContext);
    if (!context) throw new Error('usePreferences must be used within a PreferencesProvider');
    return context;
}

/**
 * Validates untrusted data (e.g. from localStorage).
 * Sanitized result can be merged with defaults for a complete preferences object:
 * { ...PREFERENCE_DEFAULTS, ...sanitizeObject(input, SCHEMA) }
 * @param {Record<string, any>} input object to be sanitized
 * @param {Record<string, Function>} schema object of validator functions
 * @returns {Record<string, any> | undefined} sanitized object, or undefined if nothing was valid
 */
function sanitizeObject(input, schema) {
    if (typeof input !== 'object' || input === null) return undefined;
    
    const result = /** @type {Record<string, any>} */ ({});
    for (const [key, validator] of Object.entries(schema)) {
        if (!(key in input)) continue;

        const validatedValue = validator(input[key]);
        if (validatedValue !== undefined) {
            result[key] = validatedValue;
        }
    }

    const sanitized = Object.keys(result).length ? result : undefined;

    return sanitized;
}

/**
 * Loads data object from localStorage, parses from JSON, then merges sanitized data with defaults.
 * @returns {UserPreferences} the merged preferences object, or defaults if not found or on error
 */
function loadFromLocalStorage() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    if (storedData) {
        try {
            const parsedData = JSON.parse(storedData);
            const sanitizedData = sanitizeObject(parsedData, SCHEMA);

            return { ...PREFERENCE_DEFAULTS, ...sanitizedData };
        } catch (error) {
            console.error('Error parsing stored preferences:', error);
        }
    }
    return { ...PREFERENCE_DEFAULTS };
}

/**
 * Saves stringified data object to localStorage.
 * @param {UserPreferences} data 
 * @returns {UserPreferences | undefined} saved data if successful, otherwise undefined
 */
function saveToLocalStorage(data) {
    try {
        const jsonData = JSON.stringify(data);
        localStorage.setItem(STORAGE_KEY, jsonData);

        return data;
    } catch (error) {
        console.error('Error saving preferences:', error);
    }
}

PreferencesProvider.propTypes = {
    children: PropTypes.node.isRequired,
};