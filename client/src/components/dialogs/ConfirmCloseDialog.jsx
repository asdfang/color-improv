import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft, faTimes } from '@fortawesome/free-solid-svg-icons';
import { Dialog } from './Dialog';
import PropTypes from 'prop-types';

/** @param {{isOpen: boolean, onGoBack: () => void, onConfirmClose: () => void}} props */
export function ConfirmCloseDialog({ isOpen, onGoBack, onConfirmClose }) {
    const backIcon = <FontAwesomeIcon icon={faArrowLeft} />;
    const closeIcon = <FontAwesomeIcon icon={faTimes} />;

    const footer = (
        <>
            <button className="btn-text back-btn" onClick={onGoBack}>
                Go Back {backIcon}
            </button>
            <button className="btn-text close-btn" onClick={onConfirmClose}>
                Close Anyway {closeIcon}
            </button>
        </>
    );
    return (
        <Dialog
            id="confirm-close-dialog"
            isOpen={isOpen}
            onClose={onGoBack}
            title="Unsaved Changes"
            footer={footer}
        >
            <p>You have not downloaded your recording. Are you sure you want to close without downloading?</p>
        </Dialog>
    )
}

ConfirmCloseDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onGoBack: PropTypes.func.isRequired,
    onConfirmClose: PropTypes.func.isRequired,
}