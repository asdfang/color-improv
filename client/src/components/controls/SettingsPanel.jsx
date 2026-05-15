import { useAuth } from '../../contexts/AuthContext';
import { AuthControls } from './AuthControls';
import { InstructionsButton } from './InstructionsButton';
import { DifficultySelect } from './DifficultySelect';
import { LibraryDrawer } from './drawers/LibraryDrawer';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export function SettingsPanel() {
    const { currentUser } = useAuth();
    const showMenuOnMobile = useMediaQuery('(orientation: landscape) and (max-height: 500px) and (hover: none)');
    
    return (
        <div className="settings-panel">
            <div className="settings-top-row">
                {currentUser && !showMenuOnMobile && <LibraryDrawer />}
                <AuthControls />
            </div>
            <InstructionsButton />
            <DifficultySelect />
        </div>
    );
}