import { useState } from 'react';
import { Dialog } from './Dialog';
import PropTypes from 'prop-types';

/**
 * @param {{
 *     isOpen: boolean,
 *     onClose: () => void,
 *     openToRegister: boolean,
 *     setOpenToRegister: (open: boolean) => void,
 *     onLogin: (email: string, password: string) => Promise<void>,
 *     onRegister: (email: string, name: string, password: string) => Promise<void>
 * }} props
 */
export function AuthDialog({ isOpen, onClose, openToRegister, setOpenToRegister, onLogin, onRegister }) {
    const [email, setEmail] = useState('');
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [feedback, setFeedback] = useState('');

    /** @param {import('react').FormEvent<HTMLFormElement>} e */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (openToRegister) await onRegister(email, name, password);
            else await onLogin(email, password);
            onClose();
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Authentication failed';
            const errorCode = error && typeof error === 'object' && 'code' in error
                ? error.code
                : null;

            if (errorCode === 'EMAIL_TAKEN' || /email already registered/i.test(message)) {
                setFeedback('Email already registered. Try logging in.');
            } else if (errorCode === 'INVALID_CREDENTIALS' || /invalid email or password/i.test(message)) {
                setFeedback('Invalid email or password.');
            } else {
                setFeedback(message);
            }
        }
    }

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title={openToRegister ? 'Register' : 'Login'}
            closeOnBackdrop={true}
        >
            <form className="auth-form" onSubmit={handleSubmit}>
                <label>
                    Email:
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </label>
                {openToRegister && (
                    <label>
                        Name:
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </label>
                )}
                <label>
                    Password:
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </label>
                {feedback && <div className="auth-feedback">{feedback}</div>}
                <button type="submit" className="btn">{openToRegister ? 'Register' : 'Login'}</button>
            </form>
            <button
                className="toggle-auth-btn"
                onClick={() => {
                    setOpenToRegister(!openToRegister);
                    setFeedback('');
                }}
            >
                {openToRegister ? 'Already have an account? Login here.' : "Don't have an account? Register here."}
            </button>
        </Dialog>
    );
}

AuthDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    openToRegister: PropTypes.bool.isRequired,
    setOpenToRegister: PropTypes.func.isRequired,
    onLogin: PropTypes.func.isRequired,
    onRegister: PropTypes.func.isRequired,
};