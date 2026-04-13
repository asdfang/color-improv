import { Dialog } from './Dialog';
import PropTypes from 'prop-types';

/** @param {{isOpen: boolean, onGoBack: () => void, onConfirmClose: () => void}} props */
export function ConfirmCloseDialog({ isOpen, onGoBack, onConfirmClose }) {
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onGoBack}
            title="Unsaved Changes"
        >
            <p>You have not downloaded your recording. Are you sure you want to close without downloading?</p>
            <div className="confirm-close-buttons">
                <button className="btn-text back-btn" onClick={onGoBack}>
                    Go Back
                </button>
                <button className="btn-text close-btn" onClick={onConfirmClose}>
                    Close Anyway
                </button>
            </div>
        </Dialog>
    )
}

ConfirmCloseDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onGoBack: PropTypes.func.isRequired,
    onConfirmClose: PropTypes.func.isRequired,
}