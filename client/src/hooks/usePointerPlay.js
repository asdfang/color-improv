import { useRef, useEffect } from 'react';
import { useStudio } from '/src/contexts/StudioContext';
import { dispatchNoteEvent } from '/src/utils.js';
import { NOTE_EVENTS } from '/src/constants.js';

/** @typedef {import('/src/visual/grid-data.js').KeyCode} KeyCode */
/** @typedef {{ keyCode: KeyCode, midiNumber: number }} PointerData */

/** 
 * Custom hook to handle pointer interactions for playing notes on the grid.
 * Provides handlers for pointer down, enter, leave, up, and cancel events.
 * Note: for convenience, all pointer events still use keyCode as the uniqueID.
 */
export function usePointerPlay() {
    const { audioEngine } = useStudio();
    const activePointers = useRef(/** @type {Map<number, PointerData>} */ (new Map()));

    /**
     * Triggers note when pointer enters a cell if pointer slides from another.
     * Note: its first touch must have been a NoteCell.
     * @param {number} pointerId 
     * @param {KeyCode} keyCode 
     * @param {number} midiNumber 
     */
    const handlePointerEnter = (pointerId, keyCode, midiNumber) => {
        const isActive = activePointers.current.get(pointerId)?.keyCode === keyCode;
        if (activePointers.current.has(pointerId) && !isActive) {
            audioEngine.playNote(keyCode, midiNumber);
            activePointers.current.set(pointerId, { keyCode, midiNumber });
            dispatchNoteEvent(NOTE_EVENTS.START, keyCode, midiNumber);
        }
    };

    /**
     * Triggers note if the cell was not already playing a note.
     * @param {number} pointerId 
     * @param {KeyCode} keyCode 
     * @param {number} midiNumber 
     */
    const handlePointerDown = (pointerId, keyCode, midiNumber) => {
        const isActive = activePointers.current.get(pointerId)?.keyCode === keyCode;
        activePointers.current.set(pointerId, { keyCode, midiNumber });
        if (!isActive) {
            audioEngine.playNote(keyCode, midiNumber);
            dispatchNoteEvent(NOTE_EVENTS.START, keyCode, midiNumber);
        }
    };

    /**
     * Stops note if cell is active when pointer released or cancelled.
     * @param {number} pointerId 
     * @param {KeyCode} keyCode 
     * @param {number} midiNumber 
     */
    const handlePointerUpOrCancel = (pointerId, keyCode, midiNumber) => {
        const isActive = activePointers.current.get(pointerId)?.keyCode === keyCode;
        activePointers.current.delete(pointerId);
        if (isActive) {
            audioEngine.stopNote(keyCode, midiNumber);
            dispatchNoteEvent(NOTE_EVENTS.END, keyCode, midiNumber);
        }
    }

    /**
     * Stops note if cell is active when pointer leaves the cell.
     * @param {number} pointerId 
     * @param {KeyCode} keyCode 
     * @param {number} midiNumber 
     */
    const handlePointerLeave = (pointerId, keyCode, midiNumber) => {
        const wasActive = activePointers.current.get(pointerId)?.keyCode === keyCode;
        if (activePointers.current.has(pointerId) && wasActive) {
            audioEngine.stopNote(keyCode, midiNumber);
            dispatchNoteEvent(NOTE_EVENTS.END, keyCode, midiNumber);
        }
    };

    useEffect(() => {
        /**
         * Cleans up active pointer data if released off the grid.
         * Note: does not need to stop a note - would have been stopped on pointerleave.
         * @param {PointerEvent} e
         */
        const handleDocumentPointerUpOrCancel = (e) => {
            activePointers.current.delete(e.pointerId);
        }
        document.addEventListener('pointerup', handleDocumentPointerUpOrCancel);
        document.addEventListener('pointercancel', handleDocumentPointerUpOrCancel);

        return () => {
            document.removeEventListener('pointerup', handleDocumentPointerUpOrCancel);
            document.removeEventListener('pointercancel', handleDocumentPointerUpOrCancel);
        };
    }, []);

    return { handlePointerEnter, handlePointerDown, handlePointerLeave, handlePointerUpOrCancel };
}