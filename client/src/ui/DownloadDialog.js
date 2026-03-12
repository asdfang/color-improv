import mime from 'mime-types';
import JSZip from 'jszip';

export class DownloadDialog {
    constructor() {
        this.downloadDialog = /** @type {HTMLDialogElement} */ (document.getElementById('download-dialog'));
        this.confirmDialog = /** @type {HTMLDialogElement} */ (document.getElementById('confirm-close-dialog'));
        this.audioPreview = /** @type {HTMLAudioElement} */ (document.getElementById('recording-preview'));
        this.logPreview = /** @type {HTMLTextAreaElement} */ (document.getElementById('note-log-preview'));
        this.downloadAudioBtn = /** @type {HTMLButtonElement} */ (document.getElementById('download-audio-btn'));
        this.downloadLogBtn = /** @type {HTMLButtonElement} */ (document.getElementById('download-log-btn'));
        this.downloadZipBtn = /** @type {HTMLButtonElement} */ (document.getElementById('download-zip-btn'));
        this.downloadBtnLabel = /** @type {HTMLSpanElement} */ (document.getElementById('download-btn-label'));
        this.closeBtn = /** @type {HTMLButtonElement} */ (document.getElementById('close-download-dialog-btn'));
        this.confirmYesBtn = /** @type {HTMLButtonElement} */ (document.getElementById('confirm-close-yes-btn'));
        this.confirmCancelBtn = /** @type {HTMLButtonElement} */ (document.getElementById('confirm-close-cancel-btn'));
    }

    /**
     * Display dialog with audio and log preview and download options.
     * @param {*} recordingBlob blob containing the recorded audio data from RecordingEngine
     * @param {*} logObject raw log data from NoteLogger
     */
    showDialog(recordingBlob, logObject) {
        if (!this.downloadDialog || !this.confirmDialog) {
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
        let zipUrl;

        // Track download state
        let zipDownloaded = false;

        const setZipButtonState = (isDownloaded) => {
            if (!this.downloadZipBtn) return;

            this.downloadZipBtn.classList.toggle('downloaded', isDownloaded);

            if (this.downloadBtnLabel) {
                this.downloadBtnLabel.textContent = isDownloaded ? 'Downloaded' : 'Download All (ZIP)';
            }
        };

        setZipButtonState(false);

        if (this.audioPreview) this.audioPreview.src = recordingUrl;

        // Display full JSON preview (scrollable via CSS)
        if (this.logPreview) {
            this.logPreview.textContent = logData;
        }

        if (this.downloadZipBtn) {
            this.downloadZipBtn.onclick = async () => {
                const zip = new JSZip();
                zip.file(`recording.${recordingExt}`, recordingBlob);
                zip.file(`note_log.json`, logBlob);
                const zipBlob = await zip.generateAsync({ type: 'blob' });

                const link = document.createElement('a');
                zipUrl = URL.createObjectURL(zipBlob);
                link.href = zipUrl;
                link.download = `color_improv_${Date.now()}.zip`;
                link.click();
                zipDownloaded = true;
                setZipButtonState(true);
            }
        }

        const cleanupAndClose = () => {
            if (this.audioPreview) this.audioPreview.src = '';
            if (this.logPreview) this.logPreview.textContent = '';
            if (this.downloadZipBtn) {
                setZipButtonState(false);
            }
            URL.revokeObjectURL(recordingUrl);
            URL.revokeObjectURL(zipUrl);

            this.downloadDialog.close();
        };

        const requestClose = () => {
            if (this.confirmDialog.open) {
                return;
            }

            if (!zipDownloaded) {
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

        if (this.closeBtn) {
            this.closeBtn.onclick = requestClose;
        }

        this.downloadDialog.onkeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                requestClose();
            }
        };

        this.confirmDialog.onkeydown = (e) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                e.stopPropagation();
                this.confirmDialog.close();
            }
        };

        this.downloadDialog.showModal();
    }
}