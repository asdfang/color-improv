import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePreferences } from '../contexts/PreferencesContext';
import { ServerBackend } from '../api/ServerBackend';
/** @typedef {import('/src/constants.js').UserPreferences} UserPreferences */

/** @typedef {(
 *      { kind: 'idle' }
 *    | { kind: 'checking' }
 *    | { kind: 'conflicted', serverPreferences: UserPreferences }
 *    | { kind: 'ready' }
 * )} SyncStatus
 */

/**
 * Hook for synchronizing preferences between localStorage and server.
 * On login, checks for conflicts and provides handlers to resolve them.
 */
export function usePreferencesSync() {
    const { currentUser, register, login } = useAuth();
    const { preferences, applyAllPreferences } = usePreferences();


    const [syncStatus, setSyncStatus] = useState(/** @type {SyncStatus} */ ({ kind: 'idle' }));
    const [serverBackend] = useState(() => new ServerBackend());

    // When preferences change and user is logged in, debounced save to server.
    useEffect(() => {
        if (!currentUser || syncStatus.kind !== 'ready') return;
        const timeoutID = setTimeout(() => {
            serverBackend.save(preferences).catch(console.warn);
        }, 2000);
        return () => clearTimeout(timeoutID);
    }, [preferences, syncStatus, currentUser, serverBackend]);

    /**
     * On register, logs in and saves local preferences to server
     * @param {string} email 
     * @param {string} name 
     * @param {string} password 
     */
    const registerWithSync = async (email, name, password) => {
        await register(email, name, password);
        await serverBackend.save(preferences).catch(console.warn);
        setSyncStatus({ kind: 'ready' });
    };

    /**
     * On login, checks for conflicts between local and server preferences.
     * Notify external component if conflict exists, save the preferences that user chooses.
     * @param {*} email 
     * @param {*} password 
     */
    const loginWithSync = async (email, password) => {
        setSyncStatus({ kind: 'checking' });
        await login(email, password);
        const serverPreferences = await serverBackend.load().catch(console.warn);
        if (!serverPreferences) {
            setSyncStatus({ kind: 'ready' });
            return;
        }

        const serverPreferenceKeys = /** @type {Array<keyof UserPreferences>} */ (Object.keys(serverPreferences));
        if (!serverPreferenceKeys.every(key => serverPreferences[key] === preferences[key])) {
            setSyncStatus({ kind: 'conflicted', serverPreferences });
        } else {
            setSyncStatus({ kind: 'ready' });
        }
    };

    // Handler for choosing local preferences: overwrite server preferences with local.
    const onChooseLocal = () => {
        serverBackend.save(preferences).catch(console.warn);
        setSyncStatus({ kind: 'ready' });
    }

    // Handler for choosing server preferences: overwrite local preferences with server and apply.
    const onChooseServer = () => {
        if (syncStatus.kind !== 'conflicted') return;
        applyAllPreferences(syncStatus.serverPreferences);
        setSyncStatus({ kind: 'ready' });
    }

    const hasConflict = syncStatus.kind === 'conflicted';

    return { registerWithSync, loginWithSync, hasConflict, onChooseLocal, onChooseServer };
}