/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { AudioEngine } from '../audio/AudioEngine';
import { TimingEngine } from '../timing/TimingEngine';
import { RecordingEngine } from '../recording/RecordingEngine';
import { NoteLogger } from '../events/NoteLogger';
import { KeyboardHandler } from '../input/KeyboardHandler';
/** @typedef {import('/src/constants.js').BackingTrackKey} BackingTrackKey */

/**
 * @typedef {{
 *    audioEngine: AudioEngine,
 *    timingEngine: TimingEngine,
 *    recordingEngine: RecordingEngine,
 *    noteLogger: NoteLogger,
 *    keyboardHandler: KeyboardHandler,
 *    backingTrack: BackingTrackKey
 * }} StudioContextValue
 */
export const StudioContext = createContext( /** @type {StudioContextValue|null} */ (null));

/** 
 * This provider initializes the core studio components and provides them via context.
 * @param {{ children: import('react').ReactNode }} props
 */
export function StudioProvider({ children }) {
    const [studio] = useState(() => {
        const backingTrack = /** @type {BackingTrackKey} */ ('blues'); // TODO: Extract to config/preference manager
        const audioEngine = new AudioEngine(backingTrack);
        audioEngine.createContext();
        audioEngine.setupGainNodes();
        const timingEngine = new TimingEngine(audioEngine, backingTrack);
        // Assert audioContext is not null
        const recordingEngine = new RecordingEngine(/** @type {AudioContext} */ (audioEngine.audioContext));
        audioEngine.connectMainToExternalNode(recordingEngine.getMediaStreamDestinationNode());
        const noteLogger = new NoteLogger(timingEngine);
        const keyboardHandler = new KeyboardHandler(audioEngine);

        return {
            audioEngine,
            timingEngine,
            recordingEngine,
            noteLogger,
            keyboardHandler,
            backingTrack,
        };
    });

    return (                                                                                                                                                            
        <StudioContext value={studio}>
            {children}
        </StudioContext>
    );
}

export function useStudio() {
    const context = useContext(StudioContext);
    if (!context) throw new Error('useStudio must be used within a StudioProvider');
    return context;
}

StudioProvider.propTypes = {
    children: PropTypes.node.isRequired,
};