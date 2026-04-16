// TODO: investigate rAF stalling, esp. on iOS Simulator, ngrok. try-catch in tick()? visibility change handling? heartbeat fallback?

import {
    getBeatDuration, getBeatNumberInMeasure, getMeasureNumberInProgression, getChordInfo, getLoopsCompleted
} from '/src/timing/progression-data.js';
import { AUDIO_CONFIG, VISUAL_LEAD_TIME } from '/src/constants.js';
/** @import { AudioEngine } from '../audio/AudioEngine.js' */

/**
 * Manages timing and synchronization between audio and visual components.
 * Uses AudioEngine's clock as the central time source; does not manage playback.
 */
export class TimingEngine {
    /**
     * @param {AudioEngine} audioEngine 
     * @param {'blues'} trackKey 
     */
    constructor(audioEngine, trackKey = 'blues') {
        this.audioEngine = audioEngine;

        this.startTime = null;
        this.isPlaying = false;
        this.pausedAt = null;
        this.totalPausedDuration = 0;
        this.trackKey = trackKey;

        this.bpm = AUDIO_CONFIG.backingTracks[this.trackKey].bpm;
        this.beatDuration = getBeatDuration(this.bpm);
        this.silenceOffset = AUDIO_CONFIG.backingTracks[this.trackKey].silenceOffset;
        this.countInBeats = AUDIO_CONFIG.backingTracks[this.trackKey].countInBeats;
        this.maxLoops = AUDIO_CONFIG.backingTracks[this.trackKey].maxLoops; // for active chord highlighting

        // Internal state
        /** @type {{currentChord: string|null, nextChord: string|null, beatsUntilNextChord: number|null} | null} */
        this.lastEmitted = null;
        this.onBeatChange = null;
        this.rafId = null;
    }

    /**
     * Sets the callback function to be called when a beat change occurs.
     * Set to null for cleanup.
     * @param {function | null} callback 
     */
    setOnBeatChange(callback) {
        this.onBeatChange = callback;
    }

    /**
     * Uses requestAnimationFrame to check for beat changes and call the callback with information on beat changes.
     */
    tick() {
        const { currentChord, nextChord, beatsUntilNextChord } = this.getCurrentPosition(VISUAL_LEAD_TIME);
        if (this.lastEmitted === null ||
            currentChord !== this.lastEmitted.currentChord ||
            nextChord !== this.lastEmitted.nextChord ||
            beatsUntilNextChord !== this.lastEmitted.beatsUntilNextChord) {
            this.onBeatChange?.({ currentChord, nextChord, beatsUntilNextChord });
        }
        this.lastEmitted = { currentChord, nextChord, beatsUntilNextChord };
        this.rafId = requestAnimationFrame(() => this.tick());
    }

    /**
     * Start timer.
     */
    start() {
        if (!this.audioEngine.isReady()) {
            throw new Error('AudioEngine is not ready. Cannot start TimingEngine.');
        }
        if (this.isPlaying) return;
        this.startTime = this.audioEngine.getCurrentTime();
        this.isPlaying = true;
        this.totalPausedDuration = 0;
        this.tick();
    }

    /**
     * Pause timer, preserve start time.
     */
    pause() {
        if (!this.isPlaying) return;
        this.pausedAt = this.audioEngine.getCurrentTime();
        this.isPlaying = false;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
    }

    /**
     * Stop timer, reset start time.
     */
    stop() {
        this.isPlaying = false;
        this.startTime = null;
        this.pausedAt = null;
        if (this.rafId !== null) {
            cancelAnimationFrame(this.rafId);
            this.rafId = null;
        }
        this.setOnBeatChange(null);
        this.lastEmitted = null;
    }

    /**
     * Resume timer only from paused state.
     */
    resume() {
        if (!this.startTime) {
            throw new Error('TimingEngine has not been started yet. Cannot resume.');
        }
        if (this.pausedAt === null) {
            throw new Error('TimingEngine is not paused. Cannot resume.');
        }
        const pausedDuration = this.audioEngine.getCurrentTime() - this.pausedAt;
        this.totalPausedDuration += pausedDuration;
        this.pausedAt = null;
        this.isPlaying = true;
        this.tick();
    }

    /**
     * Get the AudioContext time when playback started. Useful for debugging and synchronization.
     * @returns {number|null} The start time in AudioContext time, or null if not started.
     */
    getStartTime() {
        return this.startTime;
    }

    /**
     * Get the current AudioContext time.
     * @returns {number} The current time in AudioContext time.
     */
    getCurrentTime() {
        return this.audioEngine.getCurrentTime();
    }

    /**
     * Get the current position in the progression.
     * Returns timing information including phase, beat/measure numbers, chord progression,
     * and fractional beat progress.
     * 
     * @param {number} [leadTime=0] Optional lead time in seconds to look ahead for visual anticipation.
     * @returns {{phase: string, beatNumberInMeasure: number|null, measureNumberInProgression: number|null,
     * currentChord: string|null, nextChord: string, beatsUntilNextChord: number|null,
     * loopsCompleted: number, beatProgress: number|null
     * }} Position object with timing and chord information. Phase can be 'waiting', 'count-in', or 'playing'.
     * beatProgress is a fractional value (0-1) indicating position within the current beat, used for visualizations.
     */
    getCurrentPosition(leadTime = 0) {
        // If not playing, return nulls
        if (!this.isPlaying || this.startTime === null) {
            return {
                phase: 'waiting',
                beatNumberInMeasure: null,
                measureNumberInProgression: null,
                currentChord: null,
                nextChord: 'C7', 
                beatsUntilNextChord: null,
                loopsCompleted: 0,
                beatProgress: null,
            }
        }

        const elapsedTotalTime = this.audioEngine.getCurrentTime() - this.startTime - this.totalPausedDuration + leadTime;
        const elapsedTimeSinceSilence = elapsedTotalTime - this.silenceOffset;
        const elapsedTimeFromProgressionStart = elapsedTotalTime - (this.silenceOffset + this.countInBeats * this.beatDuration);

        // Before progression starts (in silence or count-in)
        if (elapsedTimeFromProgressionStart < 0) {
            const inSilence = elapsedTotalTime < this.silenceOffset;
            return {
                phase: inSilence ? 'waiting' : 'count-in',
                beatNumberInMeasure: null,
                measureNumberInProgression: null,
                currentChord: null,
                nextChord: 'C7', // First chord of progression
                beatsUntilNextChord: elapsedTotalTime < this.silenceOffset ? null : Math.ceil(-elapsedTimeFromProgressionStart / this.beatDuration),
                loopsCompleted: 0,
                beatProgress: inSilence ? null : (elapsedTimeSinceSilence / this.beatDuration) % 1,
            }
        }
            
        // Else, during progression
        const elapsedBeats = Math.floor(elapsedTimeFromProgressionStart / this.beatDuration); // 0-indexed, integer
        const { currentChord, nextChord, beatsUntilNextChord } = getChordInfo(elapsedBeats);
        return {
            phase: 'playing',
            beatNumberInMeasure: getBeatNumberInMeasure(elapsedBeats), // beat number within measure
            measureNumberInProgression: getMeasureNumberInProgression(elapsedBeats), // measure number within progression
            currentChord: getLoopsCompleted(elapsedBeats) <= this.maxLoops ? currentChord : 'C7', // Ends on C7
            nextChord,
            beatsUntilNextChord,
            loopsCompleted: getLoopsCompleted(elapsedBeats),
            beatProgress: (elapsedTimeFromProgressionStart / this.beatDuration) % 1,
        }
    }
}