import PropTypes from "prop-types"

/** @typedef {import('/src/visual/grid-data.js').KeyCode} KeyCode */

/**
 * @param {{color: string, keyCode: KeyCode, midiNumber: number, noteName: string, isActive: boolean}} props
 */
export function NoteCell({ color, keyCode, midiNumber, noteName, isActive }) {
    const style = /** @type {import('react').CSSProperties & {'--cell-color': string}} */ ({
        '--cell-color': color,
    });

    return (
        <div className={`note-cell ${isActive ? 'pressed' : ''}`} style={style}>
            {noteName}
        </div>
    );
}

NoteCell.propTypes = {
    color: PropTypes.string.isRequired,
    keyCode: PropTypes.string.isRequired,
    midiNumber: PropTypes.number.isRequired,
    noteName: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
};