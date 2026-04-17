import { NOTE_EVENTS } from '../constants';

/** @typedef {import('../constants').NoteEvent} NoteEvent */
/** @typedef {import('../constants').NoteEventName} NoteEventName */
/** @typedef {import('../constants').BackingTrackKey} BackingTrackKey */
/** @typedef {import('../constants').PreferenceDifficulty} PreferenceDifficulty */
/** @typedef {import('../timing/TimingEngine').TimingEngine} TimingEngine */

/**
 * @typedef {{
 *   timestamp: number,
 *   eventType: NoteEventName,
 *   inputID: string,
 *   midiNumber: number,
 *   position: any,
 * }} LoggedNoteEvent
 */

/**
 * @typedef {{
 *   backingTrack: BackingTrackKey | null,
 *   difficulty: PreferenceDifficulty | null,
 *   events: LoggedNoteEvent[],
 * }} NoteLog
 */

/**
 * NoteLogger listens for custom note events ('notestart' | 'noteend') dispatched by input handlers, and logs them.
 * Uses TimingEngine as central clock.
 */

export class NoteLogger {
    /** @param {TimingEngine} timingEngine */
    constructor(timingEngine) {
        // Use TimingEngine as central clock
        this.timingEngine = /** @type {TimingEngine} */ (timingEngine);
        this.events = /** @type {LoggedNoteEvent[]} */ ([]);
        this.backingTrack = /** @type {BackingTrackKey | null} */ (null);
        this.difficulty = /** @type {PreferenceDifficulty | null} */ (null);

        this.handleNoteEvent = this.handleNoteEvent.bind(this);
    }

    /**
     * Start logging note events. Listens for 'notestart' and 'noteend' events dispatched by KeyboardHandler.
      * @param {BackingTrackKey} backingTrack the backing track being used (e.g., 'blues')
      * @param {PreferenceDifficulty} difficulty the difficulty level (hard/medium/easy)
     */
    start(backingTrack, difficulty) {
        this.events = []; // Clear previous logs
        this.backingTrack = backingTrack;
        this.difficulty = difficulty;
        
        document.addEventListener(NOTE_EVENTS.START, this.handleNoteEvent);
        document.addEventListener(NOTE_EVENTS.END, this.handleNoteEvent);
    }

    /**
     * Stop logging, remove event listeners, and return collected events with session metadata.
     * @returns {NoteLog} logged data
     */
    stop() {
        document.removeEventListener(NOTE_EVENTS.START, this.handleNoteEvent);
        document.removeEventListener(NOTE_EVENTS.END, this.handleNoteEvent);

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
     * @param {Event} event note event from KeyboardHandler
     */
    handleNoteEvent(event) {
        const e = /** @type {NoteEvent} */ (event);
        const startTime = this.timingEngine.getStartTime();
        if (startTime === null) return;
        const timestamp = this.timingEngine.getCurrentTime() - startTime;
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