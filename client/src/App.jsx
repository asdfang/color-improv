import { useAuth } from './contexts/AuthContext';
import { usePreferences } from './contexts/PreferencesContext';
import { usePreferenceSync } from './hooks/usePreferenceSync';

export default function App() {
    const {
        registerWithSync, loginWithSync, hasConflict,
        onChooseLocal, onChooseServer,
    } = usePreferenceSync();
    const { logout } = useAuth();

    // testing
    const { currentUser } = useAuth();
    const { preferences } = usePreferences();


    return (
        <div id="app">
            <p>React is working!</p>
            <p>Current Preferences: {JSON.stringify(preferences)}</p>
            <p>Current User: {currentUser ? currentUser.email : 'Not logged in'}</p>
        </div>
    );
}