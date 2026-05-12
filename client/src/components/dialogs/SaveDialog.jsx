import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faDownload, faCheck, faTimes } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { useRef, useEffect } from 'react';
import { Dialog } from './Dialog';
import { ConfirmCloseDialog } from './ConfirmCloseDialog';
import { useAuth } from '../../contexts/AuthContext';
import { useRecordings } from '../../contexts/RecordingsContext';
import { downloadRecordingZip } from '../../utils';
import { MAX_RECORDINGS_PER_USER } from '/src/constants';
import PropTypes from 'prop-types';

/**
 * @param {{isOpen: boolean, onClose: () => void, recordingResult: import('../../contexts/PlaybackContext').RecordingResult}} props
 */
export function SaveDialog({ isOpen, onClose, recordingResult }) {  
    const { recordingBlob, logObject } = recordingResult || {};
    const [ hasSaved, setHasSaved ] = useState(false);
    const [ hasDownloaded, setHasDownloaded ] = useState(false);
    const [ isConfirmDialogOpen, setIsConfirmDialogOpen ] = useState(false);
    const [ isMetadataDialogOpen, setIsMetadataDialogOpen ] = useState(false);
    const [ isDeleteDialogOpen, setIsDeleteDialogOpen ] = useState(false);
    const audioRef = useRef(/** @type {HTMLAudioElement | null} */(null));
    const preRef = useRef(/** @type {HTMLPreElement | null} */(null));

    const { currentUser } = useAuth();
    const { count } = useRecordings();

    const saveIcon = <FontAwesomeIcon icon={faCloudArrowUp} aria-hidden="true" />;
    const downloadIcon = <FontAwesomeIcon icon={faDownload} aria-hidden="true" />;
    const checkIcon = <FontAwesomeIcon icon={faCheck} aria-hidden="true" />;
    const closeIcon = <FontAwesomeIcon icon={faTimes} aria-hidden="true" />;

    const onSaved = () => setHasSaved(true);

    const handleSave = async () => {
        if (!currentUser) return;
        if (count < MAX_RECORDINGS_PER_USER) {
            setIsMetadataDialogOpen(true);
        } else {
            setIsDeleteDialogOpen(true);
        }
    }

    const handleDownload = async () => {
        await downloadRecordingZip(recordingBlob, logObject);
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
        if (!hasSaved && !hasDownloaded) {
            setIsConfirmDialogOpen(true);
        }
        else {
            setHasSaved(false);
            setHasDownloaded(false);
            onClose();
        }
    }

    const footer = (
        <>
            <button className={`btn-text save-btn ${hasSaved ? 'saved' : ''}`} onClick={handleSave} disabled={!currentUser}>
                {hasSaved ? <>Saved {checkIcon}</> : <>Save to Account {saveIcon}</>}
            </button>
            <button className={`btn-text download-btn ${hasDownloaded ? 'downloaded' : ''}`} onClick={handleDownload}>
                {hasDownloaded ? <>Downloaded {checkIcon}</> : <>Download (ZIP) {downloadIcon}</>}
            </button>
            <button className="btn-text close-btn" onClick={handleClose}>Close {closeIcon}</button>
        </>
    );

    return (
        <>
            <Dialog
                id="save-dialog"
                className="save-dialog"
                isOpen={isOpen}
                onClose={handleClose}
                title="Save Recording"
                closeOnBackdrop={false} // Prevent accidentally closing
                footer={footer}
            >
                <div className="recording-sections">
                    <div className="recording-section">
                        <h3>Audio</h3>
                        <div className="audio-preview">
                            <audio ref={audioRef} controls controlsList="nodownload noplaybackrate" aria-label="Audio preview"/>
                        </div>
                    </div>
                    <div className="recording-section">
                        <h3>MIDI Log</h3>
                        <div className="log-preview">
                            <pre ref={preRef} className="log-pre" aria-label="MIDI log preview"/>
                            <div className="log-preview-fade" />
                        </div>
                    </div>
                </div>
                <p>Great performance! You can save your audio and MIDI log below.</p>
                {currentUser === null && <p>(Log in before recording to save to account library next time!)</p>}
            </Dialog>
            <MetadataDialog
                isOpen={isMetadataDialogOpen}
                >
            </MetadataDialog>
            <DeleteDialog
                isOpen={isDeleteDialogOpen}>
            </DeleteDialog>
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

SaveDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    recordingResult: PropTypes.shape({
        recordingBlob: PropTypes.instanceOf(Blob).isRequired,
        logObject: PropTypes.instanceOf(Object).isRequired,
    }),
};