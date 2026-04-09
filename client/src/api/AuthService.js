class AuthApiError extends Error {
    /**
     * @param {string} message 
     * @param {string} code 
     * @param {number} status 
     */
    constructor(message, code, status) {
        super(message);
        this.name = 'AuthApiError';
        this.code = code;
        this.status = status;
    }
}

export class AuthService {
    /**
     * @param {any} data 
     * @param {string} fallbackMessage 
     * @param {number} status 
     * @returns {AuthApiError}
     */
    buildAuthError(data, fallbackMessage, status) {
        const code = data?.error?.code || data?.code;
        const message = data?.error?.message || data?.error || data?.message || fallbackMessage;
        return new AuthApiError(message, code, status);
    }

    /**
     * @param {string} email 
     * @param {string} name 
     * @param {string} password 
     * @returns {Promise<any>}
     */
    async register(email, name, password) {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, name, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw this.buildAuthError(data, 'Registration failed', response.status);
        }

        const data = await response.json();
        return data;
    }

    /**
     * @param {string} email 
     * @param {string} password 
     * @returns {Promise<any>}
     */
    async login(email, password) {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
        });

        if (!response.ok) {
            const data = await response.json();
            throw this.buildAuthError(data, 'Login failed', response.status);
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

    /**
     * @returns {Promise<any>}
     */
    async getCurrentUser() {
        const response = await fetch('/api/auth/me', {
            credentials: 'include',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data.user;
    }
}