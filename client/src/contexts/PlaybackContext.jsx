/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useStudio } from './StudioContext';
import { usePreferences } from './PreferencesContext';
import PropTypes from 'prop-types';
/** @typedef {import('/src/constants.js').BackingTrackKey} BackingTrackKey */
/** @typedef {import('/src/events/NoteLogger.js').NoteLog} NoteLog */

/**
 * @typedef {'playing' | 'paused' | 'stopped'} PlaybackState
 */

/**
 * @typedef {{recordingBlob: Blob, logObject: NoteLog} | null} RecordingResult
 */

/**
 * @typedef {{
 *    playbackState: PlaybackState,
 *    isRecording: boolean,
 *    recordingResult: RecordingResult,
 *    play: () => Promise<void>,
 *    pause: () => void,
 *    resume: () => void,
 *    stop: () => Promise<void>,
 *    record: () => Promise<void>,
 *    clearRecordingResult: () => void,
 * }} PlaybackContextType
 */
export const PlaybackContext = createContext(/** @type {PlaybackContextType | null} */ (null));

/**
 * 
 * @param {{ children: import('react').ReactNode }} props
 */
export function PlaybackProvider({ children }) {
    const [playbackState, setPlaybackState] = useState(/** @type {PlaybackState} */ ('stopped'));
    const [isRecording, setIsRecording] = useState(false);
    const [recordingResult, setRecordingResult] = useState(/** @type {RecordingResult} */ (null));

    const {
        audioEngine,
        timingEngine,
        recordingEngine,
        noteLogger,
        keyboardHandler,
        backingTrack,
    } = useStudio();
    
    const { preferences } = usePreferences();

    const pause = () => {
        audioEngine.pauseBackingTrack();
        audioEngine.stopAllSamples();
        timingEngine.pause();
        keyboardHandler.disable();

        setPlaybackState('paused');
    };

    const resume = () => {
        audioEngine.playBackingTrack();
        timingEngine.resume();
        keyboardHandler.enable();

        setPlaybackState('playing');
    };

    const stop = useCallback(async () => {
        const wasRecording = recordingEngine.isRecordingActive();
        const recordingData = wasRecording
            ? {
                recordingPromise: recordingEngine.stop(),
                logObject: noteLogger.stop(),
            }
            : null;
        audioEngine.stopAllSound();
        timingEngine.stop();
        keyboardHandler.disable();

        setIsRecording(false);
        setPlaybackState('stopped');

        if (recordingData) {
            try {
                const recordingBlob = await recordingData.recordingPromise;
                if (recordingBlob) {
                    setRecordingResult({
                        recordingBlob,
                        logObject: recordingData.logObject,
                    });
                } else {
                    console.error('Recording failed: No audio blob returned');
                }
            } catch (error) {
                console.error('Recording failed:', error);

            }
        }
    }, [recordingEngine, noteLogger, audioEngine, timingEngine, keyboardHandler]);

    const play = async () => {
        try {
            if (!audioEngine.isReady()) {
                await audioEngine.initialize();
            }
            audioEngine.playBackingTrack();
            timingEngine.start();
            keyboardHandler.enable();

            setPlaybackState('playing');
        } catch (error) {
            console.error('Failed to play:', error);

            await stop();
        }
    };

    const record = async () => {
        recordingEngine.start();
        noteLogger.start(backingTrack, preferences.difficulty);

        setIsRecording(true);
        await play();
    };

    const clearRecordingResult = () => {
        setRecordingResult(null);
    };

    useEffect(() => {
        audioEngine.setOnEnded(() => stop());
        return () => { audioEngine.setOnEnded(null); };
    }, [audioEngine, stop]);
    
    return (
        <PlaybackContext.Provider value={{ playbackState, isRecording, recordingResult, play, pause, resume, stop, record, clearRecordingResult }}>
            {children}
        </PlaybackContext.Provider>
    );
}

export function usePlayback() {
    const context = useContext(PlaybackContext);
    if (!context) {
        throw new Error('usePlayback must be used within a PlaybackProvider');
    }
    return context;
}

PlaybackProvider.propTypes = {
    children: PropTypes.node.isRequired,
};