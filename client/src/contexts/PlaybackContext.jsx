/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useStudio } from './StudioContext';
import { usePreferences } from './PreferencesContext';
import PropTypes from 'prop-types';

/**
 * @typedef {'playing' | 'paused' | 'stopped'} PlaybackState
 */

/**
 * @typedef {{recordingBlob: Blob, logBlob: Blob | null} | null} RecordingResult
 */

/**
 * @typedef {{
 *    playbackState: PlaybackState,
 *    isRecording: boolean,
 *    recordingResult: RecordingResult,
 *    play: Function,
 *    pause: Function,
 *    resume: Function,
 *    stop: Function,
 *    record: Function,
 *    clearRecordingResult: Function,
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
        backingTrack, // TODO: extract to config/preference manager
    } = useStudio();
    
    const { preferences } = usePreferences();

    const pause = useCallback(() => {
        audioEngine.pauseBackingTrack();
        audioEngine.stopAllSound();
        timingEngine.pause();
        keyboardHandler.disable();

        setPlaybackState('paused');
    }, [audioEngine, timingEngine, keyboardHandler]);

    const resume = useCallback(() => {
        audioEngine.playBackingTrack();
        timingEngine.resume();
        keyboardHandler.enable();

        setPlaybackState('playing');
    }, [audioEngine, timingEngine, keyboardHandler]);

    const stop = useCallback(async () => {
        const wasRecording = recordingEngine.isRecordingActive();
        let recordingPromise = null;
        let logObject = null;
        if (wasRecording) {
            recordingPromise = recordingEngine.stop();
            logObject = noteLogger.stop();
        }
        audioEngine.stopAllSound();
        timingEngine.stop();
        keyboardHandler.disable();

        setIsRecording(false);
        setPlaybackState('stopped');

        if (recordingPromise) {
            try {
                const recordingBlob = await recordingPromise;
                if (recordingBlob) {
                    setRecordingResult({
                        recordingBlob,
                        logBlob: logObject
                            ? new Blob([JSON.stringify(logObject)], { type: 'application/json' })
                            : null,
                    });
                } else {
                    console.error('Recording failed: No audio blob returned');
                }
            } catch (error) {
                console.error('Recording failed:', error);
            }
        }
    }, [recordingEngine, noteLogger, audioEngine, timingEngine, keyboardHandler]);

    const play = useCallback(async () => {
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
    }, [audioEngine, timingEngine, keyboardHandler, stop]);

    const record = useCallback(async () => {
        recordingEngine.start();
        noteLogger.start(backingTrack, preferences.difficulty);

        setIsRecording(true);
        await play();
    }, [recordingEngine, noteLogger, play, backingTrack, preferences.difficulty]);

    const clearRecordingResult = useCallback(() => {
        setRecordingResult(null);
    }, []);

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