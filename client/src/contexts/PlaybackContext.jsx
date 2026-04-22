/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useStudio } from './StudioContext';
import { usePreferences } from './PreferencesContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import PropTypes from 'prop-types';
/** @typedef {import('../constants').BackingTrackKey} BackingTrackKey */
/** @typedef {import('../events/NoteLogger').NoteLog} NoteLog */

/**
 * @typedef {'playing' | 'paused' | 'stopped'} PlaybackState
 */

/**
 * @typedef {{recordingBlob: Blob, logObject: NoteLog} | null} RecordingResult
 */

/**
 * @typedef {{
 *    playbackState: PlaybackState,
 *    playbackErrorMessage: string | null,
 *    clearPlaybackErrorMessage: () => void,
 *    isRecording: boolean,
 *    recordingResult: RecordingResult,
 *    play: () => Promise<void>,
 *    pause: () => Promise<void>,
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
    const [playbackErrorMessage, setPlaybackErrorMessage] = useState(/** @type {string | null} */ (null));

    const {
        audioEngine,
        timingEngine,
        recordingEngine,
        noteLogger,
        keyboardHandler,
        backingTrack,
    } = useStudio();

    const shouldAutoPauseWhenHidden = useMediaQuery('(hover: none) and (pointer: coarse)');
    
    const { preferences } = usePreferences();

    const pause = useCallback(async () => {
        audioEngine.pauseBackingTrack();
        audioEngine.stopAllSamples();
        await audioEngine.suspendContext();
        timingEngine.pause();
        keyboardHandler.disable();

        setPlaybackState('paused');
    }, [audioEngine, timingEngine, keyboardHandler]);


    const stop = useCallback(async () => {
        const wasRecording = recordingEngine.isRecordingActive();
        const recordingData = wasRecording
            ? {
                recordingPromise: recordingEngine.stop(),
                logObject: noteLogger.stop(),
            }
            : null;
        audioEngine.stopAllSound();
        await audioEngine.suspendContext();
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
            await audioEngine.playBackingTrack();
            timingEngine.play();
            keyboardHandler.enable();

            setPlaybackState('playing');
        } catch (error) {
            console.error('Failed to play:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'An unknown error occurred during playback.';
            setPlaybackErrorMessage(errorMessage);
            await stop();
        }
    };

    const record = async () => {
        await play();
        recordingEngine.start();
        noteLogger.start(backingTrack, preferences.difficulty);

        setIsRecording(true);
    };

    const clearPlaybackErrorMessage = () => {
        setPlaybackErrorMessage(null);
    }

    const clearRecordingResult = () => {
        setRecordingResult(null);
    };

    useEffect(() => {
        audioEngine.setOnEnded(() => stop());
        return () => { audioEngine.setOnEnded(null); };
    }, [audioEngine, stop]);

    // Debug audioContext statechange
    useEffect(() => {
        const handleStateChange = () => {
            console.log('AudioContext state changed to:', audioEngine.audioContext.state);
        }
        audioEngine.audioContext.addEventListener('statechange', handleStateChange);
        return () => audioEngine.audioContext.removeEventListener('statechange', handleStateChange);
    }, [audioEngine]);

    // When app backgrounds, pause playing or stop recording.
    useEffect(() => {
        if (!shouldAutoPauseWhenHidden) return;

        const handleVisibilityChange = async () => {
            console.log('Document visibility changed:', document.visibilityState);
            if (document.hidden && playbackState === 'playing') {
                if (isRecording) await stop();
                else await pause();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [shouldAutoPauseWhenHidden, playbackState, isRecording, pause, stop]);
    
    return (
        <PlaybackContext.Provider value={{ playbackState, playbackErrorMessage, clearPlaybackErrorMessage, isRecording, recordingResult, play, pause, stop, record, clearRecordingResult }}>
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