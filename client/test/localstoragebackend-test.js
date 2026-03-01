import { LocalStorageBackend } from '/src/api/LocalStorageBackend.js';
import { PREFERENCE_DEFAULTS } from '/src/constants.js';

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

const backend = new LocalStorageBackend();

function saveTest() {
    const data = {
        ...PREFERENCE_DEFAULTS,
        backingTrackVolume: 0.42,
        samplesVolume: 0.77,
        backingTrackMuted: true,
        samplesMuted: false,
        difficulty: 'hard',
    };
    const saved = backend.save(data);
    log(`Saved preferences. Returned: ${saved ? 'ok' : 'undefined'}`);
}

function loadTest() {
    const loaded = backend.load();
    log(`Loaded: ${JSON.stringify(loaded)}`);
}

function corruptTest() {
    try {
        localStorage.setItem('color-improv:prefs', '{bad json');
        log('Wrote corrupt JSON to localStorage');
    } catch (error) {
        log(`Failed to write corrupt JSON: ${error.message}`, true);
    }
}

function clearTest() {
    localStorage.removeItem('color-improv:prefs');
    log('Cleared stored data');
}

document.getElementById('saveTest').addEventListener('click', saveTest);
document.getElementById('loadTest').addEventListener('click', loadTest);
document.getElementById('corruptTest').addEventListener('click', corruptTest);
document.getElementById('clearTest').addEventListener('click', clearTest);
