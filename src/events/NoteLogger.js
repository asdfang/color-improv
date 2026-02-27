/**
 * NoteLogger listens for custom note events ('notestart' | 'noteend') dispatched by input handlers, and logs them.
 * Uses TimingEngine as central clock.
 */

export class NoteLogger {
    constructor(timingEngine) {
        // Use TimingEngine as central clock
        this.timingEngine = timingEngine;
        this.events = [];
        this.backingTrack = null;
        this.difficulty = null;

        this.handleNoteEvent = this.handleNoteEvent.bind(this);
    }

    /**
     * Start logging note events. Listens for 'notestart' and 'noteend' events dispatched by KeyboardHandler.
     * (TODO: extend to other input types).
     * @param {string} backingTrack the backing track being used (e.g., 'blues')
     * @param {string} difficulty the difficulty level (hard/medium/easy)
     */
    start(backingTrack, difficulty) {
        this.events = []; // Clear previous logs
        this.backingTrack = backingTrack;
        this.difficulty = difficulty;
        
        document.addEventListener('notestart', this.handleNoteEvent);
        document.addEventListener('noteend', this.handleNoteEvent);
    }

    /**
     * Stop logging, remove event listeners, and return collected events with session metadata.
     * @returns {{backingTrack: string,difficulty: string, events: Array<{object}>}} logged data
     */
    stop() {
        document.removeEventListener('notestart', this.handleNoteEvent);
        document.removeEventListener('noteend', this.handleNoteEvent);

        const log = {
            backingTrack: this.backingTrack,
            difficulty: this.difficulty,
            events: this.events,
        }
        this.backingTrack = null;
        this.difficulty = null;
        return log;
    }

    /**
     * Collects note events with elapsed time from beginning of backing track, then logs them.
     * @param {CustomEvent & {type: 'notestart'|'noteend'}} e note event from KeyboardHandler
     * (TODO: extended to include other inputs)
     */
    handleNoteEvent(e) {
        const timestamp = this.timingEngine.getCurrentTime() - this.timingEngine.getStartTime();
        const { midiNumber, uniqueID } = e.detail;
        const position = this.timingEngine.getCurrentPosition();

        this.logEvent(timestamp, e.type, midiNumber, uniqueID, position);
    }

    /**
     * 
     * @param {number} timestamp elapsed time (in seconds with sub-millisecond precision) from backing track start
     * @param {'notestart' | 'noteend'} eventType 
     * @param {number} midiNumber
     * @param {string} inputID key code that played the note
     * @param {*} position additional contextual information from TimingEngine
     * (TODO: extend to other input types)
     */
    logEvent(timestamp, eventType, midiNumber, inputID, position) {
        this.events.push({
            timestamp,
            eventType,
            inputID,
            midiNumber,
            position
        });
    }
}