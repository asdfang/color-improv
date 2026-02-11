/**
 * Audio utility functions for ColorImprov
 */

/**
 * Converts a MIDI number to pitch class (0-11).
 * @param {number} midiNumber - The MIDI note number (0-127).
 * @returns {number} - The pitch class (0-11).
 */
export function midiToPitchClass(midiNumber) {
    return midiNumber % 12;
}

/**
 * Clamps a volume value between 0.0 and 1.0.
 * @param {number} volume 
 * @returns {number}
 */
export function clampVolume(volume) {
    return Math.min(Math.max(volume, 0.0), 1.0);
}