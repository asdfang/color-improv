/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useStudio } from './StudioContext';
import { usePreferences } from './PreferencesContext';
import { useMediaQuery } from '../hooks/useMediaQuery';
import PropTypes from 'prop-types';
/** @typedef {import('../constants').BackingTrackKey} BackingTrackKey */
/** @typedef {import('../events/NoteLogger').NoteLog} NoteLog */

/**
 * @typedef {'playing' | 'paused' | 'stopped' | 'interrupted'} PlaybackState
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
    const [audioContextRevision, setAudioContextRevision] = useState(0);
    const attachedAudioCtxRef = useRef(/** @type {AudioContext | null} */ (null));
    const interruptionInFlightRef = useRef(false);

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

    const suspendIfRunning = useCallback(async () => {
        const audioCtx = audioEngine.audioContext;
        if (!audioCtx) return;
        if (audioCtx.state !== 'running') return;

        await audioEngine.suspendContext();
    }, [audioEngine]);

    const pause = useCallback(async () => {
        if (interruptionInFlightRef.current) {
            console.warn('Pause action ignored due to ongoing interruption recovery.');
            return;
        }

        audioEngine.pauseBackingTrack();
        audioEngine.stopAllSamples();
        await suspendIfRunning();
        timingEngine.pause();
        keyboardHandler.disable();

        setPlaybackState('paused');
    }, [audioEngine, timingEngine, keyboardHandler, suspendIfRunning]);

    const stopAndPrepareRecording = useCallback(async () => {
        if (!recordingEngine.isRecordingActive()) {
            console.warn('stopAndPrepareRecording called but recording is not active.');
            setIsRecording(false);
            return;
        }

        const recordingData = {
            recordingPromise: recordingEngine.stop(),
            logObject: noteLogger.stop(),
        };
        setIsRecording(false);

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
    }, [recordingEngine, noteLogger]);

    const stop = useCallback(async () => {
        if (interruptionInFlightRef.current) {
            console.warn('Stop ignored due to ongoing interruption recovery.');
            return;
        }

        if (recordingEngine.isRecordingActive()) {
            await stopAndPrepareRecording();
        }
        audioEngine.stopAllSound();
        await suspendIfRunning();
        timingEngine.stop();
        keyboardHandler.disable();

        setIsRecording(false);
        setPlaybackState('stopped');
    }, [recordingEngine, audioEngine, timingEngine, keyboardHandler, stopAndPrepareRecording, suspendIfRunning]);

    const play = async () => {
        if (interruptionInFlightRef.current) {
            console.warn('Play action ignored due to ongoing interruption recovery.');
            return;
        }

        try {
            if (!audioEngine.isReady()) {
                await audioEngine.initialize();
                setAudioContextRevision(value => value + 1);
            }
            await audioEngine.playBackingTrack();
            timingEngine.play();
            keyboardHandler.enable();

            setPlaybackErrorMessage(null);
            setPlaybackState('playing');
        } catch (error) {
            console.error('Failed to play:', error);
            const errorMessage = error instanceof Error
                ? error.message
                : 'An unknown error occurred during playback.';
            setPlaybackErrorMessage(errorMessage);
            await stop();
            throw error;
        }
    };

    const record = async () => {
        if (interruptionInFlightRef.current) {
            console.warn('Record action ignored due to ongoing interruption recovery.');
            return;
        }

        try {
            await play();
            recordingEngine.start();
            noteLogger.start(backingTrack, preferences.difficulty);

            setIsRecording(true);
        } catch (error) {
            console.error('Failed to record:', error);
        }
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
        const audioCtx = audioEngine.audioContext;
        if (!audioCtx) {
            attachedAudioCtxRef.current = null;
            return;
        }
        if (attachedAudioCtxRef.current === audioCtx) {
            return;
        }

        const handleInterruption = async () => {
            if (interruptionInFlightRef.current) return;
            interruptionInFlightRef.current = true;

            setPlaybackState('interrupted');
            keyboardHandler.disable();
            timingEngine.pause();

            try {
                if (recordingEngine.isRecordingActive()) {
                    await stopAndPrepareRecording();
                }
                await audioEngine.teardownForRecovery();
                setAudioContextRevision(value => value + 1);
            } catch (error) {
                console.error('Failed during interruption recovery:', error);
            } finally {
                interruptionInFlightRef.current = false;
            }
        };

        const handleStateChange = () => {
            if (audioCtx.state === 'interrupted') {
                console.warn('AudioContext was interrupted. Attempting to recover...');
                void handleInterruption();
            }
        };

        attachedAudioCtxRef.current = audioCtx;
        audioCtx.addEventListener('statechange', handleStateChange);
        return () => {
            audioCtx.removeEventListener('statechange', handleStateChange);
            if (attachedAudioCtxRef.current === audioCtx) {
                attachedAudioCtxRef.current = null;
            }
        };
    }, [audioContextRevision, audioEngine, timingEngine, keyboardHandler, recordingEngine, stopAndPrepareRecording]);

    // When app backgrounds, pause playing or stop recording.
    useEffect(() => {
        if (!shouldAutoPauseWhenHidden) return;

        const handleVisibilityChange = async () => {
            console.log('Document visibility changed:', document.visibilityState);
            if (interruptionInFlightRef.current || playbackState === 'interrupted') {
                console.warn('Visibility change ignored due to ongoing interruption recovery.');
                return;
            }
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