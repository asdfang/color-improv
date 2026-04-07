import { useState } from 'react';
import { useStudio } from '../contexts/StudioContext';
import { usePreferences } from '../contexts/PreferencesContext';

export function usePlaybackState() {
    const [playbackState, setPlaybackState] = useState('stopped'); // 'playing' | 'paused' | 'stopped'
    const [isRecording, setIsRecording] = useState(false);
    /** @typedef {{recordingBlob: Blob|null, logBlob: Blob|null}} RecordingResult */
    const [recordingResult, setRecordingResult] = useState(/** @type {RecordingResult} */ ({ recordingBlob: null, logBlob: null }));

    const {
        audioEngine,
        timingEngine,
        recordingEngine,
        noteLogger,
        keyboardHandler,
        backingTrack, // TODO: extract to config/preference manager
    } = useStudio();

    const { preferences } = usePreferences();

    const play = async () => {
        try {
            if (audioEngine.audioContext.state !== 'running') { // wrap in try/catch?
                await audioEngine.initialize();
            }
            setPlaybackState('playing');
            audioEngine.playBackingTrack();
            timingEngine.start();
            keyboardHandler.enable();
        } catch (error) {
            console.error('Failed to play:', error);
            stop();
        }
    }

    const pause = () => {
        setPlaybackState('paused');
        audioEngine.pauseBackingTrack();
        audioEngine.stopAllSound();
        timingEngine.pause();
        keyboardHandler.disable();
    }

    const resume = () => {
        setPlaybackState('playing');
        audioEngine.playBackingTrack();
        timingEngine.resume();
        keyboardHandler.enable();
    }

    const stop = async () => {
        let recordingPromise = null;
        let logObject = null;
        if (isRecording) {
            setIsRecording(false);
            recordingPromise = recordingEngine.stop();
            logObject = noteLogger.stop();
        }
        setPlaybackState('stopped');
        audioEngine.stopAllSound();
        timingEngine.stop();
        keyboardHandler.disable();

        if (recordingPromise) {
            const recordingBlob = await recordingPromise;
            if (!recordingBlob || !logObject) {
                console.error('Recording failed: Incomplete recording data');
                return;
            }

            const logJson = JSON.stringify(logObject, null, 2);
            const logBlob = new Blob([logJson], { type : 'application/json' });

            setRecordingResult({ recordingBlob, logBlob });
        }
    }

    const record = async () => {
        setIsRecording(true);
        recordingEngine.start();
        noteLogger.start(backingTrack, preferences.difficulty);
        await play();
    }

    return (
        {
            playbackState, isRecording, recordingResult,
            play, pause, resume, stop, record
        }
    );
}