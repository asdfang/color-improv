import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMusic } from '@fortawesome/free-solid-svg-icons';
import { Dialog } from './Dialog';
import PropTypes from 'prop-types';

/**
 * @param {{ isOpen: boolean, onClose: () => void }} props
 */
export function InstructionsDialog({ isOpen, onClose }) {
    const musicIcon = <FontAwesomeIcon icon={faMusic} />;
    const footer = (
        <button className="btn-text" onClick={onClose}>
            Let&apos;s Jam! {musicIcon}
        </button>
    );
    return (
        <Dialog
            id="instructions-dialog"
            isOpen={isOpen}
            onClose={onClose}
            title="Instructions"
            closeOnBackdrop={true}
            footer={footer}
        >
            <p>Welcome to Color Improv! Let&apos;s get to improvising on the 12-bar blues. Here&apos;s how to get started:</p>
            <ul>
                <li><h3>Start Playing:</h3> Press keys on your keyboard or touch the pads directly to play notes!</li>
                <li><h3>Match the Chord:</h3> Play notes from the row that matches the chord for the best harmonic fit.</li>
                <li><h3>Get the Timing Down:</h3> Switch rows when it&apos;s time! See the hints on the left: we&apos;ll highlight the current chord, then count down to the next chord.</li>
                <li><h3>Challenge Yourself:</h3> Try to improv without the visual helpers by changing the difficulty level.</li>
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