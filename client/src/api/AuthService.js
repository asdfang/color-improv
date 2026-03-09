export class AuthService {
    async register(email, name, password) {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, name, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Registration failed');
        }

        const data = await response.json();
        return data;
    }

    async login(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Login failed');
        }

        const data = await response.json();
        return data;
    }

    async logout() {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include',
        });
    }

    async getCurrentUser() {
        const response = await fetch('/api/auth/user', {
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.user;
    }
}