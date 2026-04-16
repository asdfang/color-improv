import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useRef, useEffect } from 'react';
import { Dialog } from './Dialog';
import { ConfirmCloseDialog } from './ConfirmCloseDialog';
import PropTypes from 'prop-types';

import JSZip from 'jszip';
import mime from 'mime-types';

/**
 * @param {string} mimeType
 * @returns {string} file extension without dot
 */
function normalizeRecordingExtension(mimeType) {
    let extension = mime.extension(mimeType) || 'webm';
    // Force better compatibility with common browsers
    if (extension === 'weba') extension = 'webm';
    if (extension === 'mp4') extension = 'm4a';
    return extension;
}

/**
 * @param {{isOpen: boolean, onClose: () => void, recordingResult: import('../../contexts/PlaybackContext').RecordingResult}} props
 */
export function DownloadDialog({ isOpen, onClose, recordingResult }) {
    const { recordingBlob, logObject } = recordingResult || {};
    const [ hasDownloaded, setHasDownloaded ] = useState(false);
    const [ isConfirmDialogOpen, setIsConfirmDialogOpen ] = useState(false);
    const audioRef = useRef(/** @type {HTMLAudioElement | null} */(null));
    const preRef = useRef(/** @type {HTMLPreElement | null} */(null));

    const downloadIcon = <FontAwesomeIcon icon={faDownload} aria-hidden="true" />;
    const checkIcon = <FontAwesomeIcon icon={faCheck} aria-hidden="true" />;
    const closeIcon = <FontAwesomeIcon icon={faTimes} aria-hidden="true" />;

    const handleDownload = async () => {
        if (!recordingBlob || !logObject) return;

        const zip = new JSZip();
        const ext = normalizeRecordingExtension(recordingBlob.type);
        zip.file(`recording.${ext}`, recordingBlob);
        zip.file('log.json', JSON.stringify(logObject, null, 2));

        const zipBlob = await zip.generateAsync({ type: 'blob' });
        const zipUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement('a');
        a.href = zipUrl;
        a.download = `performance_${Date.now()}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(zipUrl), 100);
        setHasDownloaded(true);
    }

    // Update audio source when recordingBlob changes, and revoke URL on cleanup
    useEffect(() => {
        if (recordingBlob && audioRef.current) {
            const recordingUrl = URL.createObjectURL(recordingBlob);
            audioRef.current.src = recordingUrl;

            return () => {
                URL.revokeObjectURL(recordingUrl);
            };
        }
    }, [recordingBlob]);

    // Render log preview with truncation if too long, and scroll to top on new log
    useEffect(() => {
        if (logObject && preRef.current) {
            const numPreviewLines = 80;
            const logJson = JSON.stringify(logObject, null, 2);
            const logLines = logJson.split('\n');
            const isTruncated = logLines.length > numPreviewLines;
            const logPreview = isTruncated
            ? `${logLines.slice(0, numPreviewLines).join('\n')}\n\n… Download ZIP to view full data.`
            : logJson;
            preRef.current.textContent = logPreview;
            preRef.current.scrollTop = 0;
        }
    }, [logObject]);

    const handleClose = () => {
        if (!hasDownloaded) {
            setIsConfirmDialogOpen(true);
        }
        else {
            setHasDownloaded(false); // Cleanup for next time dialog is opened
            onClose();
        }
    }

    const footer = (
        <>
            <button className={`btn-text download-btn ${hasDownloaded ? 'downloaded' : ''}`} onClick={handleDownload}>
                {hasDownloaded ? <>Downloaded {checkIcon}</> : <>Download (ZIP) {downloadIcon}</>}
            </button>
            <button className="btn-text close-btn" onClick={handleClose}>Close {closeIcon}</button>
        </>
    );

    return (
        <>
            <Dialog
                id="download-dialog"
                isOpen={isOpen}
                onClose={handleClose}
                title="Download Recording"
                closeOnBackdrop={false} // Prevent accidentally closing
                footer={footer}
            >
                <div className="recording-sections">
                    <div className="recording-section">
                        <h3>Audio</h3>
                        <div className="audio-preview">
                            <audio ref={audioRef} controls controlsList="nodownload noplaybackrate" />
                        </div>
                    </div>
                    <div className="recording-section">
                        <h3>MIDI Log</h3>
                        <div className="log-preview">
                            <pre ref={preRef} id="log-pre"/>
                            <div className="log-preview-fade" />
                        </div>
                    </div>
                </div>
                <p>Great performance! You can download your audio and MIDI log below.</p>
            </Dialog>
            <ConfirmCloseDialog
                isOpen={isConfirmDialogOpen}
                onGoBack={() => setIsConfirmDialogOpen(false)}
                onConfirmClose={() => {
                    setIsConfirmDialogOpen(false);
                    onClose();
                }}
            />
        </>
    );
}

DownloadDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    recordingResult: PropTypes.shape({
        recordingBlob: PropTypes.instanceOf(Blob).isRequired,
        logObject: PropTypes.instanceOf(Object).isRequired,
    }),
};