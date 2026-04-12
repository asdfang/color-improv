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
                <span>Click for instructions and help.</span>
            </button>
            <InstructionsDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
            />
        </div>
    );
}