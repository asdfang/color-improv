import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStop, faCircle} from '@fortawesome/free-solid-svg-icons';
import { useCallback, useEffect } from 'react';
import { usePlayback } from '../../contexts/PlaybackContext';
import { PlaybackButton } from './PlaybackButton';

export function PlaybackControls() {
    const { playbackState, isRecording, play, resume, pause, stop, record } = usePlayback();

    const canPlayOrResume = playbackState === 'stopped' || playbackState === 'paused';
    const canPause = playbackState === 'playing' && !isRecording;
    const canStop = playbackState === 'playing' || playbackState === 'paused';
    const canRecord = playbackState === 'stopped';

    // FontAwesome Icons
    const playIcon = <FontAwesomeIcon icon={faPlay} />;
    const pauseIcon = <FontAwesomeIcon icon={faPause} />;
    const stopIcon = <FontAwesomeIcon icon={faStop} />;
    const recordIcon = <FontAwesomeIcon className={`${isRecording ? 'animate-pulse' : ''}`} icon={faCircle} />;
    
    const handlePlayOrResume = useCallback(() => {
        if (playbackState === 'stopped') play();
        else if (playbackState === 'paused') resume();
    }, [playbackState, play, resume]);

    /** @type {(e: KeyboardEvent) => void} */
    const handleKeyDown = useCallback((e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        if (e.repeat) return;
        
        const { code, shiftKey } = e;
        if (code === 'Space' && !shiftKey) {
            e.preventDefault();
            if (isRecording) return;
            if (playbackState === 'playing') pause();
            else handlePlayOrResume();
        } else if (code === 'Space' && shiftKey) {
            e.preventDefault();
            if (playbackState !== 'stopped') stop();
        } else if (code === 'KeyR' && shiftKey) {
            e.preventDefault();
            if (playbackState === 'stopped' && !isRecording) record();
        }
    }, [playbackState, isRecording, pause, stop, record, handlePlayOrResume]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div id="playback-controls">
            <PlaybackButton 
                id="play-btn"
                label="Play"
                onClick={handlePlayOrResume}
                disabled={!canPlayOrResume}
            >
                {playIcon}
            </PlaybackButton>
            <PlaybackButton
                id="pause-btn"
                label="Pause"
                onClick={pause}
                disabled={!canPause}
            >
                {pauseIcon}
            </PlaybackButton>
            <PlaybackButton
                id="stop-btn"
                label="Stop"
                onClick={stop}
                disabled={!canStop}
            >
                {stopIcon}
            </PlaybackButton>
            <PlaybackButton
                id="record-btn"
                label={`${isRecording ? 'Recording...' : 'Record'}`}
                labelClassName={`${isRecording ? 'recording' : ''}`}
                onClick={record}
                disabled={!canRecord}
            >
                {recordIcon}   
            </PlaybackButton>
        </div>
    );
}