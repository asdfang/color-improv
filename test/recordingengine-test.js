import { RecordingEngine } from '/src/recording/RecordingEngine.js';

const output = document.getElementById('output');
const playback = document.getElementById('playback');

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

let audioContext = null;
let recordingEngine = null;
let oscillator = null;
let oscGain = null;
let lastRecordingUrl = null;
let lastRecordingBlob = null;

async function initAudio() {
    if (audioContext) {
        log('Audio already initialized');
        return;
    }
    if (!window.MediaRecorder) {
        log('MediaRecorder not supported in this browser', true);
        return;
    }
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    recordingEngine = new RecordingEngine(audioContext);

    const destination = recordingEngine.getMediaStreamDestinationNode();
    oscGain = audioContext.createGain();
    oscGain.gain.value = 0.2;

    // Route oscillator to both speakers and recording stream
    oscGain.connect(audioContext.destination);
    oscGain.connect(destination);

    log(`Audio initialized. Context state: ${audioContext.state}`);
}

function ensureAudio() {
    if (!audioContext || !recordingEngine) {
        log('Click "Init Audio" first', true);
        return false;
    }
    return true;
}

function toneOn() {
    if (!ensureAudio()) return;
    if (oscillator) {
        log('Tone already running');
        return;
    }
    oscillator = audioContext.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 440;
    oscillator.connect(oscGain);
    oscillator.start();
    log('Tone on (440Hz)');
}

function toneOff() {
    if (!oscillator) {
        log('Tone not running');
        return;
    }
    oscillator.stop();
    oscillator.disconnect();
    oscillator = null;
    log('Tone off');
}

function startRecording() {
    if (!ensureAudio()) return;
    recordingEngine.start();
    log('Recording started');
}


async function stopRecording() {
    if (!ensureAudio()) return;
    try {
        const blob = await recordingEngine.stop();
        if (!blob) {
            log('No recording blob returned', true);
            return;
        }
        lastRecordingBlob = blob;
        if (lastRecordingUrl) URL.revokeObjectURL(lastRecordingUrl);
        lastRecordingUrl = URL.createObjectURL(blob);
        playback.src = lastRecordingUrl;
        log(`Recording stopped. Blob size: ${blob.size} bytes, type: ${blob.type || 'unknown'}`);
    } catch (error) {
        log(`Recording stop error: ${error.message ?? error}`, true);
    }
}

function downloadRecording() {
    if (!lastRecordingBlob) {
        log('No recording to download', true);
        return;
    }
    const ext = lastRecordingBlob.type.includes('ogg') ? 'ogg'
        : lastRecordingBlob.type.includes('mp4') ? 'mp4'
        : 'webm';
    const link = document.createElement('a');
    link.href = lastRecordingUrl;
    link.download = `recording.${ext}`;
    link.click();
    log(`Download started (recording.${ext})`);
}

document.getElementById('initAudio').addEventListener('click', initAudio);
document.getElementById('toneOn').addEventListener('click', toneOn);
document.getElementById('toneOff').addEventListener('click', toneOff);
document.getElementById('startRec').addEventListener('click', startRecording);
document.getElementById('stopRec').addEventListener('click', stopRecording);
document.getElementById('downloadRec').addEventListener('click', downloadRecording);
