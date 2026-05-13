import { useAuth } from '../../contexts/AuthContext';
import { AuthControls } from './AuthControls';
import { InstructionsButton } from './InstructionsButton';
import { DifficultySelect } from './DifficultySelect';
import { LibraryButton } from './LibraryButton';

export function SettingsPanel() {
    const { currentUser } = useAuth();
    return (
        <div className="settings-panel">
            {currentUser && <LibraryButton />}
            <AuthControls />
            <InstructionsButton />
            <DifficultySelect />
        </div>
    );
}