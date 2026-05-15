import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import { Dialog } from "./Dialog";
import { RecordingRow } from "../recordings/RecordingRow";
import { useRecordings } from "../../contexts/RecordingsContext";
import PropTypes from "prop-types";

/**
 * 
 * @param {{
 *      isOpen: boolean,
 *      onDeleted: () => void,
 *      onGoBack: () => void
 * }} props 
 * @returns 
 */
export function DeleteDialog({ isOpen, onDeleted, onGoBack }) {
    const [ isDeleting, setIsDeleting ] = useState(false);
    const [ feedback, setFeedback ] = useState('');
    const { recordingsList, remove } = useRecordings();
    const backIcon = <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />;

    /**
     * @param {string} id 
     */
    const handleDelete = async (id) => {
        setIsDeleting(true);
        try {
            await remove(id);
            onDeleted();
        } catch (error) {
            console.error('Error deleting recording:', error);
            setFeedback('Failed to delete recording. Please try again');
        } finally {
            setIsDeleting(false);
        }
    }

    const footer = (
        <button
            className="btn-text back-btn"
            onClick={onGoBack}
            disabled={isDeleting}
        >
            Go Back {backIcon}
        </button>
    );

    return (
        <Dialog
            id="delete-dialog"
            className="delete-dialog"
            isOpen={isOpen}
            onClose={onGoBack}
            title="Library Full"
            closeOnBackdrop={false}
            footer={footer}
        >
            <p>Your recording library is full. Please delete an existing recording to save your new take.</p>
            <p>Reminder: you can download the recording before deleting it from your library!</p>
            {feedback && <div className="user-feedback" role="alert">{feedback}</div>}
            <ol className="recordings-list">
                {recordingsList.map(recording => (
                    <RecordingRow
                        key={recording.id}
                        recording={recording}
                        onDelete={handleDelete}
                    />
                ))}
            </ol>
        </Dialog>
    );
}

DeleteDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onDeleted: PropTypes.func.isRequired,
    onGoBack: PropTypes.func.isRequired
};