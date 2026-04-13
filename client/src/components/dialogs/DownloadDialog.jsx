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

    const downloadIcon = <FontAwesomeIcon icon={faDownload} />;
    const checkIcon = <FontAwesomeIcon icon={faCheck} />;
    const closeIcon = <FontAwesomeIcon icon={faTimes} />;

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
        URL.revokeObjectURL(zipUrl);
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
            ? `${logLines.slice(0, numPreviewLines).join('\n')}\n\n… Download ZIP to view full JSON.`
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
            onClose();
        }
    }

    return (
        <>
            <Dialog
                isOpen={isOpen}
                onClose={handleClose}
                title="Download Recording"
                closeOnBackdrop={false} // Prevent accidentally closing
            >
                <p>Great performance! You can download your recording (and MIDI log) below.</p>
                <div className="recording-preview">
                    <div className="recording-preview audio">
                        <h3>Audio</h3>
                        <div className="recording-preview audio wrapper">
                            <audio ref={audioRef} controls controlsList="nodownload noplaybackrate" />
                        </div>
                    </div>
                    <div className="recording-preview log">
                        <h3>MIDI Log</h3>
                        <div className="recording-preview log wrapper">
                            <pre ref={preRef} />
                        </div>
                    </div>
                </div>
                <div className="download-buttons">
                    <button className="btn-text download-btn" onClick={handleDownload}>
                        {hasDownloaded ? <>Downloaded {checkIcon}</> : <>Download (ZIP) {downloadIcon}</>}
                    </button>
                    <button className="btn-text close-btn" onClick={handleClose}>Close {closeIcon}</button>
                </div>
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
        logBlob: PropTypes.instanceOf(Blob),
    }),
};