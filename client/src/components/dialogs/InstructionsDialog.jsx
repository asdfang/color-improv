import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic } from '@fortawesome/free-solid-svg-icons';
import { Dialog } from './Dialog';
import PropTypes from 'prop-types';

/**
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
export function InstructionsDialog({ isOpen, onClose }) {
    const id = 'instructions-dialog';
    const musicIcon = <FontAwesomeIcon icon={faMusic} aria-hidden="true" />;
    const footer = (
        <button className="btn-text" onClick={onClose} aria-label="Close instructions">
            Let&apos;s Jam! {musicIcon}
        </button>
    );

    return (
        <Dialog
            id={id}
            className={id}
            isOpen={isOpen}
            onClose={onClose}
            title="Instructions"
            closeOnBackdrop={true}
            footer={footer}
        >
            <p>Welcome to Color Improv! Let&apos;s get to improvising on the 12-bar blues. Here&apos;s how to get started:</p>
            <ul>
                <li><h3>Start Playing:</h3> Press keys on your keyboard or touch the pads directly to play notes!</li>
                <li><h3>Match the Chord:</h3> Play notes from the row that matches the chord for the best harmonic fit. (Bottom row matches with the C7 chord, middle row matches F7, and the top row matches with G7. The number row works over all these!)</li>
                <li><h3>Get the Timing Down:</h3> Switch rows when it&apos;s time! See the hints on the left: we&apos;ll highlight the current chord, then count down to the next chord.</li>
                <li><h3>Challenge Yourself:</h3> Try to improv without the helpers by increasing the difficulty.</li>
                <li><h3>Tune Your Settings:</h3> Use the volume controls to adjust the balance between backing track and note samples. Log in to save these settings!</li>
                <li><h3>Record a Session:</h3> Perform an improv, then download it!</li>
            </ul>
        </Dialog>
    )
}

InstructionsDialog.propTypes = {
    isOpen: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
};