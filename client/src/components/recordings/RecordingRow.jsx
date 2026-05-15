import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faCheck, faTimes, faDownload, faTrash } from '@fortawesome/free-solid-svg-icons';
import PropTypes from 'prop-types';
import { useState } from 'react';
import { useRecordings } from '../../contexts/RecordingsContext';
import { downloadRecordingZip } from '../../utils';

/**
 * If onUpdate is provided, title and notes fields are editable. Otherwise, read-only.
 * Both views allow deleting and downloading the recording.
 * @param {{
 *   recording: import('../../api/RecordingService').Recording,
 *   onDelete: (id: string) => Promise<void>,
 *   onUpdate?: (id: string, params: { title?: string, notes?: string }) => Promise<void>
 * }} props 
 */
export function RecordingRow({ recording, onDelete, onUpdate=undefined }) {
    const { id, title, notes, createdAt } = recording;
    const [ newTitle, setNewTitle ] = useState(title);
    const [ newNotes, setNewNotes ] = useState(notes);
    const [ editState, setEditState ] = useState('viewing'); // 'viewing' | 'editing' | 'updating'
    const [ isDownloading, setIsDownloading ] = useState(false);
    const [ isDeleting, setIsDeleting ] = useState(false);

    const { fetchArtifacts } = useRecordings();
    const isEditable = onUpdate !== undefined;

    const editIcon = <FontAwesomeIcon icon={faPen} aria-hidden="true" />;
    const acceptIcon = <FontAwesomeIcon icon={faCheck} aria-hidden="true" />;
    const cancelIcon = <FontAwesomeIcon icon={faTimes} aria-hidden="true" />;
    const downloadIcon = <FontAwesomeIcon icon={faDownload} aria-hidden="true" />;
    const deleteIcon = <FontAwesomeIcon icon={faTrash} aria-hidden="true" />;

    const handleEdit = () => {
        setEditState('editing');
    }

    const handleUpdate = async () => {
        if (onUpdate === undefined) return;
        setEditState('updating');
        try {
            await onUpdate(id, { title: newTitle, notes: newNotes });
            setEditState('viewing');
        } catch (error) {
            console.error('Error updating recording:', error);
            setEditState('editing'); // Retry
        }
    }

    const handleCancel = () => {
        setEditState('viewing');
        setNewTitle(title); // Reset
        setNewNotes(notes);
    }

    const handleDownload = async () => {
        setIsDownloading(true);
        try {
            const { audioBlob, logObject } = await fetchArtifacts(id);
            await downloadRecordingZip(audioBlob, logObject, title);
        } catch (error) {
            console.error('Error downloading recording:', error);
            // setFeedback('Failed to download recording. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    }

    const handleDelete = async () => {
        setIsDeleting(true);
        try {
            await onDelete(id);
        } catch (error) {
            console.error('Error deleting recording:', error);
            // setFeedback('Failed to delete recording. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    }

    const editButton = (
        <button
            className="btn-text edit-btn"
            onClick={editState === 'viewing' ? handleEdit : handleUpdate}
            disabled={editState === 'updating' || newTitle.trim() === ''}
        >
            {editState === 'viewing' ? editIcon : acceptIcon}
        </button>
    );

    const cancelButton = (
        <button
            className="btn-text cancel-btn"
            onClick={handleCancel}
            disabled={editState === 'updating'}
        >
            {cancelIcon}
        </button>
    );

    const downloadButton = (
        <button
            className={`btn-text download-btn ${isDownloading ? 'downloading' : ''}`}
            onClick={handleDownload}
            disabled={isDownloading}
        >
            {downloadIcon}
        </button>
    );

    const deleteButton = (
        <button
            className={`btn-text delete-btn ${isDeleting ? 'deleting' : ''}`}
            onClick={handleDelete}
            disabled={isDeleting}
        >
            {deleteIcon}
        </button>
    );

    const titleInput = (
        <input
            type="text"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder={'Title cannot be empty'}
        />
    );

    const notesInput = (
        <textarea
            value={newNotes}
            onChange={e => setNewNotes(e.target.value)}
            placeholder={'Add your notes here!'}
        />
    );

    return (
        <li className={`recording-row ${isEditable ? 'library' : 'preview'}`}>
            <div className="recording-info">
                {editState === 'editing' ? titleInput : <h3 className="recording-title">{title}</h3>}
                <div className="recording-actions">
                    {isEditable && editButton}
                    {(isEditable && editState === 'editing') ? cancelButton : downloadButton}
                    {editState === 'viewing' && deleteButton}
                </div>
                {editState === 'editing' ? notesInput : <p className="recording-notes">{notes === '' ? 'Add your notes here!' : notes}</p>}
                <audio controls src={`/api/recordings/${id}/audio`}></audio>
                <p className="recording-meta">
                    Created: {new Date(createdAt).toLocaleString()}
                </p>
            </div>
        </li>
    );
}

RecordingRow.propTypes = {
    recording: PropTypes.shape({
        id: PropTypes.string.isRequired,
        title: PropTypes.string.isRequired,
        notes: PropTypes.string.isRequired,
        createdAt: PropTypes.string.isRequired,
    }).isRequired,
    onDelete: PropTypes.func.isRequired,
    onUpdate: PropTypes.func,
}