import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons/faBook';
import { Drawer } from './Drawer';
import { RecordingRow } from '../../recordings/RecordingRow';
import { useRecordings } from '../../../contexts/RecordingsContext';
import { MAX_RECORDINGS_PER_USER } from '../../../constants';

/**
 * Open/close responsibility in RecordingsContext since it's used in MobileDrawer and SettingsPanel.
 */
export function LibraryDrawer() {
    const { recordingsList, count, update, remove, isLibraryDrawerOpen, setIsLibraryDrawerOpen } = useRecordings();

    const libraryIcon = <FontAwesomeIcon icon={faBook} aria-hidden="true" />;

    return (
        <>
            {!isLibraryDrawerOpen && (
                <button
                    className="btn-text library-drawer-open-btn"
                    onClick={() => setIsLibraryDrawerOpen(true)}
                    aria-label="Open library"
                    aria-controls="library-drawer"
                >
                    Recordings Library {libraryIcon}
                </button>
            )}
            <Drawer
                id="library-drawer"
                className="library-drawer"
                isOpen={isLibraryDrawerOpen}
                onClose={() => setIsLibraryDrawerOpen(false)}
                header={<h2>Your Recordings ({count}/{MAX_RECORDINGS_PER_USER})</h2>}
            >
                <p>Listen to your recordings, edit title and notes, download, and delete here!</p>
                <ol className="recordings-list">
                    {recordingsList.map(recording => (
                        <RecordingRow
                            key={recording.id}
                            recording={recording}
                            onDelete={remove}
                            onUpdate={update}
                        />
                    ))}
                </ol>
            </Drawer>
        </>
    );
}