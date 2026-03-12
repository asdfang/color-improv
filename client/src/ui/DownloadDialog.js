import mime from 'mime-types';

export class DownloadDialog {
    constructor() {
        this.dialog = /** @type {HTMLDialogElement} */ (document.getElementById('download-dialog'));
        this.confirmDialog = /** @type {HTMLDialogElement} */ (document.getElementById('confirm-close-dialog'));
        this.audioPreview = /** @type {HTMLAudioElement} */ (document.getElementById('recording-preview'));
        this.logPreview = /** @type {HTMLTextAreaElement} */ (document.getElementById('note-log-preview'));
        this.downloadAudioBtn = /** @type {HTMLButtonElement} */ (document.getElementById('download-audio-btn'));
        this.downloadLogBtn = /** @type {HTMLButtonElement} */ (document.getElementById('download-log-btn'));
        this.closeBtn = /** @type {HTMLButtonElement} */ (document.getElementById('close-download-dialog-btn'));
        this.unsavedList = /** @type {HTMLDivElement} */ (document.getElementById('unsaved-list'));
        this.confirmYesBtn = /** @type {HTMLButtonElement} */ (document.getElementById('confirm-close-yes-btn'));
        this.confirmCancelBtn = /** @type {HTMLButtonElement} */ (document.getElementById('confirm-close-cancel-btn'));
    }

    /**
     * Display dialog with audio and log preview and download options.
     * TODO: Esc with same unsaved confirmation as close button
     * TODO: Space to click on tab focuses, instead of toggling play/pause
     * @param {*} recordingBlob blob containing the recorded audio data from RecordingEngine
     * @param {*} logObject raw log data from NoteLogger
     */
    showDialog(recordingBlob, logObject) {
        if (!this.dialog || !this.confirmDialog) {
            console.error('DownloadDialog: Dialog elements not found');
            return;
        }

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

        if (this.audioPreview) this.audioPreview.src = recordingUrl;

        // Display truncated JSON preview
        if (this.logPreview) {
            const lines = logData.split('\n');
            const previewLines = lines.slice(0, 12);
            const previewText = previewLines.join('\n') + (lines.length > 12 ? '\n...' : '');
            this.logPreview.textContent = previewText;
        }

        if (this.downloadAudioBtn) {
            this.downloadAudioBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = recordingUrl;
                link.download = `recording_${Date.now()}.${recordingExt}`;
                link.click();
                audioDownloaded = true;
                this.downloadAudioBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded';
                this.downloadAudioBtn.classList.add('downloaded');
            };
        }

        if (this.downloadLogBtn) {
            this.downloadLogBtn.onclick = () => {
                const link = document.createElement('a');
                link.href = logUrl;
                link.download = `note_log_${Date.now()}.json`;
                link.click();
                logDownloaded = true;
                this.downloadLogBtn.innerHTML = '<i class="fas fa-check"></i> Downloaded';
                this.downloadLogBtn.classList.add('downloaded');
            };
        }

        const cleanupAndClose = () => {
            if (this.audioPreview) this.audioPreview.src = '';
            if (this.logPreview) this.logPreview.textContent = '';
            // Reset button states
            if (this.downloadAudioBtn) {
                this.downloadAudioBtn.innerHTML = '<i class="fas fa-download"></i> Download Audio';
                this.downloadAudioBtn.classList.remove('downloaded');
            }
            if (this.downloadLogBtn) {
                this.downloadLogBtn.innerHTML = '<i class="fas fa-download"></i> Download Note Log';
                this.downloadLogBtn.classList.remove('downloaded');
            }
            URL.revokeObjectURL(recordingUrl);
            URL.revokeObjectURL(logUrl);
            this.dialog.close();
        };

        if (this.closeBtn) {
            this.closeBtn.onclick = () => {
                // Check if both files have been downloaded
                if (!audioDownloaded || !logDownloaded) {
                    // Show confirmation dialog
                    const unsavedItems = [];
                    if (!audioDownloaded) unsavedItems.push('Audio recording');
                    if (!logDownloaded) unsavedItems.push('Note log');
                    if (this.unsavedList) {
                        this.unsavedList.textContent = `Not yet downloaded: ${unsavedItems.join(', ')}`;
                    }

                    if (this.confirmYesBtn) {
                        this.confirmYesBtn.onclick = () => {
                            this.confirmDialog.close();
                            cleanupAndClose();
                        };
                    }

                    if (this.confirmCancelBtn) {
                        this.confirmCancelBtn.onclick = () => {
                            this.confirmDialog.close();
                        };
                    }

                    this.confirmDialog.showModal();
                } else {
                    cleanupAndClose();
                }
            };
        }

        this.dialog.showModal();
    }
}