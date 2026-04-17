import { VolumePanel } from './VolumePanel';
import { PlaybackControls } from './PlaybackControls';
import { SettingsPanel } from './SettingsPanel';
import { HamburgerMenu } from './HamburgerMenu';
import { useMediaQuery } from '/src/hooks/useMediaQuery';

export function TopPanel() {
    const showMenuOnMobile = useMediaQuery('(orientation: landscape) and (max-height: 500px) and (hover: none)');

    return (
        <div id="top-panel">
            {!showMenuOnMobile && <VolumePanel />}
            <PlaybackControls />
            {!showMenuOnMobile && <SettingsPanel />}
            {showMenuOnMobile && <HamburgerMenu />}
        </div>
    );
}