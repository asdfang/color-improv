// Backend error shape: { error: { code: string, message: string } }

/**
 * @typedef {Object} Recording
 * @property {string} id - Unique identifier for the recording
 * @property {string} title - Title of the recording
 * @property {string} notes - User-provided notes about the recording
 * @property {number} durationSeconds - Duration of the recording in seconds
 * @property {string} createdAt - ISO timestamp of when the recording was created
 * @property {string} audioMimeType - MIME type of the audio file (e.g., "audio/webm")
 * @property {number} audioFileSizeBytes - Size of the audio file in bytes
 * @property {number} logFileSizeBytes - Size of the log file in bytes
 */

export class RecordingApiError extends Error {
    /**
     * @param {string} message 
     * @param {string} code 
     * @param {number} status 
     */
    constructor(message, code, status) {
        super(message);
        this.name = 'RecordingApiError';
        this.code = code;
        this.status = status;
    }
}

export class RecordingService {
    /**
     * @param {any} data 
     * @param {string} fallbackMessage 
     * @param {number} status 
     * @returns {RecordingApiError}
     */
    buildRecordingError(data, fallbackMessage, status) {
        const code = data?.error?.code || data?.code;
        const message = data?.error?.message || data?.error || data?.message || fallbackMessage;
        return new RecordingApiError(message, code, status);
    }

    /**
     * Ensures recording's notes is a string for consistent client-side handling (empty string if null). Other fields are returned as-is.
     * @param {Recording} recording 
     * @returns 
     */
    normalizeRecording(recording) {
        return { ...recording, notes: recording.notes ?? '' };
    }

    async list() {
        const response = await fetch('/api/recordings', { credentials: 'include' })
            .catch(() => {
                throw new RecordingApiError('Network error', 'NETWORK_ERROR', 0);
            });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw this.buildRecordingError(data, 'Failed to load recordings', response.status);
        }
        const data = await response.json();
        return data.recordings.map(/** @param {Recording} r */ (r) => this.normalizeRecording(r));
    }

    /**
     * Get recordings owned by user by recording ID.
     * @param {string} id 
     * @returns {Promise<{ audioBlob: Blob, logObject: Object }>} audio file as Blob and log file as parsed JSON object on success
     */
    async fetchArtifacts(id) {
        const audioUrl = `/api/recordings/${id}/audio`;
        const logUrl = `/api/recordings/${id}/log`;
        const [audioRes, logRes] = await Promise.all([
            fetch(audioUrl, { credentials: 'include' }),
            fetch(logUrl, { credentials: 'include' }),
        ]).catch(() => {
            throw new RecordingApiError('Network error', 'NETWORK_ERROR', 0);
        });
        if (!audioRes.ok) {
            const data = await audioRes.json().catch(() => ({}));
            throw this.buildRecordingError(data, 'Failed to fetch audio file', audioRes.status);
        }
        if (!logRes.ok) {
            const data = await logRes.json().catch(() => ({}));
            throw this.buildRecordingError(data, 'Failed to fetch log file', logRes.status);
        }
        
        const audioBlob = await audioRes.blob();
        const logObject = await logRes.json();
        return { audioBlob, logObject };
    }
    
    /**
     * Update recording metadata (title, notes) via id.
     * @param {string} id 
     * @param {{ title: string, notes: string }} metadata
     * @returns {Promise<Recording>} updated recording object on success
     */
    async updateMetadata(id, { title, notes }) {
        const response = await fetch(`/api/recordings/${id}`, 
            {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ title, notes }),
            }
        ).catch(() => {
            throw new RecordingApiError('Network error', 'NETWORK_ERROR', 0);
        });

        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw this.buildRecordingError(data, 'Failed to update recording metadata', response.status);
        }
        const data = await response.json();
        return this.normalizeRecording(data.recording);
    }

    /**
     * Create new recording with given metadata and artifacts.
     * @param {{
     *      audioBlob: Blob,
     *      logObject: Object,
     *      title: string,
     *      notes?: string,
     *      durationSeconds: number
     * }} params
     * @return {Promise<Recording>} new recording object on success
     */
    async create({ audioBlob, logObject, title, notes, durationSeconds }) {
        const fd = new FormData();
        const logBlob = new Blob([JSON.stringify(logObject)], { type: 'application/json' });
        fd.append('audio', audioBlob);
        fd.append('log', logBlob);
        fd.append('title', title);
        if (notes) fd.append('notes', notes);
        fd.append('durationSeconds', String(durationSeconds));
        const response = await fetch('/api/recordings', {
            method: 'POST',
            credentials: 'include',
            body: fd,
        }).catch(() => {
            throw new RecordingApiError('Network error', 'NETWORK_ERROR', 0);
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw this.buildRecordingError(data, 'Failed to create recording', response.status);
        }
        const data = await response.json();
        return this.normalizeRecording(data.recording);
    }

    /**
     * Replaces an existing recording by uploading new artifacts and metadata.
     * Note: this is "create" with extra replacesId field
     * @param {string} replacesId id of recording row to replace with new recording
     * @param {{ audioBlob: Blob, logObject: Object, title: string, notes?: string, durationSeconds: number }} params
     * @returns {Promise<Recording>} new recording object on success
     */
    async replace(replacesId, { audioBlob, logObject, title, notes, durationSeconds }) {
        const fd = new FormData();
        const logBlob = new Blob([JSON.stringify(logObject)], { type: 'application/json' });
        fd.append('replacesId', replacesId);
        fd.append('audio', audioBlob);
        fd.append('log', logBlob);
        fd.append('title', title);
        if (notes) fd.append('notes', notes);
        fd.append('durationSeconds', String(durationSeconds));
        const response = await fetch('/api/recordings', {
            method: 'POST',
            credentials: 'include',
            body: fd,
        }).catch(() => {
            throw new RecordingApiError('Network error', 'NETWORK_ERROR', 0);
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw this.buildRecordingError(data, 'Failed to replace recording', response.status);
        }
        const data = await response.json();
        return this.normalizeRecording(data.recording);
    }

    /**
     * Deletes a recording by ID.
     * @param {string} id 
     */
    async remove(id) {
        const response = await fetch(`/api/recordings/${id}`, {
            method: 'DELETE',
            credentials: 'include',
        }).catch(() => {
            throw new RecordingApiError('Network error', 'NETWORK_ERROR', 0);
        });
        if (!response.ok) {
            const data = await response.json().catch(() => ({}));
            throw this.buildRecordingError(data, 'Failed to delete recording', response.status);
        }
    }
}