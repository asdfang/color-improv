import { AudioEngine } from '/src/audio/AudioEngine.js';
import { TimingEngine } from '/src/timing/TimingEngine.js';
import { RecordingEngine} from '/src/recording/RecordingEngine.js';
import { NoteLogger } from '/src/events/NoteLogger.js';
import { Renderer } from '/src/visual/Renderer.js';
import { KeyboardHandler } from '/src/input/KeyboardHandler.js';
import { PlaybackControls } from '/src/ui/PlaybackControls.js';
import { VolumeControls } from '/src/ui/VolumeControls.js';
import { DifficultyControls } from '/src/ui/DifficultyControls.js';
import { AuthControls } from '/src/ui/AuthControls.js';
import { LocalStorageBackend } from '/src/api/LocalStorageBackend.js';
import { AuthService } from '/src/api/AuthService.js';
import { ServerBackend } from '/src/api/ServerBackend.js';
import { PreferencesManager } from '/src/preferences/PreferencesManager.js';
import { keyToGridCoordinates } from '/src/visual/grid-data.js';
import { SimpleDialogs } from '/src/ui/SimpleDialogs.js';
import { DownloadModal } from '/src/ui/DownloadModal.js';
import { VISUAL_LEAD_TIME } from '/src/constants.js';
import { debounce } from '/src/utils.js';

// TODO: trackKey as a configurable preference

/** @typedef {'STOPPED' | 'PLAYING' | 'PAUSED'} PlaybackState */

class ColorImprovApp {
    constructor() {
        this.backingTrack = 'blues'; // Might be in PreferencesManager eventually

        // State variables
        this.audioInitialized = false;
        /** @type {PlaybackState} */
        this.state = 'STOPPED';
        this.recording = false;
        
        // Initialize core components
        this.audioEngine = new AudioEngine();
        this.timingEngine = new TimingEngine(this.audioEngine, this.backingTrack);
        this.recordingEngine = new RecordingEngine(this.audioEngine.audioContext);
        this.noteLogger = new NoteLogger(this.timingEngine);
        const canvas = document.getElementById('mainCanvas');
        if (!(canvas instanceof HTMLCanvasElement)) {
            throw new Error('Main canvas element not found');
        }
        this.renderer = new Renderer(canvas);
        
        // UI components
        this.keyboardHandler = new KeyboardHandler(this.audioEngine);
        this.playbackControls = new PlaybackControls();
        this.volumeControls = new VolumeControls();
        this.difficultyControls = new DifficultyControls();
        this.authControls = new AuthControls();
        this.simpleDialogs = new SimpleDialogs(); // Instructions and conflict dialogs
        this.downloadModal = new DownloadModal();
        this.errorElement = /** @type {HTMLElement} */ (document.getElementById('error-message'));
        this.animationFrameId = null;

        // Preference storage and auth
        this.currentUser = null;
        this.authService = new AuthService();
        this.localStorageBackend = new LocalStorageBackend(); // Use localStorage as primary persistence layer
        this.preferencesManager = new PreferencesManager(this.localStorageBackend);
        this.serverBackend = new ServerBackend(); // Sync to server when user is authenticated

        // Debounced server sync
        this.debouncedServerSave = debounce(async () => {
            if (!this.currentUser) return;
            const preferences = this.preferencesManager.getAll();
            try {
                await this.serverBackend.save(preferences);
            } catch (error) {
                console.warn('Failed to sync preferences to server.', error);
            }
        }, 2000);

        // Listen for preference changes to trigger server sync
        this.preferencesManager.onChange = () => {
            this.debouncedServerSave();
        };
    }

    /**
     * Initialize the main application: event listeners, renderer.
     * Note: AudioEngine initialization must be triggered by user interaction; done in play(), not here.
     */
    async init() {
        try {
            console.log('Initializing Color Improv...');

            // Fire check if user is authenticated
            const authCheck = this.authService.getCurrentUser();

            this.setUpEventListeners();

            // Optimistic initialization of preferences from LocalStorage
            const preferences = this.preferencesManager.getAll();
            this.applyPreferences(preferences);

            // Connect RecordingEngine's node to Web Audio graph
            this.audioEngine.connectMainToExternalNode(this.recordingEngine.getMediaStreamDestinationNode());

            // Render initial stopped grid before playback starts
            this.renderer.render();

            try {
                // If user authenticated, update preferences from server (without conflict dialog)
                this.currentUser = await authCheck;
                if (this.currentUser) {
                    this.authControls.setLoggedIn(true);
                    const serverPreferences = await this.serverBackend.load();
                    this.applyPreferences(serverPreferences);
                    this.preferencesManager.setAll(serverPreferences);

                    console.log('User authenticated on initialization. Preferences automatically loaded from server.')
                } else {
                    console.log('No authenticated user on initialization. Using local preferences.');
                }
            } catch (error) {
                console.warn('Could not check auth or load server preferences. Continuing to initialize with local preferences.', error);
            }

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
        // Instructions/conflict dialog events
        this.simpleDialogs.setupInstructionsDialog({
            onDialogOpen: () => this.keyboardHandler.releaseAllKeys(),
        });

        // Control button events
        this.playbackControls.enable({
            onPlay: () => this.play(),
            onPause: () => this.pause(),
            onStop: () => this.stop(),
            onResume: () => this.resume(),
            onRecord: () => this.record(),
        });

        // Volume control events
        this.volumeControls.enable({
            onVolumeChange: (source, volume) => this.setVolume(source, volume),
            onMuteToggle: (source) => this.toggleMute(source),
            onReset: (source) => this.resetVolumeAndMuted(source),
        });

        // Difficulty control events
        this.difficultyControls.enable({
            onDifficultyChange: (difficulty) => this.setDifficulty(difficulty),
        });

        // Backing track end callback
        this.audioEngine.onEnded = () => this.stop();

        // Authentication control events
        this.authControls.enable({
            onRegister: async (email, name, password) => await this.register(email, name, password),
            onLogin: async (email, password) => await this.login(email, password),
            onLogout: async () => await this.logout(),
            onDialogOpen: () => this.keyboardHandler.releaseAllKeys(),
        });

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
     * Apply preferences to the application, updating components.
     * Does not update preferences themselves: assumes they are up-to-date in PreferencesManager.
     * @param {object} preferences 
     */
    applyPreferences(preferences) {
        if (preferences.backingTrackVolume !== undefined) {
            this.setVolume('backingTrack', preferences.backingTrackVolume);
            this.audioEngine.setBackingTrackVolume(preferences.backingTrackVolume);
        }
        if (preferences.samplesVolume !== undefined) {
            this.setVolume('samples', preferences.samplesVolume);
            this.audioEngine.setSamplesVolume(preferences.samplesVolume);
        }
        if (preferences.backingTrackMuted !== undefined) {
            this.volumeControls.setMuted('backingTrack', preferences.backingTrackMuted);
            this.audioEngine.setBackingTrackMuted(preferences.backingTrackMuted);
        }
        if (preferences.samplesMuted !== undefined) {
            this.volumeControls.setMuted('samples', preferences.samplesMuted);
            this.audioEngine.setSamplesMuted(preferences.samplesMuted);
        }
        if (preferences.difficulty !== undefined) {
            this.setDifficulty(preferences.difficulty);
            // Render loop checks difficulty, no need to update other components here
        }
    }

    /**
     * Update difficulty preference. Render loop checks difficulty when updating visuals.
     * @param {string} newDifficulty 'easy' | 'medium' | 'hard'
     */
    setDifficulty(newDifficulty) {
        this.preferencesManager.set('difficulty', newDifficulty);
        this.difficultyControls.setDifficulty(newDifficulty);
    }

    /**
     * Set volume for specified source.
     * @param {string} source 'backingTrack' | 'samples'
     * @param {number} volume from 0 to 1
     */
    setVolume(source, volume) {
        if (source === 'backingTrack') {
            this.preferencesManager.set('backingTrackVolume', volume);
            this.volumeControls.setVolume('backingTrack', volume);
            return this.audioEngine.setBackingTrackVolume(volume);
        } else if (source === 'samples') {
            this.preferencesManager.set('samplesVolume', volume);
            this.volumeControls.setVolume('samples', volume);
            return this.audioEngine.setSamplesVolume(volume);
        } else console.warn(`Unknown source '${source}' for volume change.`);
    }

    /**
     * Toggle mute state for specified source.
     * @param {string} source 'backingTrack' | 'samples'
     * @returns {boolean} whether muted after toggle
     */
    toggleMute(source) {
        if (source === 'backingTrack') {
            const newMutedState = !this.preferencesManager.get('backingTrackMuted');
            this.preferencesManager.set('backingTrackMuted', newMutedState);
            this.volumeControls.setMuted('backingTrack', newMutedState);
            return this.audioEngine.setBackingTrackMuted(newMutedState);
        } else if (source === 'samples') {
            const newMutedState = !this.preferencesManager.get('samplesMuted');
            this.preferencesManager.set('samplesMuted', newMutedState);
            this.volumeControls.setMuted('samples', newMutedState);
            return this.audioEngine.setSamplesMuted(newMutedState);
        }
        console.warn(`Unknown source '${source}' for mute toggle.`);
        return false;
    }

    /**
     * Reset volume and muted state for specified source to default values.
     * @param {string} source 'backingTrack' | 'samples'
     */
    resetVolumeAndMuted(source) {
        if (source === 'backingTrack') {
            const defaults = this.preferencesManager.getDefaults();
            this.preferencesManager.set('backingTrackVolume', defaults.backingTrackVolume);
            this.preferencesManager.set('backingTrackMuted', defaults.backingTrackMuted);
            this.audioEngine.setBackingTrackVolume(defaults.backingTrackVolume);
            this.audioEngine.setBackingTrackMuted(defaults.backingTrackMuted);
            this.volumeControls.setVolume('backingTrack', defaults.backingTrackVolume);
            this.volumeControls.setMuted('backingTrack', defaults.backingTrackMuted);
        } else if (source === 'samples') {
            const defaults = this.preferencesManager.getDefaults();
            this.preferencesManager.set('samplesVolume', defaults.samplesVolume);
            this.preferencesManager.set('samplesMuted', defaults.samplesMuted);
            this.audioEngine.setSamplesVolume(defaults.samplesVolume);
            this.audioEngine.setSamplesMuted(defaults.samplesMuted);
            this.volumeControls.setVolume('samples', defaults.samplesVolume);
            this.volumeControls.setMuted('samples', defaults.samplesMuted);
        } else {
            console.warn(`Unknown source '${source}' for reset.`);
        }
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
            this.recording ? this.playbackControls.setRecording() : this.playbackControls.setPlaying();
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
     * If stopping from recording, prepares audio and log for download.
     */
    async stop() {
        this.state = 'STOPPED';
        let recordingPromise = null;
        let log = null;

        if (this.recording) {
            // If stopping from recording, reset recording state
            this.recording = false;
            recordingPromise = this.recordingEngine.stop();
            log = this.noteLogger.stop();
        }

        // Clean up while waiting for recording to finalize
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

        if (recordingPromise) {
            const recordingBlob = await recordingPromise;
            if (!recordingBlob) {
                console.error('Recording failed to finalize.');
                this.showError('Failed to finalize recording. Please try again.');
                return;
            }

            this.downloadModal.showModal(recordingBlob, log);

            console.log('Recording finalized and ready for download.');
        }
    }

    /**
     * Start recording user input along with playback. Only from stopped state.
     * Sets recording flag, starts RecordingEngine and NoteLogger, then starts playback.
      * Note: currently only logs note events from KeyboardHandler, but can be extended to log other inputs or MIDI devices.
     */
    record() {
        this.recording = true;
        this.recordingEngine.start();
        this.noteLogger.start(this.backingTrack, this.preferencesManager.get('difficulty'));
        this.play();
        console.log('Recording and note logging started.');
    }

    /**
     * Start render loop using requestAnimationFrame,
     * updating the visuals based on the current timing engine position.
     */
    startRenderLoop() {
        const loop = () => {
            const position = this.timingEngine.getCurrentPosition(VISUAL_LEAD_TIME);
            const difficulty = this.preferencesManager.get('difficulty');

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

    async register(email, name, password) {
        console.log('Registering user...'); // Debug log
        this.currentUser = await this.authService.register(email, name, password)

        try {
            // Keep current preferences, save to server
            const preferences = this.preferencesManager.getAll();
            await this.serverBackend.save(preferences);
        } catch (error) {
            console.warn('Failed to save local preferences to server after registration.', error);
        }
    }

    async login(email, password) {
        console.log('Logging in user...'); // Debug log
        this.currentUser = await this.authService.login(email, password);
        this.authControls.setLoggedIn(true);

        // Load preferences from server; if different, ask user if they want to overwrite local preferences or keep them
        const serverPreferences = await this.serverBackend.load();
        const localPreferences = this.preferencesManager.getAll();

        if (Object.keys(serverPreferences).every(key => serverPreferences[key] === localPreferences[key])) {
            console.log('Server preferences match local preferences. No action needed.');
            return;
        } else {
            this.simpleDialogs.showConflictDialog({
                onLocalWins: async () => {
                    try {
                        await this.serverBackend.save(localPreferences);
                        console.log('User chose to keep local preferences. Saved to server.');
                    } catch (error) {
                        console.warn('Failed to save local preferences to server after login.', error);
                    }
                },
                onServerWins: () => {
                    // User chose to use server preferences: apply them and update local preferences
                    this.applyPreferences(serverPreferences);
                    this.preferencesManager.setAll(serverPreferences);
                    console.log('User chose to use server preferences. Applied and saved locally.');
                }
            });
        }
    }

    async logout() {
        console.log('Logging out user...'); // Debug log
        this.currentUser = null;
        await this.authService.logout();
        this.authControls.setLoggedIn(false);
        // Keep current preferences
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