/**
 * RecordingEngine: handles recording audio from a Web Audio graph using MediaRecorder.
 * Note: to imitate a live improvisation, there is no ability to pause/resume while recording.
 */
export class RecordingEngine {
    /**
     * @param {AudioContext} audioContext 
     */
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();

        // MediaRecorder created fresh on each start()
        this.mediaRecorder = /** @type {MediaRecorder | null} */ (null);
        this.chunks = /** @type {Blob[]} */ ([]);

        this.isRecording = false;
        this.startTime = 0;
    }

    /**
     * 
     * @param {AudioContext} audioContext 
     */
    updateAudioContext(audioContext) {
        if (!audioContext) {
            throw new Error('RecordingEngine: updateAudioContext called with null/undefined audioContext');
        }
        this.audioContext = audioContext;
        this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();
    }

    isRecordingActive() {
        return this.isRecording;
    }

    /**
     * Exposes the MediaStreamDestinationNode that connects to the Web Audio graph.
     * @returns {MediaStreamAudioDestinationNode}
     */
    getMediaStreamDestinationNode() {
        return this.mediaStreamDestination;
    }

    /**
     * @returns {string} the selected MIME type for recording, or empty string (default) if none supported
     */
    _selectMimeType() {
        const mimeTypes = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/mp4',
            'audio/ogg;codecs=opus',
            'audio/ogg',
        ];

        for (const type of mimeTypes) {
            if (MediaRecorder.isTypeSupported(type)) return type;
        }

        return ''; // Default if none of the above are supported
    }

    /**
     * Starts recording. If already recording, restarts with a fresh MediaRecorder instance.
      * Clears previously recorded chunks.
      * Selects the best available MIME type for recording.
      * @returns {void}
      * @throws {Error} if MediaRecorder cannot be created (e.g. no supported MIME type)
     */
    start() {
        this.chunks = []; // Clear previous recordings
        
        const mimeType = this._selectMimeType();
        const options = mimeType ? { mimeType } : {};
        
        this.mediaRecorder = new MediaRecorder(this.mediaStreamDestination.stream, options);
        
        this.mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                this.chunks.push(e.data);
            }
        };
        
        this.mediaRecorder.start();
        this.isRecording = true;
        this.startTime = performance.now();
    }

    /**
     * Stops recording and returns a Promise that resolves to the recorded audio as a Blob.
      * If recording is not active, resolves to null.
      * @returns {Promise<{blob: Blob, durationSeconds: number}|null>} Promise resolving to the recorded audio Blob and duration, or null if not recording
      * @throws {Error} if an error occurs during stopping/recording
      * Note: The Blob is created from the collected chunks when the MediaRecorder's `stop` event fires.
     */
    stop() {
        const mediaRecorder = this.mediaRecorder;
        if (!mediaRecorder || mediaRecorder.state === 'inactive') {
            this.mediaRecorder = null;
            this.isRecording = false;
            console.warn('RecordingEngine: stop() called but MediaRecorder is not active');
            return Promise.resolve(null);
        }

        return new Promise((resolve, reject) => {
            mediaRecorder.onstop = () => {
                // Blob is ready when `stop` event fires
                const blob = new Blob(this.chunks, { type: mediaRecorder.mimeType });
                this.mediaRecorder = null;
                this.isRecording = false;
                const endTime = performance.now();
                const durationSeconds = Math.round((endTime - this.startTime) / 1000);
                resolve({blob, durationSeconds});
            };

            mediaRecorder.onerror = (e) => {
                reject(e.error);
            };

            mediaRecorder.stop();
        });
    }
}