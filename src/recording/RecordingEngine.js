export class RecordingEngine {
    constructor(audioContext) {
        this.audioContext = audioContext;
        this.mediaStreamDestination = this.audioContext.createMediaStreamDestination();

        // MediaRecorder created fresh on each start()
        this.mediaRecorder = null;
        this.chunks = [];
    }

    getMediaStreamDestinationNode() {
        return this.mediaStreamDestination;
    }

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

    pause() {
        this.mediaRecorder?.pause();
    }

    resume() {
        this.mediaRecorder?.resume();
    }

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