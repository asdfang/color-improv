import { useAuth } from '../../contexts/AuthContext';
import { AuthControls } from './AuthControls';
import { InstructionsButton } from './InstructionsButton';
import { DifficultySelect } from './DifficultySelect';
import { LibraryDrawer } from './drawers/LibraryDrawer';
import { useMediaQuery } from '/src/hooks/useMediaQuery';

export function SettingsPanel() {
    const { currentUser } = useAuth();
    const showMenuOnMobile = useMediaQuery('(orientation: landscape) and (max-height: 500px) and (hover: none)');
    
    return (
        <div className="settings-panel">
            {currentUser && !showMenuOnMobile && <LibraryDrawer />}
            <AuthControls />
            <InstructionsButton />
            <DifficultySelect />
        </div>
    );
}