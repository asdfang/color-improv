import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faExclamationTriangle, faClose } from '@fortawesome/free-solid-svg-icons';
import { Dialog } from './Dialog';
import PropTypes from 'prop-types';

/** @param {{isOpen: boolean, onClose: () => void, errorMessage: string}} props */
export function ErrorDialog({ isOpen, onClose, errorMessage }) {
    const errorIcon = <FontAwesomeIcon icon={faExclamationTriangle} aria-hidden="true" />;
    const closeIcon = <FontAwesomeIcon icon={faClose} aria-hidden="true" />;

    const footer = (
        <button onClick={onClose} className="btn-text close-btn">
            Close {closeIcon}
        </button>
    );
    return (
        <Dialog
            id="error-dialog"
            isOpen={isOpen}
            onClose={onClose}
            title="Error"
            closeOnBackdrop={true}
            footer={footer}
        >
            <p className="error-message">{errorIcon}: {errorMessage}</p>
            <p>Try playing again in a few moments, or refresh the page if the problem persists.</p>
        </Dialog>
    );
}

ErrorDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    errorMessage: PropTypes.string.isRequired
};