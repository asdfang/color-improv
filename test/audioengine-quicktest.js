import { AudioEngine } from '../src/audio/AudioEngine.js';
import { KEY_MAPPINGS } from '../src/constants.js';

let audioEngine = null;


async function initTest() {
    await audioEngine.initialize();
};

// Create AudioEngine on page load
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Creating AudioEngine...');
    audioEngine = new AudioEngine();
    console.log('AudioEngine created.');
});

// Listen for button click to run init test
document.getElementById('initTest').addEventListener('click', initTest);

document.getElementById('playBackingTrack').addEventListener('click', () => {
    if (!audioEngine.isReady()) {
        audioEngine.initialize().then(() => {
            audioEngine.playBackingTrack();
        });
        return;
    }
    else {
        audioEngine.playBackingTrack();
    }
});

document.getElementById('pauseBackingTrack').addEventListener('click', () => {
    audioEngine.pauseBackingTrack();
});

// document.getElementById('resumeBackingTrack').addEventListener('click', () => {
//     audioEngine.resumeBackingTrack();
// });

document.getElementById('stopBackingTrack').addEventListener('click', () => {
    audioEngine.stopBackingTrack();
});

document.getElementById('stopSamples').addEventListener('click', () => {
    audioEngine.stopAllSamples();
});

document.getElementById('stopAllSound').addEventListener('click', () => {
    audioEngine.stopAllSound();
});

document.getElementById('mute').addEventListener('click', () => {
    audioEngine.setBackingTrackVolume(0.0);
    audioEngine.setSamplesMasterVolume(0.0);
});

document.getElementById('unmute').addEventListener('click', () => {
    audioEngine.setBackingTrackVolume(0.6);
    audioEngine.setSamplesMasterVolume(0.8);
});

// Listen for keydown
window.addEventListener("keydown", (event) => {
    if (event.repeat) return; // Ignore repeated events when key is held down
    
    const mapping = KEY_MAPPINGS[event.code];
    if (mapping) {
        audioEngine.playNote(event.code, mapping.midiNumber);
    }
});

// Listen for keyup
window.addEventListener("keyup", (event) => {
    const mapping = KEY_MAPPINGS[event.code];
    if (mapping) {
        audioEngine.stopNote(event.code, mapping.midiNumber)
    }
});

