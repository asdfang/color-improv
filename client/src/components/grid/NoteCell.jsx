import PropTypes from "prop-types";
import { usePlayback } from "../../contexts/PlaybackContext";

/** @typedef {import('/src/visual/grid-data.js').KeyCode} KeyCode */

/**
 * @param {{
 *      color: string,
 *      keyCode: KeyCode,
 *      midiNumber: number,
 *      noteName: string,
 *      isActive: boolean,
 *      handlePointerDown: Function | null,
 *      handlePointerEnter: Function | null,
 *      handlePointerLeave: Function | null,
 *      handlePointerUpOrCancel: Function | null
 * }} props
 */
export function NoteCell({ color, keyCode, midiNumber, noteName, isActive, handlePointerDown, handlePointerEnter, handlePointerLeave, handlePointerUpOrCancel }) {
    const { playbackState } = usePlayback();
    const style = /** @type {import('react').CSSProperties & {'--cell-color': string}} */ ({
        '--cell-color': playbackState === 'stopped' ? '#999' : color,
    });

    return (
        <div
            className={`note-cell ${isActive ? 'pressed' : ''}`}
            style={style}
            onPointerDown={(e) => {
                e.currentTarget.releasePointerCapture(e.pointerId);
                handlePointerDown?.(e.pointerId, keyCode, midiNumber);
            }}
            onPointerEnter={(e) => handlePointerEnter?.(e.pointerId, keyCode, midiNumber)}
            onPointerLeave={(e) => handlePointerLeave?.(e.pointerId, keyCode, midiNumber)}
            onPointerUp={(e) => {
                e.stopPropagation();
                handlePointerUpOrCancel?.(e.pointerId, keyCode, midiNumber);
            }}
            onPointerCancel={(e) => {
                e.stopPropagation();
                handlePointerUpOrCancel?.(e.pointerId, keyCode, midiNumber);
            }}
        >
            <p className="note-name">{noteName}</p>
        </div>
    );
}

NoteCell.propTypes = {
    color: PropTypes.string.isRequired,
    keyCode: PropTypes.string.isRequired,
    midiNumber: PropTypes.number.isRequired,
    noteName: PropTypes.string.isRequired,
    isActive: PropTypes.bool.isRequired,
    handlePointerDown: PropTypes.func.isRequired,
    handlePointerEnter: PropTypes.func.isRequired,
    handlePointerLeave: PropTypes.func.isRequired,
    handlePointerUpOrCancel: PropTypes.func.isRequired,
};