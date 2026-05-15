import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCloudArrowUp, faArrowLeft } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { Dialog } from './Dialog';
import { useRecordings } from '../../contexts/RecordingsContext';
import { RecordingApiError } from '../../api/RecordingService';
import PropTypes from 'prop-types';

/**
 * 
 * @param {{
 *      isOpen: boolean,
 *      onSaved: () => void,
 *      onGoBack: () => void,
 *      onLibraryFull: () => void,
 *      recordingResult: NonNullable<import('../../contexts/PlaybackContext').RecordingResult>
 * }} props 
 */
export function MetadataDialog({ isOpen, onSaved, onGoBack, onLibraryFull, recordingResult }) {
    const { audioBlob, logObject, durationSeconds } = recordingResult;
    const [title, setTitle] = useState(`performance-${new Date().toLocaleString()}`);
    const [notes, setNotes] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [feedback, setFeedback] = useState('');

    const { create } = useRecordings();

    const saveIcon = <FontAwesomeIcon icon={faCloudArrowUp} aria-hidden="true" />;
    const backIcon = <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />;

    const handleSave = async () => {
        setIsSaving(true);
        setFeedback('');
        try {
            await create({ title, notes, audioBlob, logObject, durationSeconds });
            onSaved();
        } catch (error) {
            if (error instanceof RecordingApiError && error.code === 'LIBRARY_FULL') {
                onLibraryFull();
                return;
            }
            setFeedback('Failed to save recording. Please try again.');
        } finally {
            setIsSaving(false);
        }
    }

    const footer = (
        <>
            <button
                className="btn-text back-btn"
                onClick={onGoBack}
                disabled={isSaving}
            >
                Go Back {backIcon}
            </button>
            <button
                className="btn-text save-btn"
                onClick={handleSave}
                disabled={title.trim() === '' || isSaving}
            >
                {isSaving ? 'Saving...' : 'Save'} {saveIcon}
            </button>
        </>
    );

    return (
        <Dialog
            id="metadata-dialog"
            className="metadata-dialog"
            isOpen={isOpen}
            onClose={onGoBack}
            title="Save Recording to Account Library"
            closeOnBackdrop={false}
            footer={footer}
        >
            <form className="metadata-form" onSubmit={e => { e.preventDefault(); handleSave(); }}>
                <label htmlFor="title">Title (required):</label>
                <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                />
                <label htmlFor="notes">Notes (optional):</label>
                <textarea
                    id="notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                />
                {feedback && <div className="user-feedback" role="alert">{feedback}</div>}
            </form>
        </Dialog>
    );
}

MetadataDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onSaved: PropTypes.func.isRequired,
    onGoBack: PropTypes.func.isRequired,
    onLibraryFull: PropTypes.func.isRequired,
    recordingResult: PropTypes.shape({
        audioBlob: PropTypes.instanceOf(Blob).isRequired,
        logObject: PropTypes.object.isRequired,
        durationSeconds: PropTypes.number.isRequired,
    }).isRequired,
};