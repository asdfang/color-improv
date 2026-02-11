/**
 * Define 12-bar blues progression structure
 */

/**
 * 12-bar blues progression data - each element is a measure.
 * Assumes harmonic rhythm of one chord per measure.
 */
export const TWELVE_BAR_BLUES = [
    'C7', 'C7', 'C7', 'C7', 'F7', 'F7', 'C7', 'C7', 'G7', 'F7', 'C7', 'G7',
];

export const TOTAL_MEASURES = TWELVE_BAR_BLUES.length; // 12 measures

export const BEATS_PER_MEASURE = 4;

export const TOTAL_BEATS = TOTAL_MEASURES * BEATS_PER_MEASURE; // 12 measures * 4 beats each = 48 beats

export const DEFAULT_BPM = 120;

/**
 * Get beat duration in seconds
 * @param {*} bpm beats per minute
 * @returns {number}
 */
export const getBeatDuration = (bpm = DEFAULT_BPM) => {
    return 60 / bpm; // in seconds
}

/**
 * Get beat number within the measure, in the musical sense.
 * @param {number} elapsedBeats - number of beats elapsed since the start of the progression (0-indexed, integer)
 * @returns {number} 1, 2, 3, or 4 if BEATS_PER_MEASURE is 4
 */
export function getBeatNumberInMeasure(elapsedBeats) {
    return (elapsedBeats % BEATS_PER_MEASURE) + 1; // 1-indexed
}

/**
 * Get index of measure within the progression, 0-indexed
 * @param {number} elapsedBeats - number of beats elapsed since the start of the progression (0-indexed, integer)
 * @returns {number} 0-47 if TOTAL_BEATS is 48
 */
export function getMeasureIndex(elapsedBeats) {
    return Math.floor((elapsedBeats / BEATS_PER_MEASURE) % TOTAL_MEASURES); // 0-indexed
}

/**
 * Get measure number within the progression, in the musical sense.
 * @param {number} elapsedBeats - number of beats elapsed since the start of the progression (0-indexed, integer)
 * @returns {number} - 1-12 for the 12-bar blues
 */
export function getMeasureNumberInProgression(elapsedBeats) {
    return getMeasureIndex(elapsedBeats) + 1; // 1-indexed
}

/**
 * Get chord information at a given elapsed beat
 * @param {number} elapsedBeats - number of beats elapsed since the start of the progression (0-indexed, integer)
 * @returns {{currentChord: string, nextChord: string, beatsUntilNextChord: number}}
 */
export function getChordInfo(elapsedBeats) {
    const currMeasureIdx = getMeasureIndex(elapsedBeats);
    const currentChord = TWELVE_BAR_BLUES[currMeasureIdx];
    let i = currMeasureIdx;

    // Find next different chord
    while (TWELVE_BAR_BLUES[i] === currentChord) {
        i = (i + 1) % TOTAL_MEASURES;
    }

    return {
        currentChord: currentChord,
        nextChord: TWELVE_BAR_BLUES[i],
        // nextChord happens at elapsedBeats = (i * BEATS_PER_MEASURE) - could be in next loop
        beatsUntilNextChord: ((i * BEATS_PER_MEASURE) - (elapsedBeats % TOTAL_BEATS) + TOTAL_BEATS) % TOTAL_BEATS,
    }
}

/**
 * Get number of loops completed given elapsed beats
 * @param {number} elapsedBeats - number of beats elapsed since the start of the progression (0-indexed, integer)
 * @returns {number} number of loops completed
 */
export function getLoopsCompleted(elapsedBeats) {
    return Math.floor(elapsedBeats / TOTAL_BEATS);
}