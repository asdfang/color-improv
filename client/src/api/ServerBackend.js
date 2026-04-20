/** @typedef {import('../constants').UserPreferences} UserPreferences */

export class ServerBackend {
    /**
     * @returns {Promise<UserPreferences | null>}
     */
    async load() {
        const response = await fetch('/api/preferences', {
            credentials: 'include',
        });

        if (response.status === 401) return null; // Not logged in
        if (!response.ok) {
            throw new Error('Failed to load preferences');
        }

        const data = await response.json();
        data.preferences.difficulty = data.preferences.difficulty.toLowerCase();

        return data.preferences;
    }

    /**
     * @param {UserPreferences} preferences
     * @returns {Promise<UserPreferences>}
     */
    async save(preferences) {
        const payload = {
            ...preferences,
            difficulty: preferences.difficulty.toUpperCase(),
        };

        const response = await fetch('/api/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            throw new Error('Failed to save preferences');
        }

        const data = await response.json();
        data.preferences.difficulty = data.preferences.difficulty.toLowerCase();

        return data.preferences;
    }
}