import { KEY_MAPPINGS } from "/src/constants.js";

/**
 * Handles keyboard input only for playing notes.
 */
export class KeyboardHandler {
    constructor(audioEngine) {
        this.audioEngine = audioEngine;
        this.activeKeys = new Set();

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

    handleKeyDown(event) {
        if (event.repeat) return; // Ignore key auto-repeats
        if (event.metaKey || event.ctrlKey || event.altKey) return; // Let browser shortcuts through
        
        const mapping = KEY_MAPPINGS[event.code];
        if (!mapping) return; // Not a mapped key
        const { midiNumber } = mapping;

        event.preventDefault(); // Prevent default browser actions like scrolling

        if (this.activeKeys.has(event.code)) return; // Already active

        // Play note and track key
        this.audioEngine.playNote(event.code, midiNumber);
        this.activeKeys.add(event.code);

        this.dispatchNoteEvent('notestart', event.code, midiNumber);
    }

    handleKeyUp(event) {
        const mapping = KEY_MAPPINGS[event.code];
        if (!mapping) return; // Not a mapped key
        const { midiNumber } = mapping;

        event.preventDefault(); // Prevent default browser actions like scrolling

        if (!this.activeKeys.has(event.code)) return; // Not active

        // Stop note and untrack key
        this.audioEngine.stopNote(event.code, midiNumber);
        this.activeKeys.delete(event.code);

        this.dispatchNoteEvent('noteend', event.code, midiNumber);
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
            const mapping = KEY_MAPPINGS[code];
            if (mapping) {
                const { midiNumber } = mapping;
                this.audioEngine.stopNote(code, midiNumber);
                this.dispatchNoteEvent('noteend', code, midiNumber);
            }
        }
        this.activeKeys.clear();
    }

    /**
     * Dispatches a custom note event, mainly for UI updates.
     * @param {'notestart' | 'noteend'} eventName 
     * @param {string} keyCode KeyboardEvent.code
     * @param {number} midiNumber
     */
    dispatchNoteEvent(eventName, keyCode, midiNumber) {
        const event = new CustomEvent(eventName, {
            detail: {
                uniqueID: keyCode,
                midiNumber,
                timestamp: performance.now(),
            }
        });
        document.dispatchEvent(event);
    }

    getActiveKeys() {
        return Array.from(this.activeKeys);
    }
}

