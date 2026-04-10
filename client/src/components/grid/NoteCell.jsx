import PropTypes from "prop-types"

/** @typedef {import('/src/visual/grid-data.js').KeyCode} KeyCode */

/**
 * @param {{color: string, keyCode: KeyCode, midiNumber: number, noteName: string}} props
 */
export function NoteCell({ color, keyCode, midiNumber, noteName }) {
    const style = /** @type {import('react').CSSProperties & {'--cell-color': string}} */ ({
        '--cell-color': color,
    });

    return (
        <div className="note-cell" style={style}>
            keyCode: {keyCode}, midiNumber: {midiNumber}, noteName: {noteName}
        </div>
    );
}

NoteCell.propTypes = {
    color: PropTypes.string.isRequired,
    keyCode: PropTypes.string.isRequired,
    midiNumber: PropTypes.number.isRequired,
    noteName: PropTypes.string.isRequired,
};