import { VolumePanel } from './VolumePanel';
import { PlaybackControls } from './PlaybackControls';
import { SettingsPanel } from './SettingsPanel';

export function TopPanel() {
    return (
        <div id="top-panel">
            <VolumePanel />
            <PlaybackControls />
            <SettingsPanel />
        </div>
    );
}