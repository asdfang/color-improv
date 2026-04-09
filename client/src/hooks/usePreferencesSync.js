import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { ServerBackend } from '../api/ServerBackend';
/** @typedef {import('/src/constants.js').UserPreferences} UserPreferences */

/**
 * Hook for synchronizing preferences between localStorage and server.
 * On login, checks for conflicts and provides handlers to resolve them.
 */
export function usePreferencesSync() {
    const { currentUser, register, login } = useAuth();
    const { preferences, applyAllPreferences } = usePreferences();
    const [conflictingServerPreferences, setConflictingServerPreferences] = useState(/** @type {UserPreferences | null} */ (null));
    const hasConflict = conflictingServerPreferences !== null;
    const [serverBackend] = useState(() => new ServerBackend());

    // When preferences change and user is logged in, debounced save to server.
    useEffect(() => {
        if (!currentUser) return;
        const timeoutID = setTimeout(() => {
            serverBackend.save(preferences).catch(console.warn);
        }, 2000);
        return () => clearTimeout(timeoutID);
    }, [preferences, currentUser, serverBackend]);

    /**
     * On register, logs in and saves local preferences to server
     * @param {string} email 
     * @param {string} name 
     * @param {string} password 
     */
    const registerWithSync = async (email, name, password) => {
        await register(email, name, password);
        await serverBackend.save(preferences).catch(console.warn);
    };

    /**
     * On login, checks for conflicts between local and server preferences.
     * Notify external component if conflict exists, save the preferences that user chooses.
     * @param {*} email 
     * @param {*} password 
     */
    const loginWithSync = async (email, password) => {
        await login(email, password);
        const serverPreferences = await serverBackend.load().catch(console.warn);
        if (!serverPreferences) return;

        const serverPreferenceKeys = /** @type {Array<keyof UserPreferences>} */ (Object.keys(serverPreferences));
        if (!serverPreferenceKeys.every(key => serverPreferences[key] === preferences[key])) {
            setConflictingServerPreferences(serverPreferences);
        }
    };

    // Handler for choosing local preferences: overwrite server preferences with local.
    const onChooseLocal = () => {
        serverBackend.save(preferences).catch(console.warn);
        setConflictingServerPreferences(null);
    }

    // Handler for choosing server preferences: overwrite local preferences with server and apply.
    const onChooseServer = () => {
        if (!conflictingServerPreferences) return;
        applyAllPreferences(conflictingServerPreferences);
        setConflictingServerPreferences(null);
    }

    return { registerWithSync, loginWithSync, hasConflict, onChooseLocal, onChooseServer };
}