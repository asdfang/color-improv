import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faHardDrive, faCloudArrowDown } from '@fortawesome/free-solid-svg-icons';
import { Dialog } from './Dialog';
import PropTypes from 'prop-types';

/** @param {{isOpen: boolean, onClose: () => void, onChooseLocal: () => void, onChooseServer: () => void}} props */
export function ConflictDialog({ isOpen, onClose, onChooseLocal, onChooseServer }) {
    const localIcon = <FontAwesomeIcon icon={faHardDrive} />;
    const serverIcon = <FontAwesomeIcon icon={faCloudArrowDown} />;

    const footer = (
        <>
            <button className="btn-text" onClick={onChooseLocal}>
                Keep Local Settings {localIcon}
            </button>
            <button className="btn-text" onClick={onChooseServer}>
                Apply Saved Settings {serverIcon}
            </button>
        </>
    );
    return (
        <Dialog
            id="conflict-dialog"
            isOpen={isOpen}
            onClose={onClose}
            title="Conflict Detected"
            closeOnBackdrop={false}
            footer={footer}
        >
            <p>Would you like to keep your local settings or apply your saved settings?</p>
        </Dialog>

    );
}

ConflictDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onChooseLocal: PropTypes.func.isRequired,
    onChooseServer: PropTypes.func.isRequired
};