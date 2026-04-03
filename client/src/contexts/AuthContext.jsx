/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { AuthService } from '../api/AuthService';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [authService] = useState(() => new AuthService());
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const user = await authService.getCurrentUser();
            if (user) setCurrentUser(user);
            setIsLoading(false);
        };

        checkAuth();
    }, [authService]);

    const register = async (email, name, password) => {
        const user = await authService.register(email, name, password);
        setCurrentUser(user);
    };

    const login = async (email, password) => {
        const user = await authService.login(email, password);
        setCurrentUser(user);
    };

    const logout = async () => {
        await authService.logout();
        setCurrentUser(null);
    };

    return (
        <AuthContext value={{ currentUser, isLoading, register, login, logout }}>
            {children}
        </AuthContext>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};