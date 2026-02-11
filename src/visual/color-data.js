/**
 * Color constants and utilities for ColorImprov visual rendering.
 */

import { midiToPitchClass } from '/src/audio/audio-utils.js';

/**
 * Named color constants in HSL format.
 * Note colors use HSL to enable easy manipulation (brightness, desaturation) in rendering.
 */
export const COLORS = {
    // Chromatic circle colors (used in PITCH_CLASS_TO_COLOR)
    RED: 'hsl(0, 80%, 65%)',           // C
    ORANGE: 'hsl(30, 80%, 65%)',       // D
    YELLOW_GREEN: 'hsl(45, 80%, 65%)', // D#/Eb
    GREEN_YELLOW: 'hsl(65, 80%, 65%)', // E
    GREEN: 'hsl(100, 80%, 65%)',       // F
    CYAN: 'hsl(160, 80%, 65%)',        // F#/Gb
    BLUE: 'hsl(200, 80%, 65%)',        // G
    BLUE_VIOLET: 'hsl(230, 80%, 65%)', // A
    MAGENTA: 'hsl(290, 80%, 65%)',     // Bb
    PINK_RED: 'hsl(320, 80%, 65%)',    // B
}

/**
 * Maps pitch classes to colors using a chromatic circle (color wheel).
 * Creates smooth gradients within scales while keeping each pitch class consistent.
 * Pastel palette for modern, elegant appearance.
 */
export const PITCH_CLASS_TO_COLOR = {
    0: COLORS.RED,          // C
    // 1: no note
    2: COLORS.ORANGE,       // D
    3: COLORS.YELLOW_GREEN, // D#/Eb
    4: COLORS.GREEN_YELLOW, // E
    5: COLORS.GREEN,        // F
    6: COLORS.CYAN,         // F#/Gb
    7: COLORS.BLUE,         // G
    // 8: no note
    9: COLORS.BLUE_VIOLET,  // A
    10: COLORS.MAGENTA,     // A#/Bb
    11: COLORS.PINK_RED,    // B
};

/**
 * Color helpers for common alpha variants.
 */
export const COLOR_ALPHA = {
    WHITE: (alpha) => `rgba(255, 255, 255, ${alpha})`,
    BLACK: (alpha) => `rgba(0, 0, 0, ${alpha})`,
};

/**
 * Visual adjustments per playback state.
 */
export const PLAYBACK_VISUALS = {
    playing: { opacity: 1, desaturate: 0 },
    paused: { opacity: 0.7, desaturate: 0.3 },
    stopped: { opacity: 0.5, desaturate: 1 },
};

/**
 * Converts a MIDI number to its corresponding color.
 * @param {number} midiNumber - The MIDI note number (0-127).
 * @returns {string} - The HSL color string for the pitch class.
 */
export function midiToColor(midiNumber) {
    const pitchClass = midiToPitchClass(midiNumber);
    return PITCH_CLASS_TO_COLOR[pitchClass];
}