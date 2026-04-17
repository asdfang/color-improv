/**
 * Color constants and utilities for ColorImprov visual rendering.
 */

import { midiToPitchClass } from '../audio/audio-utils';

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
 * @type {Record<number, string>}
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
 * @param {number} alpha - Opacity value between 0 and 1.
 * @returns {string} - The RGBA color string with the specified alpha.
 * @type {{ WHITE: (alpha: number) => string, BLACK: (alpha: number) => string }}
 */
export const COLOR_ALPHA = {
    WHITE: (alpha) => `rgba(255, 255, 255, ${alpha})`,
    BLACK: (alpha) => `rgba(0, 0, 0, ${alpha})`,
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