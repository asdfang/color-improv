import { AudioEngine } from '../src/audio/AudioEngine.js';
import { KeyboardHandler } from '../src/input/KeyboardHandler.js';
import { KEY_MAPPINGS } from '../src/constants.js';

const output = document.getElementById('output');
const statusEl = document.getElementById('status');
const activeKeysEl = document.getElementById('activeKeys');
const mappingsEl = document.getElementById('mappings');

function log(message, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '✓';
    const line = `[${timestamp}] ${prefix} ${message}`;
    console.log(line);
    output.textContent += line + '\n';
    output.scrollTop = output.scrollHeight;
}

function formatMapping(mapping) {
    if (!mapping) return 'unknown';
    if (typeof mapping === 'object') {
        const { midiNumber, noteName, scaleRoot, scaleMode, scaleDegree } = mapping;
        return `${midiNumber} (${noteName}, ${scaleRoot} ${scaleMode} ${scaleDegree})`;
    }
    return String(mapping);
}

function renderActiveKeys(handler) {
    const keys = handler.getActiveKeys();
    if (keys.length === 0) {
        activeKeysEl.textContent = 'Active keys: (none)';
        return;
    }
    const details = keys
        .map(code => `${code} -> ${formatMapping(KEY_MAPPINGS[code])}`)
        .join('\n');
    activeKeysEl.textContent = `Active keys:\n${details}`;
}

function renderMappingsList() {
    const rows = Object.entries(KEY_MAPPINGS)
        .map(([code, mapping]) => `${code.padEnd(8)} : ${formatMapping(mapping)}`)
        .join('\n');
    mappingsEl.textContent = rows;
}

function queueRenderActiveKeys() {
    if (!keyboardHandler) return;
    setTimeout(() => {
        renderActiveKeys(keyboardHandler);
    }, 0);
}

let audioEngine = null;
let keyboardHandler = null;
let audioReady = false;

const audioEngineAdapter = {
    playNote(inputID, midiNumber) {
        const mapping = typeof midiNumber === 'object' && midiNumber !== null ? midiNumber : null;
        const resolvedMidi = mapping ? mapping.midiNumber : midiNumber;
        log(`playNote called: ${inputID} -> ${formatMapping(mapping ?? resolvedMidi)}`);
        return audioEngine?.playNote(inputID, resolvedMidi) ?? null;
    },
    stopNote(inputID, midiNumber) {
        const mapping = typeof midiNumber === 'object' && midiNumber !== null ? midiNumber : null;
        const resolvedMidi = mapping ? mapping.midiNumber : midiNumber;
        log(`stopNote called: ${inputID} -> ${formatMapping(mapping ?? resolvedMidi)}`);
        audioEngine?.stopNote(inputID, resolvedMidi);
    },
};

async function ensureAudioEngineReady() {
    if (audioReady) return;
    statusEl.textContent = 'Status: initializing audio...';
    log('Initializing AudioEngine (requires user gesture)...');
    audioEngine = new AudioEngine();
    await audioEngine.initialize();
    audioReady = true;
    log('AudioEngine initialized');
}

async function enableHandler() {
    try {
        await ensureAudioEngineReady();
        if (!keyboardHandler) {
            keyboardHandler = new KeyboardHandler(audioEngineAdapter);
        }
        keyboardHandler.enable();
        statusEl.textContent = 'Status: enabled (audio ready)';
        log('KeyboardHandler enabled');
    } catch (error) {
        statusEl.textContent = 'Status: error initializing audio';
        log(`Failed to initialize audio: ${error.message}`, true);
    }
}

function disableHandler() {
    if (!keyboardHandler) {
        statusEl.textContent = 'Status: disabled';
        log('KeyboardHandler disabled');
        return;
    }
    keyboardHandler.disable();
    statusEl.textContent = 'Status: disabled';
    log('KeyboardHandler disabled');
    renderActiveKeys(keyboardHandler);
}

function clearLog() {
    output.textContent = '';
    log('Log cleared');
}

renderMappingsList();
renderActiveKeys({ getActiveKeys: () => [] });

window.addEventListener('focus', () => {
    log('Window focused');
    queueRenderActiveKeys();
});

window.addEventListener('blur', () => {
    log('Window blurred');
    queueRenderActiveKeys();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        log('Document hidden');
    } else {
        log('Document visible');
    }
    queueRenderActiveKeys();
});

document.addEventListener('notestart', (event) => {
    const { uniqueID, midiNumber, timestamp } = event.detail || {};
    log(`notestart: ${uniqueID} -> ${formatMapping(midiNumber)} @ ${timestamp?.toFixed?.(2) ?? 'n/a'}ms`);
    if (keyboardHandler) {
        renderActiveKeys(keyboardHandler);
    }
});

document.addEventListener('noteend', (event) => {
    const { uniqueID, midiNumber, timestamp } = event.detail || {};
    log(`noteend: ${uniqueID} -> ${formatMapping(midiNumber)} @ ${timestamp?.toFixed?.(2) ?? 'n/a'}ms`);
    queueRenderActiveKeys();
});

document.getElementById('enableBtn').addEventListener('click', enableHandler);
document.getElementById('disableBtn').addEventListener('click', disableHandler);
document.getElementById('clearLogBtn').addEventListener('click', clearLog);

enableHandler();
