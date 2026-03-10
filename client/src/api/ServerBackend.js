export class ServerBackend {
    async load() {
        const response = await fetch('/api/preferences', {
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();

        return data.preferences;
    }

    async save(preferences) {
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

        return data.preferences;
    }
}