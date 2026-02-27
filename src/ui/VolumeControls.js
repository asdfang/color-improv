export class VolumeControls {
    constructor() {
        this.backingTrackVolumeSlider = /** @type {HTMLInputElement} */ document.getElementById('backing-track-volume');
        this.backingTrackMuteButton = /** @type {HTMLButtonElement} */ document.getElementById('backing-track-mute-btn');
        this.backingTrackResetButton = /** @type {HTMLButtonElement} */ document.getElementById('backing-track-reset-btn');
        this.samplesVolumeSlider = /** @type {HTMLInputElement} */ document.getElementById('samples-volume');
        this.samplesMuteButton = /** @type {HTMLButtonElement} */ document.getElementById('samples-mute-btn');
        this.samplesResetButton = /** @type {HTMLButtonElement} */ document.getElementById('samples-reset-btn');
    }

    /**
     * Set up event listeners for volume sliders and mute buttons.
     * @param {Object} callbacks containing functions: onVolumeChange(source, volume), onMuteToggle(source)
     * source: 'backingTrack' | 'samples'
     * volume: number between 0 and 1
     * onMuteToggle should return the new muted state (boolean) after toggling
     */
    enable(callbacks) {
        this.backingTrackVolumeSlider.addEventListener('input', (e) => {
            callbacks.onVolumeChange('backingTrack', e.target.valueAsNumber);
        });

        this.samplesVolumeSlider.addEventListener('input', (e) => {
            callbacks.onVolumeChange('samples', e.target.valueAsNumber);
        });

        this.backingTrackMuteButton.addEventListener('click', () => {
            callbacks.onMuteToggle('backingTrack');
        });

        this.samplesMuteButton.addEventListener('click', () => {
            callbacks.onMuteToggle('samples');
        });

        this.backingTrackResetButton.addEventListener('click', () => {
            callbacks.onReset('backingTrack');
        });

        this.samplesResetButton.addEventListener('click', () => {
            callbacks.onReset('samples');
        });
    }

    /**
     * Sets specified source volume slider to given value.
     * @param {string} source 'backingTrack' | 'samples'
     * @param {number} volume between 0 and 1
     */
    setVolume(source, volume) {
        if (source === 'backingTrack') {
            this.backingTrackVolumeSlider.value = String(volume);
        } else if (source === 'samples') {
            this.samplesVolumeSlider.value = String(volume);
        }
    }

    /**
     * Sets specified source to muted/unmuted state visually.
     * @param {string} source 'backingTrack' | 'samples'
     * @param {boolean} isMuted
     */
    setMuted(source, isMuted) {
        if (source === 'backingTrack') {
            this.updateMuteButton(this.backingTrackMuteButton, isMuted);
        } else if (source === 'samples') {
            this.updateMuteButton(this.samplesMuteButton, isMuted);
        }
    }

    /**
     * Updates the mute button icon and color based on muted state.
     * @param {HTMLButtonElement} button 
     * @param {boolean} isMuted 
     */
    updateMuteButton(button, isMuted) {
        if (isMuted) {
            button.classList.add('is-muted');
        } else {
            button.classList.remove('is-muted');
        }
    }
}