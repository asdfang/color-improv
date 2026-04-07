/* eslint-disable react-refresh/only-export-components */
import { createContext, useState, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { AuthService } from '../api/AuthService';

/**
 * @typedef {{
 *    currentUser: object|null,
 *    isLoading: boolean,
 *    register: Function,
 *    login: Function,
 *    logout: Function
 * }} AuthContextType
 */
export const AuthContext = createContext(/** @type {AuthContextType | null} */ (null));

/**
 * This provider manages authentication state, including current user info and auth methods.
 * @param {{ children: import('react').ReactNode }} props
 */
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

    /**
     * @param {string} email 
     * @param {string} name 
     * @param {string} password 
     */
    const register = async (email, name, password) => {
        const user = await authService.register(email, name, password);
        setCurrentUser(user);
    };

    /**
     * @param {string} email 
     * @param {string} password 
     */
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
    const context = useContext(AuthContext);
    if (!context) throw new Error('useAuth must be used within an AuthProvider');
    return context;
}

AuthProvider.propTypes = {
    children: PropTypes.node.isRequired,
};