import PropTypes from "prop-types";

/**
 * @param {{chordName: string | null, label: string, keyboardHint: string, isHighlighted: boolean, countdown: number | null}} props
 */
export function ChordLabelCell({ label, keyboardHint, isHighlighted, countdown }) {
    return (
        <div className={`chord-label-cell ${isHighlighted ? 'highlighted' : ''}`}>
            <p>{label}</p>
            <p>{keyboardHint}</p>
            {countdown !== null && <span className="countdown">{countdown}</span>}
        </div>
    );
}

ChordLabelCell.propTypes = {
    label: PropTypes.string.isRequired,
    keyboardHint: PropTypes.string.isRequired,
    isHighlighted: PropTypes.bool.isRequired,
    countdown: PropTypes.number,
};