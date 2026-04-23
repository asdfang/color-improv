import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlay, faPause, faStop, faCircle} from '@fortawesome/free-solid-svg-icons';
import { useCallback, useEffect } from 'react';
import { usePlayback } from '../../contexts/PlaybackContext';
import { PlaybackButton } from './PlaybackButton';
import { DownloadDialog } from '../dialogs/DownloadDialog';
import { ErrorDialog } from '../dialogs/ErrorDialog';

export function PlaybackControls() {
    const {
        playbackState, playbackErrorMessage, clearPlaybackErrorMessage,isRecording,
        play, pause, stop, record,
        recordingResult, clearRecordingResult} = usePlayback();

    const canPlay = playbackState === 'stopped' || playbackState === 'paused';
    const canPause = playbackState === 'playing' && !isRecording;
    const canStop = playbackState === 'playing' || playbackState === 'paused';
    const canRecord = playbackState === 'stopped';

    const playIcon = <FontAwesomeIcon icon={faPlay} aria-hidden="true" />;
    const pauseIcon = <FontAwesomeIcon icon={faPause} aria-hidden="true" />;
    const stopIcon = <FontAwesomeIcon icon={faStop} aria-hidden="true" />;
    const recordIcon = (<FontAwesomeIcon
        className={`${isRecording ? 'animate-pulse' : ''}`}
        icon={faCircle}
        aria-hidden="true"
    />);

    /** @type {(e: KeyboardEvent) => void} */
    const handleKeyDown = useCallback((e) => {
        const target = e.target;
        if (!(target instanceof HTMLElement)) return;
        if (["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        if (e.repeat) return;
        if (document.querySelector('dialog[open]')) return;
        
        const { code, shiftKey } = e;
        if (code === 'Space' && !shiftKey) {
            e.preventDefault();
            if (isRecording) return;
            if (playbackState === 'playing') void pause();
            else void play();
        } else if (code === 'Space' && shiftKey) {
            e.preventDefault();
            if (playbackState !== 'stopped') void stop();
        } else if (code === 'KeyR' && shiftKey) {
            e.preventDefault();
            if (playbackState === 'stopped' && !isRecording) void record();
        }
    }, [playbackState, isRecording, pause, stop, record, play]);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    return (
        <div className="playback-controls">
            <PlaybackButton 
                id="play-btn"
                label="Play"
                onClick={play}
                disabled={!canPlay}
            >{playIcon}
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
            <span role="status" className="sr-only">
                {isRecording ? 'Recording in progress' : ''}
            </span>
            <DownloadDialog
                isOpen={recordingResult !== null}
                onClose={clearRecordingResult}
                recordingResult={recordingResult}
            />
            <ErrorDialog
                isOpen={playbackErrorMessage !== null}
                onClose={clearPlaybackErrorMessage}
                errorMessage={playbackErrorMessage || ''}
            />
        </div>
    );
}