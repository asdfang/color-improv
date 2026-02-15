export class PlaybackControls {
    constructor() {
        this.playBtn = /** @type {HTMLButtonElement} */ (document.getElementById('play-btn'));
        this.pauseBtn = /** @type {HTMLButtonElement} */ (document.getElementById('pause-btn'));
        this.stopBtn = /** @type {HTMLButtonElement} */ (document.getElementById('stop-btn'));
        this.instructions = /** @type {HTMLElement} */ (document.getElementById('instructions'));

        this.state = 'stopped'; // 'playing', 'paused', 'stopped'

        this.updateButtons();
        this.updateInstructions();
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

        // Keyboard shortcut: Spacebar to toggle play/pause
        document.addEventListener('keydown', (e) => {
            if (e.code !== 'Space') return;
            if (e.repeat) return;
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
    }

    setPlaying() {
        this.state = 'playing';
        this.updateButtons();
        this.updateInstructions();
    }

    setPaused() {
        this.state = 'paused';
        this.updateButtons();
        this.updateInstructions();
    }

    setStopped() {
        this.state = 'stopped';
        this.updateButtons();
        this.updateInstructions();
    }

    updateButtons() {
        switch (this.state) {
            case 'playing':
                this.playBtn.disabled = true;
                this.pauseBtn.disabled = false;
                this.stopBtn.disabled = false;
                break;
            case 'paused':
                this.playBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.stopBtn.disabled = false;
                break;
            case 'stopped':
                this.playBtn.disabled = false;
                this.pauseBtn.disabled = true;
                this.stopBtn.disabled = true;
                break;
        }
    }

    updateInstructions() {
        if (this.state === 'stopped') {
            this.instructions.classList.remove('hidden');
        } else {
            this.instructions.classList.add('hidden');
        }
    }
}