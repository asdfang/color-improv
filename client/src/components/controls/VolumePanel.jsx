import { useEffect } from 'react';
import { useStudio } from '../../contexts/StudioContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { VolumeControl } from './VolumeControl';

export function VolumePanel() {
    const { audioEngine } = useStudio();
    const { preferences } = usePreferences();

    // Sync audio engine settings with preferences
    useEffect(() => {
        audioEngine.setBackingTrackVolume(preferences.backingTrackVolume);
        audioEngine.setSamplesVolume(preferences.samplesVolume);
        audioEngine.setBackingTrackMuted(preferences.backingTrackMuted);
        audioEngine.setSamplesMuted(preferences.samplesMuted);
    }, [audioEngine, preferences.backingTrackVolume, preferences.samplesVolume, preferences.backingTrackMuted, preferences.samplesMuted]);

    return (
        <div className="volume-panel">
            <VolumeControl source="backingTrack" />
            <VolumeControl source="samples" />
        </div>
    );
}