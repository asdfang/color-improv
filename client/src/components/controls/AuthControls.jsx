import { useAuth } from '/src/contexts/AuthContext';

export function AuthControls() {
    const { currentUser, logout } = useAuth();
    const isLoggedIn = currentUser !== null;

    const handleRegister = () => {
        console.log('Todo: open register auth dialog');
    };

    const handleLogin = () => {
        console.log('Todo: open login auth dialog');
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
        </div>
    );
}