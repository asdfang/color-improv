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

/**
 * dB to gain conversion.
 * @param {number} slider linear value of volume slider
 * @param {number} minDb 
 * @param {number} maxDb 
 * @returns {number} gain value (linear)
 */
export function sliderToGain(slider, minDb = -60, maxDb = 0) {
    const clampedSlider = clampVolume(slider);
    const db = minDb + clampedSlider * (maxDb - minDb);
    return Math.pow(10, db / 20);
}