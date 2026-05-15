import { VolumePanel } from './VolumePanel';
import { PlaybackControls } from './PlaybackControls';
import { SettingsPanel } from './SettingsPanel';
import { MobileDrawer } from './drawers/MobileDrawer';
import { useMediaQuery } from '../../hooks/useMediaQuery';

export function TopPanel() {
    const showMenuOnMobile = useMediaQuery('(orientation: landscape) and (max-height: 500px) and (hover: none)');

    return (
        <div className="top-panel">
            {!showMenuOnMobile && <VolumePanel />}
            <PlaybackControls />
            {!showMenuOnMobile && <SettingsPanel />}
            {showMenuOnMobile && <MobileDrawer />}
        </div>
    );
}