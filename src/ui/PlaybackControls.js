export class PlaybackControls {
    constructor() {
        this.playBtn = /** @type {HTMLButtonElement} */ document.getElementById('play-btn');
        this.pauseBtn = /** @type {HTMLButtonElement} */ document.getElementById('pause-btn');
        this.stopBtn = /** @type {HTMLButtonElement} */ document.getElementById('stop-btn');
        this.recordBtn = /** @type {HTMLButtonElement} */ document.getElementById('record-btn');
        this.recordIcon = /** @type {HTMLSpanElement} */ document.querySelector('#record-btn i');
        this.recordBtnLabel = /** @type {HTMLSpanElement} */ document.getElementById('record-btn-label');

        this.state = 'stopped'; // 'playing', 'paused', 'stopped'
        this.recording = false;

        // Initialize button display
        this.updateButtons();
    }

    /**
     * Set up control button event listeners.
     * @param {Object} callbacks containing functions: onPlay, onPause, onStop, onResume 
     */
    enable(callbacks) {
        this.playBtn.addEventListener('click', () => {
            if (this.state === 'stopped') callbacks.onPlay();
            else if (this.state === 'paused') callbacks.onResume();
        });

        this.pauseBtn.addEventListener('click', () => {
            if (this.state === 'playing') callbacks.onPause();
        });

        this.stopBtn.addEventListener('click', () => {
            if (this.state !== 'stopped') callbacks.onStop();
        });

        this.recordBtn.addEventListener('click', () => {
            if (!this.recording) callbacks.onRecord();
        });

        // Keyboard shortcut: Spacebar to toggle play/pause (disabled when recording)
        document.addEventListener('keydown', (e) => {
            if (e.code !== 'Space') return;
            if (e.repeat) return;
            if (this.recording) return;
            const target = e.target;
            if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

            e.preventDefault();

            if (this.state === 'stopped') callbacks.onPlay();
            else if (this.state === 'playing') callbacks.onPause();
            else if (this.state === 'paused') callbacks.onResume();
        });

        // Keyboard shortcut: Shift+Esc to stop (hard reset)
        document.addEventListener('keydown', (e) => {
            if (e.code !== 'Escape' || !e.shiftKey) return;
            if (e.repeat) return;
            const target = e.target;
            if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

            e.preventDefault();

            if (this.state !== 'stopped') callbacks.onStop();
        });

        // Keyboard shortcut: Shift+R to start recording (from stopped state only)
        document.addEventListener('keydown', (e) => {
            if (e.code !== 'KeyR' || !e.shiftKey) return;
            if (e.repeat) return;
            const target = e.target;
            if (target instanceof HTMLElement && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;

            e.preventDefault();

            if (!this.recording && this.state === 'stopped') callbacks.onRecord();
        });
    }

    setPlaying() {
        this.state = 'playing';
        this.updateButtons();
    }

    setPaused() {
        this.state = 'paused';
        this.updateButtons();
    }

    setStopped() {
        this.state = 'stopped';
        this.recording = false;
        this.updateButtons();
    }

    setRecording() {
        this.state = 'playing';
        this.recording = true;
        this.updateButtons();
    }

    /**
     * Update button states based on current playback state and recording status.
     * Play/pause/stop as usual. Record only enabled when stopped (only starts at beginning).
     * Pause disabled during recording. Recording stopped by stop button only.
     */
    updateButtons() {
        switch (this.state) {
            case 'playing':
                this.playBtn.disabled = true;
                this.pauseBtn.disabled = this.recording; // Pause disabled during recording
                this.stopBtn.disabled = false;
                this.recordBtn.disabled = true;
                break;
            case 'paused':
                this.playBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.stopBtn.disabled = false;
                this.recordBtn.disabled = true;
                break;
            case 'stopped':
                this.playBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.stopBtn.disabled = true;
                this.recordBtn.disabled = false;
                break;
        }

        // Update record label text and style
        if (this.recording) {
            this.recordBtn.classList.add('recording');
            this.recordIcon.classList.add('animate-pulse');
            this.recordBtnLabel.classList.add('recording');
            this.recordBtnLabel.textContent = 'Recording...';
        } else {
            this.recordBtn.classList.remove('recording');
            this.recordIcon.classList.remove('animate-pulse');
            this.recordBtnLabel.classList.remove('recording');
            this.recordBtnLabel.textContent = 'Record';
        }
    }
}