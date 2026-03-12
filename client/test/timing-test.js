import { AudioEngine } from '../src/audio/AudioEngine.js';
import { TimingEngine } from '../src/timing/TimingEngine.js';
import { PREFERENCE_DEFAULTS } from '../src/constants.js';

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
let timing = null;
let logIntervalId = null;

async function ensureReady() {
    if (!audioEngine) {
        audioEngine = new AudioEngine(
            PREFERENCE_DEFAULTS.backingTrackVolume,
            PREFERENCE_DEFAULTS.samplesVolume,
            PREFERENCE_DEFAULTS.backingTrackMuted,
            PREFERENCE_DEFAULTS.samplesMuted
        );
        await audioEngine.initialize();
        timing = new TimingEngine(audioEngine);
        log('AudioEngine initialized and TimingEngine created');
    }
}

function startLogging() {
    if (logIntervalId) return;
    logIntervalId = setInterval(() => {
        if (!timing) return;
        const pos = timing.getCurrentPosition();
        log(`Phase:${pos.phase}, Beat:${pos.beatNumberInMeasure}, Chord:${pos.currentChord}, Next:${pos.nextChord}, BeatsUntilNext:${pos.beatsUntilNextChord}`);
    }, 500);
}

function stopLogging() {
    if (logIntervalId) {
        clearInterval(logIntervalId);
        logIntervalId = null;
    }
}

async function startTest() {
    await ensureReady();
    const result = audioEngine.playBackingTrack();
    if (!result) {
        log('Backing track failed to start', true);
        return;
    }
    timing.start();
    startLogging();
    log('TimingEngine started');
}

function pauseTest() {
    if (!audioEngine || !timing) return;
    audioEngine.pauseBackingTrack();
    timing.pause();
    log('TimingEngine paused');
}

function resumeTest() {
    if (!audioEngine || !timing) return;
    audioEngine.playBackingTrack();
    timing.resume();
    log('TimingEngine resumed');
}

function stopTest() {
    if (!audioEngine || !timing) return;
    audioEngine.stopBackingTrack();
    timing.stop();
    stopLogging();
    log('TimingEngine stopped');
}

function logPositionOnce() {
    if (!timing) {
        log('TimingEngine not initialized', true);
        return;
    }
    const pos = timing.getCurrentPosition();
    log(`Position -> phase:${pos.phase}, beat:${pos.beatNumberInMeasure}, measure:${pos.measureNumberInProgression}, chord:${pos.currentChord}, loops:${pos.loopsCompleted}`);
}

document.getElementById('startTest').addEventListener('click', startTest);
document.getElementById('pauseTest').addEventListener('click', pauseTest);
document.getElementById('resumeTest').addEventListener('click', resumeTest);
document.getElementById('stopTest').addEventListener('click', stopTest);
document.getElementById('logPosition').addEventListener('click', logPositionOnce);