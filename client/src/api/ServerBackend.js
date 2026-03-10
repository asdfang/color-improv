export class ServerBackend {
    async load() {
        const response = await fetch('/api/preferences', {
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        data.preferences.difficulty = data.preferences.difficulty.toLowerCase();
        console.log('Preferences loaded from server:', data.preferences); // Debug log

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
        console.log('Preferences saved to server:', data.preferences); // Debug log

        return data.preferences;
    }
}