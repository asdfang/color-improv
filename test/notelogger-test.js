import { AudioEngine } from '../src/audio/AudioEngine.js';
import { TimingEngine } from '../src/timing/TimingEngine.js';
import { NoteLogger } from '../src/events/NoteLogger.js';
import { KeyboardHandler } from '../src/input/KeyboardHandler.js';
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

function clearOutput() {
    if (output) output.textContent = '';
}

let audioEngine = null;
let timing = null;
let noteLogger = null;
let keyboardHandler = null;
let isLogging = false;

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
        noteLogger = new NoteLogger(timing);
        keyboardHandler = new KeyboardHandler(audioEngine);
        log('AudioEngine, TimingEngine, KeyboardHandler, and NoteLogger initialized');
    }
}

// Interactive Session Test
async function startInteractiveSession() {
    clearOutput();
    log('=== Interactive NoteLogger Session ===');
    
    await ensureReady();
    
    // Start logging with metadata
    const backingTrack = 'blues';
    const difficulty = 'medium';
    noteLogger.start(backingTrack, difficulty);
    isLogging = true;
    
    // Enable keyboard handler to start capturing input
    keyboardHandler.enable();
    log('KeyboardHandler enabled');
    
    log(`Session started: backingTrack=${backingTrack}, difficulty=${difficulty}`);
    log('Press keys to play notes. They will be logged in real-time.');
    log('Click "Stop Session" to see the final result.\n');
    
    // Listen for note events and log them as they occur
    const handleNoteStart = (e) => {
        if (!isLogging) return;
        const { midiNumber, uniqueID } = e.detail;
        log(`→ notestart: MIDI ${midiNumber} (${uniqueID})`);
    };
    
    const handleNoteEnd = (e) => {
        if (!isLogging) return;
        const { midiNumber, uniqueID } = e.detail;
        log(`← noteend: MIDI ${midiNumber} (${uniqueID})`);
    };
    
    document.addEventListener('notestart', handleNoteStart);
    document.addEventListener('noteend', handleNoteEnd);
    
    // Store listeners for cleanup
    window.currentListeners = { handleNoteStart, handleNoteEnd };
}

function stopInteractiveSession() {
    if (!isLogging) return;
    
    isLogging = false;
    
    // Disable keyboard handler
    keyboardHandler.disable();
    
    // Remove event listeners
    if (window.currentListeners) {
        document.removeEventListener('notestart', window.currentListeners.handleNoteStart);
        document.removeEventListener('noteend', window.currentListeners.handleNoteEnd);
    }
    
    log('\n=== Session Ended ===\n');
    
    // Get final result
    const result = noteLogger.stop();
    
    // Clear output and show final result
    clearOutput();
    log('=== Session Result ===\n');
    log(`backingTrack: ${result.backingTrack}`);
    log(`difficulty: ${result.difficulty}`);
    log(`total events: ${result.events.length}\n`);
    
    if (result.events.length > 0) {
        log('Events:');
        result.events.forEach((event, index) => {
            log(`  ${index + 1}. [${event.timestamp.toFixed(3)}s] ${event.eventType} - MIDI ${event.midiNumber} (${event.inputID})`);
        });
        
        log('\nFull result object:');
        log(JSON.stringify(result, null, 2));
    } else {
        log('No events were logged.');
    }
}

// Event Listeners
document.getElementById('basicTest').addEventListener('click', startInteractiveSession);
document.getElementById('multipleEventsTest').addEventListener('click', stopInteractiveSession);
document.getElementById('sessionMetadataTest').addEventListener('click', () => {
    clearOutput();
    log('NoteLogger test page ready. Click "Basic Session Test" to start.');
});
document.getElementById('clearOutput').addEventListener('click', clearOutput);

log('NoteLogger interactive test page ready. Click "Basic Session Test" to start.');
