import { useState, useRef } from 'react';
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
    const dialogRef = useRef(/** @type { { shake: () => void } | null } */ (null));

    /** @param {import('react').FormEvent<HTMLFormElement>} e */
    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (openToRegister) await onRegister(email, name, password);
            else await onLogin(email, password);
            setEmail('');
            setName('');
            setPassword('');
            setFeedback('');
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
            dialogRef.current?.shake();
        }
    }

    const handleClose = () => {
        setPassword('');
        setFeedback('');
        onClose();
    }

    const footer = (
        <button
            className="toggle-auth-link"
            onClick={() => {
                setOpenToRegister(!openToRegister);
                setFeedback('');
            }}
        >
            {openToRegister ? 'Already have an account? Login here.' : "Don't have an account? Register here."}
        </button>
    );

    return (
        <Dialog
            ref={dialogRef}
            id="auth-dialog"
            className="auth-dialog"
            isOpen={isOpen}
            onClose={handleClose}
            title={openToRegister ? 'Register' : 'Login'}
            closeOnBackdrop={true}
            footer={footer}
        >
            <form className="auth-form" onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        id="email"
                        type="email"
                        value={email}
                        autoComplete="email"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                {openToRegister && (
                    <div className="form-group">
                        <label htmlFor="name">Name:</label>
                        <input
                            id="name"
                            type="text"
                            value={name}
                            autoComplete="name"
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>
                )}
                <div className="form-group">
                    <label htmlFor="password">Password:</label>
                    <input
                        id="password"
                        type="password"
                        value={password}
                        autoComplete={openToRegister ? 'new-password' : 'current-password'}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                {feedback && <div className="auth-feedback" role="alert">{feedback}</div>}
                <button type="submit" className="btn-text">{openToRegister ? 'Register' : 'Login'}</button>
            </form>
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