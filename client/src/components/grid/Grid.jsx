import { useState, useEffect } from 'react';
import { useStudio } from '/src/contexts/StudioContext';
import { usePreferences } from '/src/contexts/PreferencesContext';
import { usePlayback } from '/src/contexts/PlaybackContext';
import { useActiveNotes } from '/src/hooks/useActiveNotes';
import { NoteCell } from './NoteCell';
import { ScaleDegreeLabelCell } from './ScaleDegreeLabelCell';
import { ScaleLabelCell } from './ScaleLabelCell';
import { ChordLabelCell } from './ChordLabelCell';
import { CELL_TYPE, buildGridData } from '/src/visual/grid-data.js';

/** @typedef {import('/src/visual/grid-data.js').CellData} CellData */
/** @typedef {import('/src/visual/grid-data.js').KeyCode} KeyCode */
/** @typedef {import('/src/contexts/PlaybackContext.jsx').PlaybackState} PlaybackState */

export function Grid() {
    const { timingEngine } = useStudio();
    const { preferences } = usePreferences();
    const { playbackState } = usePlayback();
    const activeNotes = useActiveNotes();
    const [gridData] = useState(() => buildGridData());
    const [currentChord, setCurrentChord] = useState(/** @type {string | null} */ (null));
    const [nextChord, setNextChord] = useState(/** @type {string | null} */ (null));
    const [beatsUntilNextChord, setBeatsUntilNextChord] = useState(/** @type {number | null} */ (null));

    useEffect(() => {
        /**
         * @param {{ currentChord: string | null, nextChord: string, beatsUntilNextChord: number | null }} data
         */
        const handleBeatChange = ({ currentChord, nextChord, beatsUntilNextChord }) => {
            const showCurrentChord = preferences.difficulty !== 'hard';
            const showCountdown = preferences.difficulty === 'easy';
            
            setCurrentChord(showCurrentChord ? currentChord : null);
            setNextChord(showCountdown ? nextChord : null);
            setBeatsUntilNextChord(
                showCountdown && (beatsUntilNextChord !== null && beatsUntilNextChord <= 4)
                    ? beatsUntilNextChord
                    : null
            );
        };

        timingEngine.setOnBeatChange(handleBeatChange);

        return () => {
            timingEngine.setOnBeatChange(null);
        };
    });

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
                        isActive={activeNotes.has(keyCode)}
                    />
                );
            }
            case CELL_TYPE.SCALE_LABEL: {
                const { scaleName, label } = cell;
                return (
                    <ScaleLabelCell
                        key={key}
                        scaleName={scaleName}
                        label={label}
                    />
                );
            }
            case CELL_TYPE.CHORD_LABEL: {
                const { chordName, label, keyboardHint } = cell;
                return (
                    <ChordLabelCell
                        key={key}
                        chordName={chordName}
                        label={label}
                        keyboardHint={keyboardHint}
                        isHighlighted={chordName !== null && chordName === currentChord}
                        countdown={
                            (chordName != null
                            && chordName === nextChord)
                            ? beatsUntilNextChord
                            : null
                        }
                    />
                );
            }
            case CELL_TYPE.SCALE_DEGREE_LABEL: {
                const { scaleDegree, scaleName } = cell;
                return (
                    <ScaleDegreeLabelCell
                        key={key}
                        scaleDegree={scaleDegree}
                        scaleName={scaleName}
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

    return (
        <div id="music-grid" className={`playback-${playbackState}`}>
            {gridData.map((row, rowIdx) => 
                row.map((cell, colIdx) => 
                    renderCell(cell, rowIdx, colIdx))
        )}
        </div>
    );
}