import { SampleLoader } from "./SampleLoader";
import { AUDIO_CONFIG } from "/src/constants.js";
import { clampVolume } from "/src/audio/audio-utils.js";

/**
 * AudioEngine manages audio playback and Web Audio API interactions.
 * TODO: Constructor takes in sample list, backing track list, config options?
 */
export class AudioEngine {
    /**
     * Initializes the AudioEngine, creating AudioContext and SampleLoader.
     * Call initialize() after user interaction to prepare for playback.
     */
    constructor() {
        // Initialize AudioContext immediately to decode samples - state is 'suspended' until user interaction
        const AudioCtx = /** @type {typeof AudioContext} */ (window.AudioContext || window.webkitAudioContext);
        this.audioContext = new AudioCtx();
        console.log(`AudioEngine: AudioContext created. State: ${this.audioContext.state}`);
        console.log(`AudioEngine: Sample rate: ${this.audioContext.sampleRate}Hz`);    

        // Initialize SampleLoader with the AudioContext
        this.sampleLoader = new SampleLoader(this.audioContext);

        // Sample-related elements
        this.samples = new Map();           // Stores decoded AudioBuffers: MIDI Number -> decoded AudioBuffer
        this.activeSources = new Map();     // Keeps track of actively playing samples: uniqueID -> { midiNumber, sourceNode, gainNode }

        // Backing track elements
        this.backingTrackElement = null;    // HTMLAudioElement for backing track
        this.backingTrackSource = null;     // Web Audio API MediaElementAudioSourceNode for backing track
        this.backingTrackGain = null;       // GainNode for backing track volume control

        // Connect gain nodes to destination immediately (connect source nodes to gain nodes later)
        this.samplesMasterGain = this.audioContext.createGain();
        this.samplesMasterGain.gain.value = AUDIO_CONFIG.volumes.SAMPLES_MASTER_GAIN_DEFAULT;
        this.samplesMasterGain.connect(this.audioContext.destination);

        this.backingTrackGain = this.audioContext.createGain();
        this.backingTrackGain.gain.value = AUDIO_CONFIG.volumes.BACKING_TRACK_GAIN_DEFAULT;
        this.backingTrackGain.connect(this.audioContext.destination);

        // Debug/seek offset (for syncing timing when seeking via setDebugTime)
        this.seekOffset = 0;

        // Callback when backing track ends
        this.onEnded = null;

        // Loading state
        this.samplesLoaded = false;
        this.samplesLoadingPromise = null;
        this.samplesLoadingError = null;
        this.backingTrackCanPlayThrough = false;
        this.backingTrackCanPlayThroughPromise = null;
        this.backingTrackCanPlayThroughError = null;

        // Preloading samples and backing track in parallel
        this.samplesLoadingPromise = this.preloadSamples();
        this.backingTrackCanPlayThroughPromise = this.setUpBackingTrack();
    }

    /**
     * Preload all audio prior to user interaction, when AudioContext is in 'suspended' state.
     * Saves errors for initialize() to handle.
     * 
     * @returns {Promise<void>} Resolves when all samples are loaded.
     */
    async preloadSamples() {
        try {
            console.log('AudioEngine: Preloading samples...');
            const loadSamplesStartTime = performance.now();
            this.samples = await this.sampleLoader.loadTrumpetSamples(
                AUDIO_CONFIG.samples, AUDIO_CONFIG.paths.SAMPLES_BASE, AUDIO_CONFIG.format
            );

            this.samplesLoaded = true;
            console.log(`AudioEngine: All samples preloaded successfully in ${(performance.now() - loadSamplesStartTime).toFixed(2)}ms.`);
        } catch (error) {
            console.error('Error preloading samples in AudioEngine:', error);
            this.samplesLoadingError = error; // Store error for handling in initialize()
        }
    }

    /**
     * Set up backing track using MediaElementAudioSourceNode
     * to use HTML5 Audio element with Web Audio API's timing.
     * Saves errors for initialize() to handle.
     * 
     * @returns {Promise<void>} Resolves when backing track is ready to play through.
     */
    async setUpBackingTrack() {
        try {
            console.log('AudioEngine: Setting up backing track...');
            const loadBackingTrackStartTime = performance.now();

            // Create HTML5 Audio element to hold backing track
            this.backingTrackElement = new Audio(AUDIO_CONFIG.getBackingTrackPath('blues')); // TODO: avoid hardcoding
            this.backingTrackElement.loop = false;

            // Create and connect Web Audio API nodes: source ->  gain (already connected to destination)
            this.backingTrackSource = this.audioContext.createMediaElementSource(this.backingTrackElement);
            this.backingTrackSource.connect(this.backingTrackGain);

            // Listen for track end to reset app
            this.backingTrackElement.addEventListener('ended', () => {
                console.log('AudioEngine: Backing track ended');
                if (this.onEnded) this.onEnded();
            });

            // Convert event-based API into promise-based
            await new Promise((resolve, reject) => {
                // Wait for canplaythrough event to ensure track is fully buffered
                this.backingTrackElement.addEventListener('canplaythrough', () => {
                    this.backingTrackCanPlayThrough = true;

                    console.log(`AudioEngine: Backing track ready to play through in ${(performance.now() - loadBackingTrackStartTime).toFixed(2)}ms.`);
                    resolve();
                }, { once: true });
                this.backingTrackElement.addEventListener('error', reject, { once: true });

                this.backingTrackElement.load();
            });
        } catch (error) {
            console.error('AudioEngine: Error setting up backing track:', error);
            this.backingTrackCanPlayThroughError = error; // Store error for handling in initialize()
        }
    }

    /**
     * Initialize AudioEngine for playback. Only called after user interaction.
     * 
     * @returns {Promise<void>} Resolves when initialization is complete.
     */
    async initialize() {
        await this.samplesLoadingPromise; // Wait for samples to finish loading
        await this.backingTrackCanPlayThroughPromise; // Wait for backing track to be ready

        if (!this.samplesLoaded) {
            throw new Error(`AudioEngine initialization failed, samples failed to load: ${this.samplesLoadingError.message}`);
        }

        if (!this.backingTrackCanPlayThrough) {
            throw new Error(`AudioEngine initialization failed, backing track failed to load: ${this.backingTrackCanPlayThroughError.message}`);
        }

        // Resume AudioContext if suspended (requires user gesture)
        if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log(`AudioEngine: AudioContext resumed. State: ${this.audioContext.state}`);
        }

        // Check if AudioContext is successfully running
        if (this.audioContext.state !== 'running') {
            throw new Error(`AudioEngine initialization failed, failed to resume AudioContext: ${this.audioContext.state}`);
        }
    
        console.log('AudioEngine: Initialization complete, ready for playback.');
    }

    /**
     * Play a note based off of unique identifier (and MIDI number).
     * The same note/sample can be played multiple times simultaneously if inputID is different.
     * Examples:
     * - Keyboard key presses passes KeyboardEvent.code
     * - Touch input passes 'pointer-{pointerI}'
     * 
     * @param {string} inputID 
     * @param {number} midiNumber 
     * @returns {{midiNumber: number, sourceNode: AudioBufferSourceNode, gainNode: GainNode}|null} {source} or null if sample not found
     */
    playNote(inputID, midiNumber) {
        if (this.audioContext.state !== 'running') {
            console.warn('AudioEngine: Cannot play - AudioContext not running');
            return null;
        }

        const buffer = this.samples.get(midiNumber);
        if (!buffer) {
            console.warn(`AudioEngine: No sample found for MIDI number ${midiNumber}`);
            return null;
        }

        // Handle rapid re-triggering (fade out takes time)
        if (this.activeSources.has(inputID)) {
            this.stopNote(inputID, midiNumber); // Stop existing note for this inputID first
        }

        // Create Web Audio AudioBufferSourceNode (one-shot)
        const sourceNode = this.audioContext.createBufferSource();
        sourceNode.buffer = buffer;

        // Create individual gain node (for later fade out on stop)
        const gainNode = this.audioContext.createGain();
        gainNode.gain.value = 1.0; // Start at full volume

        // Connect nodes: source -> gain -> master gain (already connected to destination)
        sourceNode.connect(gainNode);
        gainNode.connect(this.samplesMasterGain);

        // Start playing note
        sourceNode.start()
        this.activeSources.set(inputID, { midiNumber, sourceNode, gainNode });
        
        // Clean up when sample ends when either:
        // 1) sample ends before user releases input, or
        // 2) fade out from stopNote completes
        sourceNode.onended = () => {
            const current = this.activeSources.get(inputID);

            // Only delete if same sourceNode (may have been rapidly retriggered)
            if (current && current.sourceNode === sourceNode) {
                this.activeSources.delete(inputID);
            }
        };

        return { midiNumber, sourceNode, gainNode };
    }

    /**
     * Stop a note based off of unique identifier (and MIDI number).
     * This occurs when the input is released before the sample ends.
     * @param {string} inputID 
     * @param {number} midiNumber 
     * @returns 
     */
    stopNote(inputID, midiNumber) {
        const active = this.activeSources.get(inputID);

        if (!active) {
            console.warn(`AudioEngine: No active note found for inputID ${inputID} to stop`);
            return;
        }

        if (active.midiNumber !== midiNumber) {
            console.warn(`AudioEngine: Active note MIDI ${active.midiNumber} does not match requested stop MIDI ${midiNumber} for inputID ${inputID}`);
            // Still proceed to stop note with inputID
        }

        const { sourceNode, gainNode } = active; // midiNumber not needed

        // Fade out for more natural stoppage of sound
        const now = this.audioContext.currentTime;
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + AUDIO_CONFIG.volumes.NOTE_FADE_TIME_DEFAULT);

        // Stop source after fade completes
        sourceNode.stop(now + AUDIO_CONFIG.volumes.NOTE_FADE_TIME_DEFAULT);
        this.activeSources.delete(inputID);
    }

    /**
     * Play backing track from the beginning, or resume if paused.
     * Caller handles play promise for autoplay policy.
     * 
     * @returns {{startTime: number, playPromise: Promise<void>}|null} {startTime, playPromise} or null if cannot play.
     */
    playBackingTrack() {
        if (this.audioContext.state !== 'running') {
            console.warn('AudioEngine: Cannot play backing track - AudioContext not running');
            return null;
        }

        if (!this.backingTrackElement) {
            console.warn('AudioEngine: Backing track not initialized');
            return null;
        }

        const playPromise = this.backingTrackElement.play();
        console.log('AudioEngine: Start time: ', this.audioContext.currentTime);
        return {
            startTime: this.audioContext.currentTime,
            playPromise
        };
    }

    /**
     * Stop backing track playback and reset to beginning.
     */
    stopBackingTrack() {
        if (!this.backingTrackElement) return;

        this.backingTrackElement.pause();
        this.backingTrackElement.currentTime = 0;
    }

    /**
     * Pause backing track playback, and keeps position.
     */
    pauseBackingTrack() {
        if (!this.backingTrackElement) return;

        this.backingTrackElement.pause();
    }

    /**
     * Set backing track volume, clamped to valid range [0.0, 1.0].
     * @param {number} volume 
     * @returns 
     */
    setBackingTrackVolume(volume) {
        if (!this.backingTrackGain) return;

        this.backingTrackGain.gain.value = clampVolume(volume);
    }

    /**
     * Set samples master volume, clamped to valid range [0.0, 1.0].
     * @param {number} volume 
     * @returns 
     */
    setSamplesMasterVolume(volume) {
        if (!this.samplesMasterGain) return;
        
        this.samplesMasterGain.gain.value = clampVolume(volume);
    }

    /**
     * Stop all currently playing samples, when user hits stop, changes tab, etc.
     */
    stopAllSamples() {
        for (const [inputID, { midiNumber }] of this.activeSources.entries()) {
            this.stopNote(inputID, midiNumber);
        }
    }

    /**
     * Stop all sound.
     */
    stopAllSound() {
        this.stopAllSamples();
        this.stopBackingTrack();
    }

    /**
     * Get list of currently active MIDI numbers, including duplicates.
     * Useful for visualization, etc.
     * @returns {number[]} Array of currently active MIDI numbers.
     */
    getActiveMIDINumbers() {
        return Array.from(this.activeSources.values()).map(active => active.midiNumber);
    }

    /**
     * Get unique set of currently active MIDI numbers.
     * Useful for analysis, etc.
     * @returns {Set<number>} Set of uniquely active MIDI numbers.
     */
    getUniqueMIDINumbers() {
        return new Set(this.getActiveMIDINumbers());
    }

    /**
     * Get current time of AudioContext, adjusted for any debug seeks.
     * If doesn't exist, fail fast.
     * @returns 
     */
    getCurrentTime() {
        return this.audioContext.currentTime + this.seekOffset;
    }

    /**
     * 
     * @returns {boolean} - whether or not AudioContext is ready for playback
     */
    isReady() {
        return this.samplesLoaded &&
               this.backingTrackCanPlayThrough &&
               this.audioContext.state === 'running';
    }

    /**
     * DEBUG: Set current playback time (for testing/debugging).
     * Seeks the backing track and adjusts timing to match audio position.
     * @param {number} seconds - Time in seconds to seek to
     */
    setDebugTime(seconds) {
        if (this.backingTrackElement) {
            this.backingTrackElement.currentTime = seconds;
            // Adjust seekOffset so getCurrentTime() returns the desired position
            this.seekOffset = seconds - this.audioContext.currentTime;
            console.log(`AudioEngine DEBUG: Seeking to ${seconds}s, seekOffset=${this.seekOffset.toFixed(3)}`);
        }
    }

    async dispose() {
        this.stopAllSound();
        
        if (this.audioContext) {
            await this.audioContext.close();
            this.audioContext = null;
        }

        console.log('AudioEngine: Disposed and AudioContext closed.');
    }
}