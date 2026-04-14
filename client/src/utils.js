/** @import { NoteEventName } from '/src/constants.js' */

/**
 * Dispatches a note event with the specified parameters.
 * For ease, KeyboardHandler and touch input both use KeyCode,
 * so active notes can be tracked in a single set.
 * @param {NoteEventName} eventName 
 * @param {string} uniqueID 
 * @param {number} midiNumber 
 */
export function dispatchNoteEvent(eventName, uniqueID, midiNumber) {
    const event = new CustomEvent(eventName, {
        detail: {
            uniqueID,
            midiNumber,
            timestamp: performance.now(),
        }
    });
    document.dispatchEvent(event);
}