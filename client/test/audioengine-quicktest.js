import { AudioEngine } from '../src/audio/AudioEngine.js';
import { KEY_MAPPINGS, PREFERENCE_DEFAULTS } from '../src/constants.js';

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

let audioEngine = null;
let audioInitialized = false;
let disposed = false;


async function initTest() {
    if (!audioEngine || disposed) {
        log('AudioEngine not available. Reload the page.', true);
        return;
    }
    if (audioInitialized) {
        log('AudioEngine already initialized.');
        return;
    }
    await audioEngine.initialize();
    audioInitialized = true;
    log('AudioEngine initialized');
};

// Create AudioEngine on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Creating AudioEngine...');
    audioEngine = new AudioEngine(
        PREFERENCE_DEFAULTS.backingTrackVolume,
        PREFERENCE_DEFAULTS.samplesVolume,
        PREFERENCE_DEFAULTS.backingTrackMuted,
        PREFERENCE_DEFAULTS.samplesMuted
    );
    audioEngine.onEnded = () => log('Backing track ended');
    console.log('AudioEngine created.');
    log('AudioEngine created (not initialized)');
});

// Listen for button click to run init test
document.getElementById('initTest').addEventListener('click', initTest);

document.getElementById('playBackingTrack').addEventListener('click', async () => {
    if (!audioEngine) return;
    if (!audioInitialized) {
        await initTest();
    }
    const result = audioEngine.playBackingTrack();
    if (!result) {
        log('Backing track play failed (audio not ready).', true);
        return;
    }
    log(`Backing track play started at ${result.startTime.toFixed(2)}s`);
});

document.getElementById('pauseBackingTrack').addEventListener('click', () => {
    audioEngine.pauseBackingTrack();
    log('Backing track paused');
});

// document.getElementById('resumeBackingTrack').addEventListener('click', () => {
//     audioEngine.resumeBackingTrack();
// });

document.getElementById('stopBackingTrack').addEventListener('click', () => {
    audioEngine.stopBackingTrack();
    log('Backing track stopped');
});

document.getElementById('stopSamples').addEventListener('click', () => {
    audioEngine.stopAllSamples();
    log('All samples stopped');
});

document.getElementById('stopAllSound').addEventListener('click', () => {
    audioEngine.stopAllSound();
    log('All sound stopped');
});

document.getElementById('mute').addEventListener('click', () => {
    audioEngine.setBackingTrackMuted(true);
    audioEngine.setSamplesMuted(true);
    log('Muted backing track and samples');
});

document.getElementById('unmute').addEventListener('click', () => {
    audioEngine.setBackingTrackMuted(false);
    audioEngine.setSamplesMuted(false);
    log('Unmuted backing track and samples');
});

document.getElementById('checkReady').addEventListener('click', () => {
    if (!audioEngine) return;
    log(`isReady() = ${audioEngine.isReady()} (state: ${audioEngine.audioContext?.state ?? 'n/a'})`);
});

document.getElementById('volumeTest').addEventListener('click', () => {
    if (!audioEngine) return;
    const backingGain = audioEngine.setBackingTrackVolume(1.5);
    const sampleGain = audioEngine.setSamplesVolume(-0.2);
    log(`Volume clamp test -> backing gain: ${backingGain?.toFixed?.(3) ?? 'n/a'}, samples gain: ${sampleGain?.toFixed?.(3) ?? 'n/a'}`);
});

document.getElementById('logActive').addEventListener('click', () => {
    if (!audioEngine) return;
    const active = audioEngine.getActiveMIDINumbers();
    const unique = Array.from(audioEngine.getUniqueMIDINumbers());
    log(`Active MIDI: [${active.join(', ')}], Unique: [${unique.join(', ')}]`);
});

document.getElementById('debugSeek').addEventListener('click', () => {
    if (!audioEngine) return;
    audioEngine.setDebugTime(5);
    log(`Debug seek set. Current time: ${audioEngine.getCurrentTime().toFixed(2)}s`);
});

document.getElementById('dispose').addEventListener('click', async () => {
    if (!audioEngine || disposed) return;
    await audioEngine.dispose();
    disposed = true;
    log('AudioEngine disposed');
});

// Listen for keydown
window.addEventListener("keydown", (event) => {
    if (event.repeat) return; // Ignore repeated events when key is held down
    
    const mapping = KEY_MAPPINGS[event.code];
    if (mapping) {
        audioEngine.playNote(event.code, mapping.midiNumber);
        log(`playNote ${event.code} -> ${mapping.midiNumber}`);
    }
});

// Listen for keyup
window.addEventListener("keyup", (event) => {
    const mapping = KEY_MAPPINGS[event.code];
    if (mapping) {
        audioEngine.stopNote(event.code, mapping.midiNumber)
        log(`stopNote ${event.code} -> ${mapping.midiNumber}`);
    }
});

