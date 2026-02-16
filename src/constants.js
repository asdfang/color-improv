/**
 * Audiovisual constants for ColorImprov
 * 
 * This file contains all constants for the application, organized by domain.
 * Since this app fundamentally connects audio and visual elements,
 * most constants bridge both domains.
 */

// ============================================================================
// AUDIO CONSTANTS
// ============================================================================

/**
 * All unique MIDI notes required, needed for loading samples used in multiple scales.
 * Standardized across all future instrument samples.
 */
export const REQUIRED_SAMPLES = [
    60, 62, 63, 64, 65, 66, 67, 69, 70, 71, 72, 74, 75, 76, 77, 79
];

/**
 * Audio path constants and helper functions.
 * TODO: support multiple instruments, backing tracks, formats with fallback, etc?
 * TODO: user may upload their own samples?
 */
export const AUDIO_CONFIG = {
    paths: {
        SAMPLES_BASE: '/assets/audio/samples/trumpet/',
        BACKING_TRACKS_BASE: '/assets/audio/backing-tracks/',
    },
    samples: REQUIRED_SAMPLES,
    format: 'mp3',

    volumes: {
        SAMPLES_MASTER_GAIN_DEFAULT: 0.8,
        BACKING_TRACK_GAIN_DEFAULT: 0.6,
        NOTE_FADE_TIME_DEFAULT: 0.35, // seconds
    },

    backingTracks: {
        blues: {
            filename: 'blues.mp3',
            bpm: 120,
            silenceOffset: 0.281,   // before first count-in hit
            countInBeats: 4,        // number of count-in beats before blues progression starts
            maxLoops: 11,           // number of loops (for active chord highlighting)
        },
    },

    getSamplePath(midiNumber) {
        return `${this.paths.SAMPLES_BASE}${midiNumber}.${this.format}`;
    },

    getBackingTrackPath(trackType) {
        return `${this.paths.BACKING_TRACKS_BASE}${this.backingTracks[trackType].filename}`;
    },
}

/**
 * Musical data linked with a keyboard key, using KeyboardEvent.code as the key.
 * Note that scale degrees reach 8 (as opposed to 1) for convenience.
 */
export const KEY_MAPPINGS = {
    // G Mixolydian scale - top row (qwertyui)
    'KeyQ': { midiNumber: 67, noteName: 'G', scaleRoot: 'G', scaleMode: 'Mixolydian', scaleDegree: '1' },
    'KeyW': { midiNumber: 69, noteName: 'A', scaleRoot: 'G', scaleMode: 'Mixolydian', scaleDegree: '2' },
    'KeyE': { midiNumber: 71, noteName: 'B', scaleRoot: 'G', scaleMode: 'Mixolydian', scaleDegree: '3' },
    'KeyR': { midiNumber: 72, noteName: 'C', scaleRoot: 'G', scaleMode: 'Mixolydian', scaleDegree: '4' },
    'KeyT': { midiNumber: 74, noteName: 'D', scaleRoot: 'G', scaleMode: 'Mixolydian', scaleDegree: '5' },
    'KeyY': { midiNumber: 76, noteName: 'E', scaleRoot: 'G', scaleMode: 'Mixolydian', scaleDegree: '6' },
    'KeyU': { midiNumber: 77, noteName: 'F', scaleRoot: 'G', scaleMode: 'Mixolydian', scaleDegree: '♭7' },
    'KeyI': { midiNumber: 79, noteName: 'G', scaleRoot: 'G', scaleMode: 'Mixolydian', scaleDegree: '8' },
    
    // F Mixolydian scale - middle row (asdfghjk)
    'KeyA': { midiNumber: 65, noteName: 'F', scaleRoot: 'F', scaleMode: 'Mixolydian', scaleDegree: '1' },
    'KeyS': { midiNumber: 67, noteName: 'G', scaleRoot: 'F', scaleMode: 'Mixolydian', scaleDegree: '2' },
    'KeyD': { midiNumber: 69, noteName: 'A', scaleRoot: 'F', scaleMode: 'Mixolydian', scaleDegree: '3' },
    'KeyF': { midiNumber: 70, noteName: 'B♭', scaleRoot: 'F', scaleMode: 'Mixolydian', scaleDegree: '4' },
    'KeyG': { midiNumber: 72, noteName: 'C', scaleRoot: 'F', scaleMode: 'Mixolydian', scaleDegree: '5' },
    'KeyH': { midiNumber: 74, noteName: 'D', scaleRoot: 'F', scaleMode: 'Mixolydian', scaleDegree: '6' },
    'KeyJ': { midiNumber: 75, noteName: 'E♭', scaleRoot: 'F', scaleMode: 'Mixolydian', scaleDegree: '♭7' },
    'KeyK': { midiNumber: 77, noteName: 'F', scaleRoot: 'F', scaleMode: 'Mixolydian', scaleDegree: '8' },

    // C Mixolydian scale - bottom row (zxcvbnm,)
    'KeyZ': { midiNumber: 60, noteName: 'C', scaleRoot: 'C', scaleMode: 'Mixolydian', scaleDegree: '1' },
    'KeyX': { midiNumber: 62, noteName: 'D', scaleRoot: 'C', scaleMode: 'Mixolydian', scaleDegree: '2' },
    'KeyC': { midiNumber: 64, noteName: 'E', scaleRoot: 'C', scaleMode: 'Mixolydian', scaleDegree: '3' },
    'KeyV': { midiNumber: 65, noteName: 'F', scaleRoot: 'C', scaleMode: 'Mixolydian', scaleDegree: '4' },
    'KeyB': { midiNumber: 67, noteName: 'G', scaleRoot: 'C', scaleMode: 'Mixolydian', scaleDegree: '5' },
    'KeyN': { midiNumber: 69, noteName: 'A', scaleRoot: 'C', scaleMode: 'Mixolydian', scaleDegree: '6' },
    'KeyM': { midiNumber: 70, noteName: 'B♭', scaleRoot: 'C', scaleMode: 'Mixolydian', scaleDegree: '♭7' },
    'Comma': { midiNumber: 72, noteName: 'C', scaleRoot: 'C', scaleMode: 'Mixolydian', scaleDegree: '8' },

    // C Blues scale - number row (1234567)
    'Digit1': { midiNumber: 60, noteName: 'C', scaleRoot: 'C', scaleMode: 'Blues', scaleDegree: '1' },
    'Digit2': { midiNumber: 63, noteName: 'E♭', scaleRoot: 'C', scaleMode: 'Blues', scaleDegree: '♭3' },
    'Digit3': { midiNumber: 65, noteName: 'F', scaleRoot: 'C', scaleMode: 'Blues', scaleDegree: '4' },
    'Digit4': { midiNumber: 66, noteName: 'F♯', scaleRoot: 'C', scaleMode: 'Blues', scaleDegree: '♯4' },
    'Digit5': { midiNumber: 67, noteName: 'G', scaleRoot: 'C', scaleMode: 'Blues', scaleDegree: '5' },
    'Digit6': { midiNumber: 70, noteName: 'B♭', scaleRoot: 'C', scaleMode: 'Blues', scaleDegree: '♭7' },
    'Digit7': { midiNumber: 72, noteName: 'C', scaleRoot: 'C', scaleMode: 'Blues', scaleDegree: '8' },
};