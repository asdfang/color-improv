import { PlaybackControls } from '/src/ui/PlaybackControls.js';
import { VolumeControls } from '/src/ui/VolumeControls.js';
import { DifficultyControls } from '/src/ui/DifficultyControls.js';

const output = document.getElementById('output');

function log(message, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '✓';
    const line = `[${timestamp}] ${prefix} ${message}`;
    console.log(line);
    if (output) {
        output.textContent += line + '\n';
        output.scrollTop = output.scrollHeight;
    }
}

const playbackControls = new PlaybackControls();
const volumeControls = new VolumeControls();
const difficultyControls = new DifficultyControls();

playbackControls.enable({
    onPlay: () => {
        log('PlaybackControls: onPlay');
        playbackControls.setPlaying();
    },
    onPause: () => {
        log('PlaybackControls: onPause');
        playbackControls.setPaused();
    },
    onStop: () => {
        log('PlaybackControls: onStop');
        playbackControls.setStopped();
    },
    onResume: () => {
        log('PlaybackControls: onResume');
        playbackControls.setPlaying();
    },
});

volumeControls.enable({
    onVolumeChange: (source, volume) => {
        log(`VolumeControls: ${source} volume ${volume.toFixed(2)}`);
    },
    onMuteToggle: (source) => {
        log(`VolumeControls: toggle mute ${source}`);
        const button = source === 'backingTrack'
            ? document.getElementById('backing-track-mute-button')
            : document.getElementById('samples-mute-button');
        const next = button.textContent === '🔈';
        volumeControls.setMuted(source, next);
        return next;
    },
    onReset: (source) => {
        const defaultValue = source === 'backingTrack' ? 0.6 : 0.8;
        volumeControls.setVolume(source, defaultValue);
        volumeControls.setMuted(source, false);
        log(`VolumeControls: reset ${source} to ${defaultValue}`);
    },
});

difficultyControls.enable({
    onDifficultyChange: (difficulty) => {
        log(`DifficultyControls: changed to ${difficulty}`);
    },
});

log('UI Controls test ready');
