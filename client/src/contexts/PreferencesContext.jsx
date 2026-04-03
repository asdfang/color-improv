/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { PREFERENCE_DEFAULTS, SCHEMA } from "../constants";

const STORAGE_KEY = 'color-improv:prefs';

export const PreferencesContext = createContext(null);

export function PreferencesProvider({ children }) {
    const [preferences, setPreferences] = useState(loadFromLocalStorage);

    // Debounced save to localStorage
    useEffect(() => {
        const timeoutID = setTimeout(() => {
            saveToLocalStorage(preferences);
        }, 500);

        return () => clearTimeout(timeoutID);
    }, [preferences]);

    const setPreference = (key, value) => {
        const validatedValue = key in SCHEMA
            ? SCHEMA[key](value)
            : undefined;
        
        if (validatedValue !== undefined) {
            setPreferences(prev => ({ ...prev, [key]: validatedValue}));
        }
    }

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
    return useContext(PreferencesContext);
}

/**
 * Validates untrusted data (e.g. from localStorage).
 * Sanitized result can be merged with defaults for a complete preferences object:
 * { ...PREFERENCE_DEFAULTS, ...sanitizeObject(input, SCHEMA) }
 * @param {object} input object to be sanitized
 * @param {object} schema object of validator functions
 * @returns {object} sanitized object, or undefined if nothing was valid
 */
function sanitizeObject(input, schema) {
    if (typeof input !== 'object' || input === null) return undefined;
    
    const result = {};
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
 * @returns {object} the merged preferences object, or an empty object if not found or on error
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
 * @param {object} data 
 * @returns saved data if successful, otherwise undefined
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