import { useState, useEffect } from 'react';
import { NOTE_EVENTS } from '../constants';

/** @typedef {import('../constants').NoteEvent} NoteEvent */

export function useActiveNotes() {
    const [activeNotes, setActiveNotes] = useState(new Set());

    /** 
     * Adds note's uniqueID to activeNotes set on 'notestart'.
     * @param {Event} event
     */
    function handleNoteStart(event) {
        const e = /** @type {NoteEvent} */ (event);
        setActiveNotes(prev => new Set(prev).add(e.detail.uniqueID));
    }

    /** 
     * Removes note's uniqueID from activeNotes set on 'noteend'.
     * @param {Event} event
     */
    function handleNoteEnd(event) {
        const e = /** @type {NoteEvent} */ (event);
        setActiveNotes(prev => {
            const newSet = new Set(prev);
            newSet.delete(e.detail.uniqueID);
            return newSet;
        });
    }

    useEffect(() => {
        document.addEventListener(NOTE_EVENTS.START, handleNoteStart);
        document.addEventListener(NOTE_EVENTS.END, handleNoteEnd);

        return () => {
            document.removeEventListener(NOTE_EVENTS.START, handleNoteStart);
            document.removeEventListener(NOTE_EVENTS.END, handleNoteEnd);
        };
    }, []);

    return activeNotes;
}