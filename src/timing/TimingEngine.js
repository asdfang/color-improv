import {
    getBeatDuration, getBeatNumberInMeasure, getMeasureNumberInProgression, getChordInfo, getLoopsCompleted
} from '/src/timing/progression-data.js';
import { AUDIO_CONFIG } from '/src/constants.js';

const VISUAL_LEAD_TIME = 0.1; // seconds (100 ms)

/**
 * Manages timing and synchronization between audio and visual components.
 * Uses AudioEngine's clock as the time source, but does not manage playback.
 */
export class TimingEngine {
    constructor(audioEngine, trackKey = 'blues') {
        this.audioEngine = audioEngine;

        this.startTime = null;
        this.isPlaying = false;
        this.pausedAt = null;
        this.trackKey = trackKey;

        this.bpm = AUDIO_CONFIG.backingTracks[this.trackKey].bpm;
        this.beatDuration = getBeatDuration(this.bpm);
        this.silenceOffset = AUDIO_CONFIG.backingTracks[this.trackKey].silenceOffset;
        this.countInBeats = AUDIO_CONFIG.backingTracks[this.trackKey].countInBeats;
        this.maxLoops = AUDIO_CONFIG.backingTracks[this.trackKey].maxLoops; // for active chord highlighting
    }

    /**
     * Start timer.
     */
    start() {
        if (!this.audioEngine.isReady()) {
            throw new Error('AudioEngine is not ready. Cannot start TimingEngine.');
        }
        this.startTime = this.audioEngine.getCurrentTime();
        this.isPlaying = true;

        console.log(`TimingEngine started at AudioContext time ${this.startTime.toFixed(2)}s`);
    }

    /**
     * Pause timer, preserve start time.
     */
    pause() {
        if (!this.isPlaying) return;
        this.pausedAt = this.audioEngine.getCurrentTime();
        this.isPlaying = false;
    }

    /**
     * Stop timer, reset start time.
     */
    stop() {
        this.isPlaying = false;
        this.startTime = null;
        this.pausedAt = null;
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
        this.startTime += pausedDuration;
        this.pausedAt = null;
        this.isPlaying = true;
    }

    /**
     * Get the current position in the progression.
     * Returns timing information including phase, beat/measure numbers, chord progression,
     * and fractional beat progress.
     * 
     * @returns {{phase: string, beatNumberInMeasure: number|null, measureNumberInProgression: number|null,
     * currentChord: string|null, nextChord: string, beatsUntilNextChord: number|null,
     * loopsCompleted: number, beatProgress: number|null
     * }} Position object with timing and chord information. Phase can be 'waiting', 'count-in', or 'playing'.
     * beatProgress is a fractional value (0-1) indicating position within the current beat, used for visualizations.
     */
    getCurrentPosition() {
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

        const elapsedTotalTime = this.audioEngine.getCurrentTime() - this.startTime + VISUAL_LEAD_TIME;
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