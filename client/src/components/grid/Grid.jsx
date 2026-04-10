import { useState } from 'react';
import { usePlayback } from '/src/contexts/PlaybackContext';
import { NoteCell } from './NoteCell';
import { ScaleDegreeLabelCell } from './ScaleDegreeLabelCell';
import { ScaleLabelCell } from './ScaleLabelCell';
import { ChordLabelCell } from './ChordLabelCell';
import { CELL_TYPE, buildGridData } from '/src/visual/grid-data.js';

/** @typedef {import('/src/visual/grid-data.js').CellData} CellData */
/** @typedef {import('/src/visual/grid-data.js').KeyCode} KeyCode */
/** @typedef {import('/src/contexts/PlaybackContext.jsx').PlaybackState} PlaybackState */

export function Grid() {
    const { playbackState } = usePlayback();
    const [gridData] = useState(() => buildGridData());
    
    return (
        <div id="music-grid" className={`playback-${playbackState}`}>
            {gridData.map((row, rowIdx) => 
                row.map((cell, colIdx) => 
                    renderCell(cell, rowIdx, colIdx))
        )}
        </div>
    );
}

/**
 * @param {CellData} cell 
 * @param {number} rowIdx 
 * @param {number} colIdx 
 * @returns 
 */
function renderCell(cell, rowIdx, colIdx) {
    const key = `${rowIdx},${colIdx}`;
    switch (cell.type) {
        case CELL_TYPE.NOTE: {
            const { color, keyCode, midiNumber, noteName } = cell;
            return (
                <NoteCell
                    key={key}
                    color={color}
                    keyCode={keyCode}
                    midiNumber={midiNumber}
                    noteName={noteName}
                />
            );
        }
        case CELL_TYPE.SCALE_LABEL: {
            const { labelText } = cell;
            return (
                <ScaleLabelCell
                    key={key}
                    labelText={labelText}
                />
            );
        }
        case CELL_TYPE.CHORD_LABEL: {
            const { labelText } = cell;
            return (
                <ChordLabelCell
                    key={key}
                    labelText={labelText}
                />
            );
        }
        case CELL_TYPE.SCALE_DEGREE_LABEL: {
            const { scaleDegree } = cell;
            return (
                <ScaleDegreeLabelCell
                    key={key}
                    scaleDegree={scaleDegree}
                />
            );
        }
        case CELL_TYPE.EMPTY: {
            return <div key={key} />;
        }
        default: {
            const _exhaustiveCheck = /** @type {never} */ (cell);
            throw new Error(`Unhandled cell type: ${JSON.stringify(_exhaustiveCheck)}`);
        }
    }
}