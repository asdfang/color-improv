export class ServerBackend {
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

    async save(preferences) {
        preferences.difficulty = preferences.difficulty.toUpperCase();
        const response = await fetch('/api/preferences', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify(preferences),
        });

        if (!response.ok) {
            throw new Error('Failed to save preferences');
        }

        const data = await response.json();
        data.preferences.difficulty = data.preferences.difficulty.toLowerCase();

        return data.preferences;
    }
}