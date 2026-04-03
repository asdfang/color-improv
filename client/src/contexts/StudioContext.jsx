/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { AudioEngine } from '../audio/AudioEngine';
import { TimingEngine } from '../timing/TimingEngine';
import { RecordingEngine } from '../recording/RecordingEngine';
import { NoteLogger } from '../events/NoteLogger';
import { KeyboardHandler } from '../input/KeyboardHandler';

export const StudioContext = createContext(null);

// This provider initializes the core studio components and provides them via context.
export function StudioProvider({ children }) {
    const [studio] = useState(() => {
        const backingTrack = 'blues'; // TODO: Extract to config/preference manager
        const audioEngine = new AudioEngine();
        const timingEngine = new TimingEngine(audioEngine, backingTrack);
        const recordingEngine = new RecordingEngine(audioEngine.audioContext);
        audioEngine.connectMainToExternalNode(recordingEngine.getMediaStreamDestinationNode());
        const noteLogger = new NoteLogger(timingEngine);
        const keyboardHandler = new KeyboardHandler(audioEngine);

        return {
            audioEngine,
            timingEngine,
            recordingEngine,
            noteLogger,
            keyboardHandler,
        };
    })

    return (
        <StudioContext value={studio}>
            {children}
        </StudioContext>
    );
}

export function useStudio() {
    return useContext(StudioContext);
}

StudioProvider.propTypes = {
    children: PropTypes.node.isRequired,
};