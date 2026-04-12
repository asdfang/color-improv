import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStop, faCircle} from '@fortawesome/free-solid-svg-icons';
import { useCallback, useEffect } from 'react';
import { usePlayback } from '../../contexts/PlaybackContext';

export function PlaybackControls() {
    const { playbackState, isRecording, play, resume, pause, stop, record } = usePlayback();

    const canPlayOrResume = playbackState === 'stopped' || playbackState === 'paused';
    const canPause = playbackState === 'playing' && !isRecording;
    const canStop = playbackState === 'playing' || playbackState === 'paused';
    const canRecord = playbackState === 'stopped';
    
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
            <div className="playback-btn-wrapper">
                <button
                    id="play-btn"
                    className="btn-circle playback-btn"
                    onClick={handlePlayOrResume}
                    title={playbackState === 'paused' ? 'Resume' : 'Play'}
                    disabled={!canPlayOrResume}
                >
                    <FontAwesomeIcon icon={faPlay} />
                </button>
                <span className="playback-btn-label">Play</span>
            </div>
            <div className="playback-btn-wrapper">
                <button
                    id="pause-btn"
                    className="btn-circle playback-btn"
                    onClick={pause}
                    title="Pause"
                    disabled={!canPause}
                >
                    <FontAwesomeIcon icon={faPause} />
                </button>
                <span className="playback-btn-label">Pause</span>
            </div>
            <div className="playback-btn-wrapper">
                <button
                    id="stop-btn"
                    className="btn-circle playback-btn"
                    onClick={stop}
                    title="Stop"
                    disabled={!canStop}
                >
                    <FontAwesomeIcon icon={faStop} />
                </button>
                <span className="playback-btn-label">Stop</span>

            </div>
            <div className="playback-btn-wrapper">
                <button
                    id="record-btn"
                    className={`btn-circle playback-btn`}
                    onClick={record}
                    title="Record"
                    disabled={!canRecord}
                >
                    <FontAwesomeIcon className={`${isRecording ? 'animate-pulse' : ''}`} icon={faCircle} />
                </button>
                <span
                    className="playback-btn-label"
                    style={ { color: isRecording ? 'var(--color-recording)' : '' } }
                >
                    {`${isRecording ? 'Recording...' : 'Record'}`}
                </span>
            </div>
        </div>
    );
}