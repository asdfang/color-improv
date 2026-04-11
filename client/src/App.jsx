import { useEffect } from 'react';
import { useAuth } from './contexts/AuthContext';
import { usePlayback } from './contexts/PlaybackContext';
import { usePreferences } from './contexts/PreferencesContext';
import { useStudio } from './contexts/StudioContext';
import { usePreferencesSync } from './hooks/usePreferencesSync';
import { VolumeControl } from './components/controls/VolumeControl'; // TODO: extract to TopPanel
import { PlaybackControls } from './components/controls/PlaybackControls'; // TODO: extract to TopPanel
import { Grid } from './components/grid/Grid';

export default function App() {
    const { audioEngine, timingEngine, recordingEngine, noteLogger, keyboardHandler } = useStudio();
    const { playbackState, isRecording, recordingResult, play, pause, resume, stop, record, clearRecordingResult } = usePlayback();
    const {
        registerWithSync, loginWithSync, hasConflict,
        onChooseLocal, onChooseServer,
    } = usePreferencesSync();
    const { logout } = useAuth();

    // testing
    const { currentUser } = useAuth();
    const { preferences } = usePreferences();

    // Sync audio engine settings with preferences
    useEffect(() => {
        audioEngine.setBackingTrackVolume(preferences.backingTrackVolume);
        audioEngine.setSamplesVolume(preferences.samplesVolume);
        audioEngine.setBackingTrackMuted(preferences.backingTrackMuted);
        audioEngine.setSamplesMuted(preferences.samplesMuted);
    }, [audioEngine, preferences.backingTrackVolume, preferences.samplesVolume, preferences.backingTrackMuted, preferences.samplesMuted]);

    return (
        <div id="app">
            <div id="top-panel">
                <div id="volume-controls">
                    <VolumeControl source="backingTrack" />
                    <VolumeControl source="samples" />
                </div>
                <PlaybackControls />
            </div>
            <Grid />
        </div>
    );
}