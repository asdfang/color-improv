import { useState } from 'react';
import { usePreferencesSync } from '../../hooks/usePreferencesSync';
import { useAuth } from '../../contexts/AuthContext';
import { AuthDialog } from '../dialogs/AuthDialog';
import { ConflictDialog } from '../dialogs/ConflictDialog';

export function AuthControls() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [openToRegister, setOpenToRegister] = useState(true);
    const {
        registerWithSync,loginWithSync,
        hasConflict, onChooseLocal, onChooseServer } = usePreferencesSync();
    const { currentUser, logout } = useAuth();
    const isLoggedIn = currentUser !== null;

    const handleRegister = () => {
        setOpenToRegister(true);
        setIsDialogOpen(true);
    };

    const handleLogin = () => {
        setOpenToRegister(false);
        setIsDialogOpen(true);
    }

    return (
        <div id="auth-controls">
            {isLoggedIn ? (
                <button className="btn-text" onClick={logout}>Logout</button>
            ) : (
                <>
                    <button className="btn-text" onClick={handleRegister}>Register</button>
                    <button className="btn-text" onClick={handleLogin}>Login</button>
                </>
            )}
            <AuthDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                openToRegister={openToRegister}
                setOpenToRegister={setOpenToRegister}
                onLogin={loginWithSync}
                onRegister={registerWithSync}
            />
            <ConflictDialog
                isOpen={hasConflict}
                onClose={() => {}}
                onChooseLocal={onChooseLocal}
                onChooseServer={onChooseServer}
            />
        </div>
    );
}