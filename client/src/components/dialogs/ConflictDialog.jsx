import { Dialog } from './Dialog';
import PropTypes from 'prop-types';

/** @param {{isOpen: boolean, onClose: () => void, onChooseLocal: () => void, onChooseServer: () => void}} props */
export function ConflictDialog({ isOpen, onClose, onChooseLocal, onChooseServer }) {
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Conflict Detected"
        >
            <p>Would you like to keep your local settings or apply your saved settings?</p>
            <div className="conflict-buttons">
                <button className="btn" onClick={onChooseLocal}>
                    Keep Local Settings
                </button>
                <button className="btn" onClick={onChooseServer}>
                    Apply Saved Settings
                </button>
            </div>
        </Dialog>

    );
}

ConflictDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onChooseLocal: PropTypes.func.isRequired,
    onChooseServer: PropTypes.func.isRequired
};