import { AudioEngine } from '/src/audio/AudioEngine.js';
import { TimingEngine } from '/src/timing/TimingEngine.js';
import { Renderer } from '/src/visual/Renderer.js';
import { KeyboardHandler } from '/src/input/KeyboardHandler.js';
import { PlaybackControls } from '/src/ui/PlaybackControls.js';
import { VolumeControls } from '/src/ui/VolumeControls.js';
import { DifficultyControls } from '/src/ui/DifficultyControls.js';
import { LocalStorageBackend } from '/src/api/LocalStorageBackend';
import { PreferencesManager } from '/src/preferences/PreferencesManager.js';
import { keyToGridCoordinates } from '/src/visual/grid-data';

/** @typedef {'STOPPED' | 'PLAYING' | 'PAUSED'} PlaybackState */

class ColorImprovApp {
    constructor() {
        // State variables
        this.audioInitialized = false;
        /** @type {PlaybackState} */
        this.state = 'STOPPED';
        
        // Initialize components
        this.audioEngine = new AudioEngine();
        this.timingEngine = new TimingEngine(this.audioEngine, 'blues');
        const canvas = document.getElementById('mainCanvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('Main canvas element not found');
        }
        this.renderer = new Renderer(canvas);
        
        this.keyboardHandler = new KeyboardHandler(this.audioEngine);
        this.playbackControls = new PlaybackControls();
        this.volumeControls = new VolumeControls();
        this.difficultyControls = new DifficultyControls();
        this.errorElement = /** @type {HTMLElement} */ (document.getElementById('error-message'));

        this.animationFrameId = null;
    }
    
    /**
     * Initialize the main application: event listeners, renderer.
     * Note: AudioEngine initialization must be triggered by user interaction; done in play(), not here.
     */
    init() {
        try {
            console.log('Initializing Color Improv...');

            this.setUpEventListeners();

            // Initial mute button UI
            this.volumeControls.setMuted('backingTrack', this.audioEngine.isBackingTrackMuted());
            this.volumeControls.setMuted('samples', this.audioEngine.isSamplesMuted());

            // Initial difficulty display set in HTML

            // Render initial stopped grid before playback starts
            this.renderer.render();

            console.log('Color Improv initialized successfully.');
        } catch (error) {
            console.error('Failed to initialize Color Improv:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Set up event listeners for UI controls and input handling.
     */
    setUpEventListeners() {
        // Control button events
        this.playbackControls.enable({
            onPlay: () => this.play(),
            onPause: () => this.pause(),
            onStop: () => this.stop(),
            onResume: () => this.resume(),
        });

        // Volume control events
        this.volumeControls.enable({
            onVolumeChange: (source, volume) => this.setVolume(source, volume),
            onMuteToggle: (source) => this.toggleMute(source),
        });

        // Difficulty control events - no callbacks
        this.difficultyControls.enable();

        // Backing track end callback
        this.audioEngine.onEnded = () => this.stop();

        // Note events from KeyboardHandler
        document.addEventListener('notestart', /** @param {CustomEvent} e */ (e) => {
            const { row, col } = keyToGridCoordinates(e.detail.uniqueID);
            this.renderer.addActiveCell(row, col);
        });

        document.addEventListener('noteend', /** @param {CustomEvent} e */ (e) => {
            const { row, col } = keyToGridCoordinates(e.detail.uniqueID);
            this.renderer.removeActiveCell(row, col);
        });

        // Resize handling even when paused/stopped, outside of render loop
        window.addEventListener('resize', () => {
            this.renderer.resize();
            this.renderer.render();
        });
    }

    /**
     * Set volume for specified source.
     * @param {string} source 'backingTrack' | 'samples'
     * @param {number} volume from 0 to 1
     */
    setVolume(source, volume) {
        // Visual state automatic with sliders
        if (source === 'backingTrack') this.audioEngine.setBackingTrackVolume(volume);
        else if (source === 'samples') this.audioEngine.setSamplesMasterVolume(volume);
        else console.warn(`Unknown source '${source}' for volume change.`);
    }

    /**
     * Toggle mute state for specified source.
     * @param {string} source 'backingTrack' | 'samples'
     * @returns {boolean} whether muted after toggle
     */
    toggleMute(source) {
        if (source === 'backingTrack') {
            return this.audioEngine.toggleBackingTrackMute();
        } else if (source === 'samples') {
            return this.audioEngine.toggleSamplesMute();
        }
        console.warn(`Unknown source '${source}' for mute toggle.`);
        return false;
    }

    /**
     * From a user interaction, start playback, timing engine, and render loop.
     * Only from paused or stopped state.
     * Initialize AudioEngine on first play.
     */
    async play() {
        try {
            // Initialize on first play from user interaction
            if (!this.audioInitialized) {
                await this.audioEngine.initialize();
                this.audioInitialized = true;
            }

            // Clear any previous errors
            this.hideError();

            // Update state before starting render loop
            this.state = 'PLAYING';
            this.playbackControls.setPlaying();
            this.renderer.setPlaybackState('playing');

            this.audioEngine.playBackingTrack();
            this.timingEngine.start();
            this.keyboardHandler.enable();
            this.startRenderLoop();

            console.log('Playback started.');
        } catch (error) {
            console.error('Failed to play:', error);
            this.showError('Failed to start playback. Please try again or refresh the page.');
            // Reset to stopped state on error
            this.state = 'STOPPED';
            this.playbackControls.setStopped();
            this.renderer.setPlaybackState('stopped');
        }
    }

    /**
     * Pause playback, timing engine, and render loop.
     * Only from playing state.
     * Deactivates keyboard input.
     */
    pause() {
        this.state = 'PAUSED';
        this.playbackControls.setPaused();
        this.renderer.setPlaybackState('paused');
        // Renderer retains current chord highlighted only

        this.audioEngine.pauseBackingTrack();
        this.audioEngine.stopAllSamples(); // Stop ongoing samples
        this.timingEngine.pause();
        this.keyboardHandler.disable();
        this.stopRenderLoop();
        this.renderer.clearActiveCells(); // Probably redundant
        this.renderer.render(); // Render paused state

        console.log('Playback paused.');
    }

    /**
     * Resume playback, timing engine, and render loop.
     * Only from paused state.
     * Reactivates keyboard input.
     */
    resume() {
        this.state = 'PLAYING';
        this.playbackControls.setPlaying();
        this.renderer.setPlaybackState('playing');

        this.audioEngine.playBackingTrack();
        this.timingEngine.resume();
        this.keyboardHandler.enable();
        this.startRenderLoop();

        console.log('Playback resumed.');
    }

    /**
     * Stop playback, timing engine, and render loop.
     * Can be called from playing or paused state.
     * Deactivates keyboard input and resets renderer state.
     */
    stop() {
        this.state = 'STOPPED';
        this.playbackControls.setStopped();
        this.renderer.setPlaybackState('stopped');
        
        this.audioEngine.stopAllSound();
        this.timingEngine.stop();
        this.keyboardHandler.disable();
        this.stopRenderLoop();
        this.renderer.clearActiveCells(); // Probably redundant
        this.renderer.setCurrentChord(null);        
        this.renderer.render(); // Render stopped state

        console.log('Playback stopped.');
    }

    /**
     * Start render loop using requestAnimationFrame,
     * updating the visuals based on the current timing engine position.
     */
    startRenderLoop() {
        const loop = () => {
            const position = this.timingEngine.getCurrentPosition();
            const difficulty = this.difficultyControls.getDifficulty();

            switch (difficulty) {
                case 'hard': {
                    this.renderer.setCurrentChord(null);
                    this.renderer.setNextChordCountdown(null);
                    break;
                }
                case 'medium': {
                    this.renderer.setNextChordCountdown(null);
                    this.renderer.setCurrentChord(position.currentChord);
                    break;
                }
                case 'easy': {
                    this.renderer.setCurrentChord(position.currentChord);
                    this.renderer.setNextChord(position.nextChord || null);

                    const countdown = Number.isFinite(position.beatsUntilNextChord)
                        && position.beatsUntilNextChord >= 1
                        && position.beatsUntilNextChord <= 4
                        ? position.beatsUntilNextChord
                        : null;
                    this.renderer.setNextChordCountdown(countdown);
                    break;
                }
            }

            this.renderer.render();

            if (this.state === 'PLAYING') this.animationFrameId = requestAnimationFrame(loop);
        };

        loop();
    }

    /**
     * Stop the render loop by cancelling the animation frame.
     */
    stopRenderLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Display an error message to the user.
     * @param {string} message - The error message to display
     */
    showError(message) {
        if (!this.errorElement) return;
        this.errorElement.textContent = message;
        this.errorElement.classList.add('show');
    }

    /**
     * Hide the error message.
     */
    hideError() {
        if (!this.errorElement) return;
        this.errorElement.classList.remove('show');
        this.errorElement.textContent = '';
    }
}

// Note: DOMContentLoaded assumed (via <script type="module"> or defer)
const app = new ColorImprovApp();
app.init();

// Expose app to window for debugging in console
window.app = app;
window.lsb = new LocalStorageBackend();
window.pm = new PreferencesManager(window.lsb);