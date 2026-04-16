import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleInfo } from '@fortawesome/free-solid-svg-icons';
import { useState } from 'react';
import { InstructionsDialog } from '../dialogs/InstructionsDialog';

export function InstructionsButton() {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const handleClick = () => {
        setIsDialogOpen(true);
    }

    return (
        <div id="instructions-wrapper">
            <button id="instructions-button" onClick={handleClick}>
                <FontAwesomeIcon icon={faCircleInfo} />
                <span>Instructions!</span>
            </button>
            <InstructionsDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </div>
    );
}