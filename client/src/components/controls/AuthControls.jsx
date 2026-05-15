import { useState } from 'react';
import { usePreferencesSync } from '../../hooks/usePreferencesSync';
import { useAuth } from '../../contexts/AuthContext';
import { AuthDialog } from '../dialogs/AuthDialog';
import { ConflictDialog } from '../dialogs/ConflictDialog';

export function AuthControls() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [openToRegister, setOpenToRegister] = useState(true);
    const [prefillDemo, setPrefillDemo] = useState(false);
    const {
        registerWithSync,loginWithSync,
        hasConflict, onChooseLocal, onChooseServer } = usePreferencesSync();
    const { currentUser, logout } = useAuth();
    const isLoggedIn = currentUser !== null;

    const handleDemo = () => {
        setPrefillDemo(true);
        setOpenToRegister(false);
        setIsDialogOpen(true);
    };

    const handleRegister = () => {
        setPrefillDemo(false);
        setOpenToRegister(true);
        setIsDialogOpen(true);
    };

    const handleLogin = () => {
        setPrefillDemo(false);
        setOpenToRegister(false);
        setIsDialogOpen(true);
    }

    return (
        <div className="auth-controls">
            {isLoggedIn ? (
                <button className="btn-text" onClick={logout}>Logout</button>
            ) : (
                <>
                    <button className="btn-text" onClick={handleDemo}>Use Demo Account</button>
                    <button className="btn-text" onClick={handleRegister}>Register</button>
                    <button className="btn-text" onClick={handleLogin}>Login</button>
                </>
            )}
            <AuthDialog
                key={prefillDemo ? 'demo' : 'normal'}
                isOpen={isDialogOpen}
                onClose={() => { setIsDialogOpen(false); setPrefillDemo(false); }}
                openToRegister={openToRegister}
                setOpenToRegister={setOpenToRegister}
                onLogin={loginWithSync}
                onRegister={registerWithSync}
                prefillDemo={prefillDemo}
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