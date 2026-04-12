import { Dialog } from './Dialog';
import PropTypes from 'prop-types';

/**
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
export function InstructionsDialog({ isOpen, onClose }) {
    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            title="Instructions"
            closeOnBackdrop={true}
        >
            <p>Welcome to Color Improv! Let&apos;s get to improvising on the 12-bar blues. Here&apos;s how to get started:</p>
            <ol>
                <li><strong>Start Playing:</strong> Press keys on your keyboard or touch the pads directly to play notes!</li>
                <li><strong>Match the Chord:</strong> Play notes from the row that matches the chord for the best harmonic fit.</li>
                <li><strong>Get the Timing Down:</strong> Switch rows when it&apos;s time! See the hints on the left: we&apos;ll highlight the current chord, then count down to the next chord.</li>
                <li><strong>Challenge Yourself: </strong> Try to improv without the visual helpers by changing the difficulty level.</li>
                <li><strong>Tune Your Settings:</strong> Use the volume controls to adjust the balance between backing track and note samples. Log in to save these settings!</li>
                <li><strong>Record a Session:</strong> Perform an improv, then download it!</li>
            </ol>
        </Dialog>
    )
}

InstructionsDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};