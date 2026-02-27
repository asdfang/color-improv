/**
 * RecordingEngine: handles recording audio from a Web Audio graph using MediaRecorder.
 * Note: to imitate a live improvisation, there is no ability to pause/resume while recording.
 */
export class RecordingEngine {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();

        // MediaRecorder created fresh on each start()
        this.mediaRecorder = null;
        this.chunks = [];
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
    }

    /**
     * Stops recording and returns a Promise that resolves to the recorded audio as a Blob.
      * If recording is not active, resolves to null.
      * @returns {Promise<Blob|null>} Promise resolving to the recorded audio Blob, or null if not recording
      * @throws {Error} if an error occurs during stopping/recording
      * Note: The Blob is created from the collected chunks when the MediaRecorder's `stop` event fires.
     */
    stop() {
        if (!this.mediaRecorder || this.mediaRecorder.state === 'inactive') {
            console.warn('RecordingEngine: stop() called but MediaRecorder is not active');
            return Promise.resolve(null);
        }

        return new Promise((resolve, reject) => {
            this.mediaRecorder.onstop = () => {
                // Blob is ready when `stop` event fires
                const blob = new Blob(this.chunks, { type: this.mediaRecorder.mimeType });
                this.mediaRecorder = null;
                resolve(blob);
            };

            this.mediaRecorder.onerror = (e) => {
                reject(e.error);
            };

            this.mediaRecorder.stop();
        });
    }
}