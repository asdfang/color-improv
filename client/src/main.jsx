import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { StudioProvider } from './contexts/StudioContext';
import { PlaybackProvider } from './contexts/PlaybackContext';
import { PreferencesProvider } from './contexts/PreferencesContext';
import { AuthProvider } from './contexts/AuthContext';

import './styles/base.css';
import './styles/controls.css';
import './styles/grid.css';
import './styles/dialogs.css';

const domNode = document.getElementById('root');
const root = createRoot(domNode);

root.render(
    <StrictMode>
        <StudioProvider>
            <AuthProvider>
                <PreferencesProvider>
                    <PlaybackProvider>
                        <App />
                    </PlaybackProvider> 
                </PreferencesProvider>
            </AuthProvider>
        </StudioProvider>
    </StrictMode>
);