import mime from 'mime-types';

import { AudioEngine } from '/src/audio/AudioEngine.js';
import { TimingEngine } from '/src/timing/TimingEngine.js';
import { RecordingEngine} from '/src/recording/RecordingEngine.js';
import { NoteLogger } from '/src/events/NoteLogger.js';
import { Renderer } from '/src/visual/Renderer.js';
import { KeyboardHandler } from '/src/input/KeyboardHandler.js';
import { PlaybackControls } from '/src/ui/PlaybackControls.js';
import { VolumeControls } from '/src/ui/VolumeControls.js';
import { DifficultyControls } from '/src/ui/DifficultyControls.js';
import { LocalStorageBackend } from '/src/api/LocalStorageBackend.js';
import { PreferencesManager } from '/src/preferences/PreferencesManager.js';
import { keyToGridCoordinates } from '/src/visual/grid-data.js';
import { VISUAL_LEAD_TIME } from '/src/constants.js';

// TODO: trackKey as a configurable preference
// TODO: move DOM manipulation out of main, except for event listeners and errors?

/** @typedef {'STOPPED' | 'PLAYING' | 'PAUSED'} PlaybackState */

class ColorImprovApp {
    constructor() {
        this.backingTrack = 'blues'; // Might be in PreferencesManager eventually

        // State variables
        this.audioInitialized = false;
        /** @type {PlaybackState} */
        this.state = 'STOPPED';
        this.recording = false;
        
        // Initialize components
        this.localStorageBackend = new LocalStorageBackend();
        this.preferencesManager = new PreferencesManager(this.localStorageBackend);

        // Exception: AudioEngine needs initial volume and muted states immediately
        const prefs = this.preferencesManager.getAll();
        this.audioEngine = new AudioEngine(
            prefs.backingTrackVolume, prefs.samplesVolume,
            prefs.backingTrackMuted, prefs.samplesMuted
        );
        this.timingEngine = new TimingEngine(this.audioEngine, this.backingTrack);
        this.recordingEngine = new RecordingEngine(this.audioEngine.audioContext);
        this.noteLogger = new NoteLogger(this.timingEngine);

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
            this.setupInstructionsTooltip();

            // Connect RecordingEngine's node to Web Audio graph
            this.audioEngine.connectMainToExternalNode(this.recordingEngine.getMediaStreamDestinationNode());

            // Initial volume, mute, difficulty states from preferences to set visuals
            const prefs = this.preferencesManager.getAll();
            this.volumeControls.setVolume('backingTrack', prefs.backingTrackVolume);
            this.volumeControls.setVolume('samples', prefs.samplesVolume);
            this.volumeControls.setMuted('backingTrack', prefs.backingTrackMuted);
            this.volumeControls.setMuted('samples', prefs.samplesMuted);
            this.difficultyControls.setDifficulty(prefs.difficulty);

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
     * Update difficulty preference based on user selection. Render loop checks difficulty when updating visuals.
     * @param {string} newDifficulty 'easy' | 'medium' | 'hard'
     */
    setDifficulty(newDifficulty) {
        // Only need to update PreferencesManager; HTML select already updated from user interaction
        this.preferencesManager.set('difficulty', newDifficulty);
    }

    /**
     * Set volume for specified source.
     * @param {string} source 'backingTrack' | 'samples'
     * @param {number} volume from 0 to 1
     */
    setVolume(source, volume) {
        // Visual state automatic with sliders
        if (source === 'backingTrack') {
            this.preferencesManager.set('backingTrackVolume', volume);
            return this.audioEngine.setBackingTrackVolume(volume);
        } else if (source === 'samples') {
            this.preferencesManager.set('samplesVolume', volume);
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

            this.displayDownloadModal(recordingBlob, log);
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

    /**
     * Set up instructions tooltip/modal with open and close event listeners.
     */
    setupInstructionsTooltip() {
        const instructionsBtn = document.getElementById('instructions');
        const dialog = document.getElementById('instructions-dialog');
        const closeBtn = document.getElementById('instructions-close-btn');
        if (!instructionsBtn || !dialog || !closeBtn) return;

        instructionsBtn.addEventListener('click', () => dialog.showModal());
        closeBtn.addEventListener('click', () => dialog.close());
        // Close when clicking the backdrop
        dialog.addEventListener('click', (e) => {
            if (e.target === dialog) dialog.close();
        });
    }

    /**
     * Display modal with audio and log preview and download options.
     * TODO: Esc with same unsaved confirmation as close button
     * TODO: Space to click on tab focuses, instead of toggling play/pause
     * @param {*} recordingBlob blob containing the recorded audio data from RecordingEngine
     * @param {*} logObject raw log data from NoteLogger
     */
    displayDownloadModal(recordingBlob, logObject) {
        const modal = document.getElementById('download-modal');
        const confirmModal = document.getElementById('confirm-close-modal');
        const audioPreview = document.getElementById('recording-preview');
        const logPreview = document.getElementById('note-log-preview');
        const downloadAudioBtn = document.getElementById('download-audio-btn');
        const downloadLogBtn = document.getElementById('download-log-btn');
        const closeBtn = document.getElementById('close-download-modal-btn');

        const recordingUrl = URL.createObjectURL(recordingBlob);
        let recordingExt = mime.extension(recordingBlob.type) || 'webm';
        // Force better compatability with common browsers
        if (recordingExt === 'weba') recordingExt = 'webm';
        if (recordingExt === 'mp4')  recordingExt = 'm4a';

        const logData = JSON.stringify(logObject, null, 2);
        const logBlob = new Blob([logData], { type: 'application/json' });
        const logUrl = URL.createObjectURL(logBlob);

        // Track download state
        let audioDownloaded = false;
        let logDownloaded = false;

        if (audioPreview) audioPreview.src = recordingUrl;

        // Display truncated JSON preview
        if (logPreview) {
            const lines = logData.split('\n');
            const previewLines = lines.slice(0, 12);
            const previewText = previewLines.join('\n') + (lines.length > 12 ? '\n...' : '');
            logPreview.textContent = previewText;
        }

        if (downloadAudioBtn) {
            downloadAudioBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = recordingUrl;
                link.download = `recording_${Date.now()}.${recordingExt}`;
                link.click();
                audioDownloaded = true;
                downloadAudioBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded';
                downloadAudioBtn.classList.add('downloaded');
            };
        }

        if (downloadLogBtn) {
            downloadLogBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = logUrl;
                link.download = `note_log_${Date.now()}.json`;
                link.click();
                logDownloaded = true;
                downloadLogBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded';
                downloadLogBtn.classList.add('downloaded');
            };
        }

        const cleanupAndClose = () => {
            if (audioPreview) audioPreview.src = '';
            if (logPreview) logPreview.textContent = '';
            // Reset button states
            if (downloadAudioBtn) {
                downloadAudioBtn.innerHTML = '<i class="fas fa-download"></i> Download Audio';
                downloadAudioBtn.classList.remove('downloaded');
            }
            if (downloadLogBtn) {
                downloadLogBtn.innerHTML = '<i class="fas fa-download"></i> Download Note Log';
                downloadLogBtn.classList.remove('downloaded');
            }
            URL.revokeObjectURL(recordingUrl);
            URL.revokeObjectURL(logUrl);
            modal.close();
        };

        if (closeBtn) {
            closeBtn.onclick = () => {
                // Check if both files have been downloaded
                if (!audioDownloaded || !logDownloaded) {
                    // Show confirmation modal
                    const unsavedList = document.getElementById('unsaved-list');
                    const unsavedItems = [];
                    if (!audioDownloaded) unsavedItems.push('Audio recording');
                    if (!logDownloaded) unsavedItems.push('Note log');
                    if (unsavedList) {
                        unsavedList.textContent = `Not yet downloaded: ${unsavedItems.join(', ')}`;
                    }

                    const confirmYesBtn = document.getElementById('confirm-close-yes-btn');
                    const confirmCancelBtn = document.getElementById('confirm-close-cancel-btn');

                    if (confirmYesBtn) {
                        confirmYesBtn.onclick = () => {
                            confirmModal.close();
                            cleanupAndClose();
                        };
                    }

                    if (confirmCancelBtn) {
                        confirmCancelBtn.onclick = () => {
                            confirmModal.close();
                        };
                    }

                    confirmModal.showModal();
                } else {
                    cleanupAndClose();
                }
            };
        }

        modal.showModal();
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