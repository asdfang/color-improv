export class VolumeControls {
    constructor() {
        this.backingTrackVolumeSlider = /** @type {HTMLInputElement} */ document.getElementById('backing-track-volume');
        this.backingTrackMuteButton = /** @type {HTMLButtonElement} */ document.getElementById('backing-track-mute-button');
        this.samplesVolumeSlider = /** @type {HTMLInputElement} */ document.getElementById('samples-volume');
        this.samplesMuteButton = /** @type {HTMLButtonElement} */ document.getElementById('samples-mute-button');
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
            const isMuted = callbacks.onMuteToggle('backingTrack');
            if (typeof isMuted === 'boolean') {
                this.setMuted('backingTrack', isMuted);
            }
        });

        this.samplesMuteButton.addEventListener('click', () => {
            const isMuted = callbacks.onMuteToggle('samples');
            if (typeof isMuted === 'boolean') {
                this.setMuted('samples', isMuted);
            }
        });
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
     * Updates the mute button text based on muted state.
     * @param {HTMLButtonElement} button 
     * @param {boolean} isMuted 
     */
    updateMuteButton(button, isMuted) {
        button.textContent = isMuted ? '🔇' : '🔈';
    }
}