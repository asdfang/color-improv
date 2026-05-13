import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBook } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { LibraryDrawer } from './LibraryDrawer';
import { useRecordings } from '../../contexts/RecordingsContext';
import { MAX_RECORDINGS_PER_USER } from '../../constants';

export function LibraryButton() {
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const { count } = useRecordings();
    const libraryIcon = <FontAwesomeIcon icon={faBook} aria-hidden="true" />;
    return (
        <>
            <button
                className="btn-text library-btn"
                onClick={() => setIsLibraryOpen(true)}
            >
                {libraryIcon} Open Library ({count}/{MAX_RECORDINGS_PER_USER})
            </button>
            {isLibraryOpen && (
                <LibraryDrawer
                    isOpen={isLibraryOpen}
                    onClose={() => setIsLibraryOpen(false)}
                />
            )}
        </>
    );
}