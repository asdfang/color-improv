import { Dialog } from './Dialog';

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