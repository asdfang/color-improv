import mime from 'mime-types';
import JSZip from 'jszip';

/**
 * Handles the download dialog UI, including rendering previews, managing download state, and confirming unsaved downloads.
 * TODO: This class is doing heavy lifting - the preparation for download could be refactored out.
 */
export class DownloadDialog {
    constructor() {
        this.downloadDialog = /** @type {HTMLDialogElement} */ (document.getElementById('download-dialog'));
        this.confirmDialog = /** @type {HTMLDialogElement} */ (document.getElementById('confirm-close-dialog'));
        this.audioPreview = /** @type {HTMLAudioElement} */ (document.getElementById('recording-preview'));
        this.logPreview = /** @type {HTMLPreElement} */ (document.getElementById('note-log-preview'));
        this.downloadZipBtn = /** @type {HTMLButtonElement} */ (document.getElementById('download-zip-btn'));
        this.downloadBtnLabel = /** @type {HTMLSpanElement} */ (document.getElementById('download-btn-label'));
        this.closeBtn = /** @type {HTMLButtonElement} */ (document.getElementById('close-download-dialog-btn'));
        this.confirmYesBtn = /** @type {HTMLButtonElement} */ (document.getElementById('confirm-close-yes-btn'));
        this.confirmCancelBtn = /** @type {HTMLButtonElement} */ (document.getElementById('confirm-close-cancel-btn'));
    }

    /**
     * @param {string} mimeType
     * @returns {string} file extension without dot
     */
    normalizeRecordingExtension(mimeType) {
        let extension = mime.extension(mimeType) || 'webm';
        // Force better compatibility with common browsers
        if (extension === 'weba') extension = 'webm';
        if (extension === 'mp4') extension = 'm4a';
        return extension;
    }

    /**
     * Toggle ZIP download button state and label.
     * @param {boolean} isDownloaded
     */
    setZipButtonState(isDownloaded) {
        if (!this.downloadZipBtn) return;

        this.downloadZipBtn.classList.toggle('downloaded', isDownloaded);

        if (this.downloadBtnLabel) {
            this.downloadBtnLabel.textContent = isDownloaded ? 'Downloaded' : 'Download All (ZIP)';
        }
    }

    /**
     * Render audio and log previews in the dialog.
     * @param {string} recordingUrl
     * @param {string} logData
     */
    renderPreviewContent(recordingUrl, logData) {
        if (!this.audioPreview || !this.logPreview) {
            console.error('DownloadDialog: Missing preview elements');
            return;
        }

        const previewLineLimit = 24;
        const lines = logData.split('\n');
        const isTruncated = lines.length > previewLineLimit;
        const previewText = isTruncated
            ? `${lines.slice(0, previewLineLimit).join('\n')}\n\n… Preview truncated. Download ZIP to view full JSON.`
            : logData;

        this.audioPreview.src = recordingUrl;
        this.logPreview.textContent = previewText;
        this.logPreview.scrollTop = 0;
    }

    /**
     * Clean up resources and close the dialog.
     * @param {{ zipDownloaded: boolean, zipUrl: string | undefined }} state
     */
    cleanupAndClose(state) {
        if (!this.audioPreview || !this.logPreview || !this.downloadDialog) {
            console.error('DownloadDialog: Missing elements required for cleanup');
            return;
        }

        this.audioPreview.src = '';
        this.logPreview.textContent = '';
        this.setZipButtonState(false);

        if (state.zipUrl) {
            URL.revokeObjectURL(state.zipUrl);
        }

        this.downloadDialog.close();
    }

    /**
     * Bind click event to ZIP download button to generate and download a ZIP file containing the recording and log.
     * @param {*} recordingBlob
     * @param {Blob} logBlob
     * @param {{ recordingExt: string, zipDownloaded: boolean, zipUrl: string | undefined }} state
     */
    bindZipDownload(recordingBlob, logBlob, state) {
        if (!this.downloadZipBtn) return;

        this.downloadZipBtn.onclick = async () => {
            const zip = new JSZip();
            // TODO: Investigate file size discrepancies with JSZip
            zip.file(`recording.${state.recordingExt}`, recordingBlob);
            zip.file('note_log.json', logBlob);
            const zipBlob = await zip.generateAsync({ type: 'blob' });

            if (state.zipUrl) {
                URL.revokeObjectURL(state.zipUrl);
                state.zipUrl = undefined;
            }

            const link = document.createElement('a');
            state.zipUrl = URL.createObjectURL(zipBlob);
            link.href = state.zipUrl;
            link.download = `color_improv_${Date.now()}.zip`;
            link.click();

            const createdZipUrl = state.zipUrl;
            window.setTimeout(() => {
                if (state.zipUrl !== createdZipUrl) return;
                URL.revokeObjectURL(createdZipUrl);
                state.zipUrl = undefined;
            }, 1000);

            state.zipDownloaded = true;
            this.setZipButtonState(true);
        };
    }

    /**
     * @param {() => void} onConfirmClose
     */
    openUnsavedConfirm(onConfirmClose) {
        if (!this.confirmDialog || !this.confirmYesBtn || !this.confirmCancelBtn) {
            console.error('DownloadDialog: Missing confirmation dialog elements');
            return;
        }

        this.confirmYesBtn.onclick = () => {
            this.confirmDialog.close();
            onConfirmClose();
        };

        this.confirmCancelBtn.onclick = () => {
            this.confirmDialog.close();
        };

        this.confirmDialog.showModal();
    }

    /**
     * @param {{ zipDownloaded: boolean }} state
     * @param {() => void} cleanup
     */
    requestClose(state, cleanup) {
        if (this.confirmDialog.open) return;

        if (state.zipDownloaded) {
            cleanup();
            return;
        }

        this.openUnsavedConfirm(cleanup);
    }

    /**
     * @param {() => void} requestClose
     */
    bindCloseHandlers(requestClose) {
        if (!this.closeBtn || !this.downloadDialog || !this.confirmDialog) {
            console.error('DownloadDialog: Missing close handler elements');
            return;
        }

        this.closeBtn.onclick = requestClose;

        this.downloadDialog.onkeydown = (e) => {
            if (e.key !== 'Escape') return;
            e.preventDefault();
            e.stopPropagation();
            requestClose();
        };

        this.confirmDialog.onkeydown = (e) => {
            if (e.key !== 'Escape') return;
            e.preventDefault();
            e.stopPropagation();
            this.confirmDialog.close();
        };
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
        const recordingExt = this.normalizeRecordingExtension(recordingBlob.type);
        const logData = JSON.stringify(logObject, null, 2);
        const logBlob = new Blob([logData], { type: 'application/json' });

        const state = {
            recordingExt,
            zipDownloaded: false,
            zipUrl: undefined,
        };

        this.setZipButtonState(false);
        this.renderPreviewContent(recordingUrl, logData);
        this.bindZipDownload(recordingBlob, logBlob, state);

        const cleanup = () => {
            this.cleanupAndClose(state);
            URL.revokeObjectURL(recordingUrl);
        };

        const requestClose = () => {
            this.requestClose(state, cleanup);
        };

        this.bindCloseHandlers(requestClose);

        this.downloadDialog.showModal();
    }
}