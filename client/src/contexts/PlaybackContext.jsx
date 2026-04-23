/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
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
 *    play: () => Promise<boolean>,
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
    const { preferences } = usePreferences();
    const attachedAudioCtxRef = useRef(/** @type {AudioContext | null} */ (null));
    const interruptionInFlightRef = useRef(false);
    const interruptionNeedsResolutionRef = useRef(false);
    const isResolvingRef = useRef(false);
    const preInterruptionWasRecordingRef = useRef(false);
    const shouldAutoPauseWhenHidden = useMediaQuery('(hover: none) and (pointer: coarse)');

    const {
        audioEngine,
        timingEngine,
        recordingEngine,
        noteLogger,
        keyboardHandler,
        backingTrack,
    } = useStudio();

    const suspendIfRunning = useCallback(async () => {
        const audioCtx = audioEngine.audioContext;
        if (!audioCtx) return;
        if (audioCtx.state !== 'running') return;

        await audioEngine.suspendContext();
    }, [audioEngine]);

    const pause = useCallback(async () => {
        if (interruptionInFlightRef.current || isResolvingRef.current) {
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

    const finalizeRecording = useCallback(async () => {
        if (!recordingEngine.isRecordingActive()) {
            console.warn('finalizeRecording called but recording is not active.');
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
        if (interruptionInFlightRef.current || isResolvingRef.current) {
            console.warn('Stop ignored due to ongoing interruption recovery.');
            return;
        }

        if (recordingEngine.isRecordingActive()) {
            await finalizeRecording();
        }
        audioEngine.stopAllSound();
        await suspendIfRunning();
        timingEngine.stop();
        keyboardHandler.disable();

        setIsRecording(false);
        setPlaybackState('stopped');
    }, [recordingEngine, audioEngine, timingEngine, keyboardHandler, finalizeRecording, suspendIfRunning]);

    const play = async () => {
        if (interruptionInFlightRef.current || isResolvingRef.current) {
            console.warn('Play action ignored due to ongoing interruption recovery.');
            return false;
        }
        if (interruptionNeedsResolutionRef.current) {
            await recoverAfterTeardown();
        }
        if (interruptionNeedsResolutionRef.current) {
            setPlaybackErrorMessage('Cannot play due to unresolved audio interruption. Please try again or refresh.');
            return false;
        }

        try {
            if (!audioEngine.isReady()) {
                await audioEngine.initialize();
                setAudioContextRevision(value => value + 1);
            }
            await audioEngine.playBackingTrack();
            timingEngine.play();
            keyboardHandler.enable();

            setPlaybackState('playing');
            return true;
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
        if (interruptionInFlightRef.current || isResolvingRef.current) {
            console.warn('Record action ignored due to ongoing interruption recovery.');
            return;
        }

        try {
            const didStartPlayback = await play();
            if (!didStartPlayback) return;
            recordingEngine.start();
            noteLogger.start(backingTrack, preferences.difficulty);

            setIsRecording(true);
        } catch (error) {
            console.error('Failed to record:', error);
        }
    };

    const clearPlaybackErrorMessage = () => {
        setPlaybackErrorMessage(null);
    };

    const clearRecordingResult = () => {
        setRecordingResult(null);
    };

    // Setup stop visuals when backing track ends
    useEffect(() => {
        audioEngine.setOnEnded(() => stop());
        return () => { audioEngine.setOnEnded(null); };
    }, [audioEngine, stop]);

    const recoverAfterTeardown = useCallback(async () => {
        if (!interruptionNeedsResolutionRef.current || isResolvingRef.current) return;
        try {
            isResolvingRef.current = true;
            if (audioEngine.audioContext) {
                throw new Error('AudioContext should have torn down, but still exists.');
            }

            // Re-initialize AudioEngine, AudioContext in suspended state
            audioEngine.createContext();
            if (!audioEngine.audioContext) {
                throw new Error('Failed to create AudioContext during interruption recovery.');
            }
            recordingEngine.updateAudioContext(audioEngine.audioContext);
            audioEngine.setupGainNodes();
            await audioEngine.setupBackingTrack();
            if (preInterruptionWasRecordingRef.current) audioEngine.clearPausedAt();
            audioEngine.connectMainToExternalNode(recordingEngine.getMediaStreamDestinationNode());

            setAudioContextRevision(value => value + 1);
            interruptionNeedsResolutionRef.current = false;
            preInterruptionWasRecordingRef.current = false;
        } catch (error) {
            console.error('Failed to resolve post-interruption state:', error);
        } finally {
            isResolvingRef.current = false;
        }
    }, [audioEngine, recordingEngine]);

    /**
     * Detects interruptions, updates UI -> teardown AudioContext -> (needs recovery)
     */
    useEffect(() => {
        const audioCtx = audioEngine.audioContext;
        if (!audioCtx) {
            attachedAudioCtxRef.current = null;
            return;
        }
        if (attachedAudioCtxRef.current === audioCtx) return;

        const handleInterruption = async () => {
            try {
                if (interruptionInFlightRef.current) return;
                interruptionInFlightRef.current = true;
                preInterruptionWasRecordingRef.current = isRecording;

                // Update UI immediately
                if (isRecording || playbackState === 'stopped') setPlaybackState('stopped');
                else setPlaybackState('paused');
                keyboardHandler.disable();
                timingEngine.pause();

                if (recordingEngine.isRecordingActive()) {
                    await finalizeRecording();
                }

                await audioEngine.teardownForRecovery();
                interruptionNeedsResolutionRef.current = true;
                setAudioContextRevision(value => value + 1);
            } catch (error) {
                console.error('Failed during interruption recovery:', error);
            } finally {
                interruptionInFlightRef.current = false;
            }
        };

        const handleStateChange = () => {
            if (audioCtx.state === 'interrupted') {
                console.warn('AudioContext was interrupted.');
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
    }, [isRecording, playbackState, audioContextRevision, audioEngine, timingEngine, keyboardHandler, recordingEngine, finalizeRecording]);

    // When app backgrounds, pause playing or stop recording.
    useEffect(() => {
        const handleVisibilityChange = async () => {
            console.log('Document visibility changed:', document.visibilityState);
            if (document.visibilityState === 'hidden') {
                if (interruptionInFlightRef.current || interruptionNeedsResolutionRef.current) {
                    console.warn('Visibility change ignored due to ongoing interruption.');
                    return;
                }
                if (!shouldAutoPauseWhenHidden) return;
                if (playbackState !== 'playing') return;
                if (isRecording ) await stop();
                else await pause();
            } else if (document.visibilityState === 'visible' && interruptionNeedsResolutionRef.current) {
                console.log('Attempting to recover from interruption on return to app.');
                await recoverAfterTeardown();
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isRecording, playbackState, pause, stop, recoverAfterTeardown, shouldAutoPauseWhenHidden]);
    
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