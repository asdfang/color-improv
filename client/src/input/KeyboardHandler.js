import { KEY_MAPPINGS, NOTE_EVENTS } from "../constants";
import { dispatchNoteEvent } from "../utils";
/** @import { AudioEngine } from '../audio/AudioEngine.js' */
/** @typedef {import('../constants').NoteEventName} NoteEventName */

/**
 * @param {string} code
 * @returns {(typeof KEY_MAPPINGS)[keyof typeof KEY_MAPPINGS] | null}
 */
function getKeyMapping(code) {
    if (!(code in KEY_MAPPINGS)) return null;
    return KEY_MAPPINGS[/** @type {keyof typeof KEY_MAPPINGS} */ (code)];
}

/**
 * Handles keyboard input only for playing notes.
 */
export class KeyboardHandler {
    /**
     * @param {AudioEngine} audioEngine 
     */
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.activeKeys = /** @type {Set<string>} */ (new Set());

        // Bind event handlers to preserve 'this' context
        this.handleKeyDown = this.handleKeyDown.bind(this);
        this.handleKeyUp = this.handleKeyUp.bind(this);
        this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
        this.handleBlur = this.handleBlur.bind(this);
    }

    enable() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        document.addEventListener('visibilitychange', this.handleVisibilityChange);
        window.addEventListener('blur', this.handleBlur);
    }

    disable() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
        document.removeEventListener('visibilitychange', this.handleVisibilityChange);
        window.removeEventListener('blur', this.handleBlur);

        // Stop active notes
        this.releaseAllKeys();
    }

    /**
     * @param {KeyboardEvent} event 
     * @returns 
     */
    handleKeyDown(event) {
        if (event.repeat) return; // Ignore key auto-repeats
        if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) return; // Let browser shortcuts through
        if (document.querySelector('dialog[open]')) return; // Don't capture input when a dialog is open  
        
        const mapping = getKeyMapping(event.code);
        if (!mapping) return; // Not a mapped key
        const { midiNumber } = mapping;

        event.preventDefault(); // Prevent default browser actions like scrolling

        if (this.activeKeys.has(event.code)) return; // Already active

        // Play note and track key
        this.audioEngine.playNote(event.code, midiNumber);
        this.activeKeys.add(event.code);

        dispatchNoteEvent(NOTE_EVENTS.START, event.code, midiNumber);
    }

    /**
     * @param {KeyboardEvent} event 
     * @returns 
     */
    handleKeyUp(event) {
        const mapping = getKeyMapping(event.code);
        if (!mapping || document.querySelector('dialog[open]')) return; // Not a mapped key or dialog is open
        const { midiNumber } = mapping;

        event.preventDefault(); // Prevent default browser actions like scrolling

        if (!this.activeKeys.has(event.code)) return; // Not active

        // Stop note and untrack key
        this.audioEngine.stopNote(event.code, midiNumber);
        this.activeKeys.delete(event.code);

        dispatchNoteEvent(NOTE_EVENTS.END, event.code, midiNumber);
    }

    handleVisibilityChange() {
        if (document.hidden) {
            this.releaseAllKeys();
        }
    }

    handleBlur() {
        this.releaseAllKeys();
    }

    releaseAllKeys() {
        for (const code of this.activeKeys) {
            const mapping = getKeyMapping(code);
            if (mapping) {
                const { midiNumber } = mapping;
                this.audioEngine.stopNote(code, midiNumber);
                dispatchNoteEvent(NOTE_EVENTS.END, code, midiNumber);
            }
        }
        this.activeKeys.clear();
    }

    getActiveKeys() {
        return Array.from(this.activeKeys);
    }
}