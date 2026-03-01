import { LocalStorageBackend } from '/src/api/LocalStorageBackend.js';
import { PreferencesManager } from '/src/preferences/PreferencesManager.js';
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
const manager = new PreferencesManager(backend);

function loadTest() {
    const loaded = manager.load();
    log(`Loaded + sanitized: ${JSON.stringify(loaded)}`);
}

function getTest() {
    log(`getAll(): ${JSON.stringify(manager.getAll())}`);
    log(`getDefaults(): ${JSON.stringify(manager.getDefaults())}`);
    log(`get('difficulty'): ${manager.get('difficulty')}`);
}

function setValid() {
    log('Setting valid preferences...');
    const r1 = manager.set('difficulty', 'medium');
    const r2 = manager.set('backingTrackVolume', 0.25);
    const r3 = manager.set('samplesVolume', 0.9);
    const r4 = manager.set('backingTrackMuted', true);
    const r5 = manager.set('samplesMuted', false);
    log(`Results: ${[r1, r2, r3, r4, r5].join(', ')}`);
    log('Note: save is debounced (500ms)');
}

function setInvalid() {
    log('Setting invalid preferences (should be rejected)...');
    const r1 = manager.set('difficulty', 'expert');
    const r2 = manager.set('backingTrackVolume', 2);
    const r3 = manager.set('samplesVolume', -1);
    const r4 = manager.set('backingTrackMuted', 'yes');
    const r5 = manager.set('samplesMuted', null);
    log(`Results (expect undefined): ${[r1, r2, r3, r4, r5].map(v => String(v)).join(', ')}`);
}

function clearTest() {
    localStorage.removeItem('color-improv:prefs');
    log('Cleared stored data. Reload or run load test.');
}

document.getElementById('loadTest').addEventListener('click', loadTest);
document.getElementById('getTest').addEventListener('click', getTest);
document.getElementById('setValid').addEventListener('click', setValid);
document.getElementById('setInvalid').addEventListener('click', setInvalid);
document.getElementById('clearTest').addEventListener('click', clearTest);

log(`Defaults loaded: ${JSON.stringify(PREFERENCE_DEFAULTS)}`);
