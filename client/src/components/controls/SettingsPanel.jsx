import { AuthControls } from './AuthControls';
import { InstructionsButton } from './InstructionsButton';
import { DifficultySelect } from './DifficultySelect';

export function SettingsPanel() {
    return (
        <div id="settings-panel">
            <AuthControls />
            <InstructionsButton />
            <DifficultySelect />
        </div>
    );
}