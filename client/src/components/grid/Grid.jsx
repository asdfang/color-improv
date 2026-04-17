import { useState, useEffect } from 'react';
import { useStudio } from '../../contexts/StudioContext';
import { usePreferences } from '../../contexts/PreferencesContext';
import { usePlayback } from '../../contexts/PlaybackContext';
import { useActiveNotes } from '../../hooks/useActiveNotes';
import { usePointerPlay } from '../../hooks/usePointerPlay';
import { NoteCell } from './NoteCell';
import { ScaleDegreeLabelCell } from './ScaleDegreeLabelCell';
import { ScaleLabelCell } from './ScaleLabelCell';
import { ChordLabelCell } from './ChordLabelCell';
import { CELL_TYPE, buildGridData } from '../../visual/grid-data';

/** @typedef {import('../../visual/grid-data').CellData} CellData */
/** @typedef {import('../../visual/grid-data').KeyCode} KeyCode */
/** @typedef {import('../../contexts/PlaybackContext').PlaybackState} PlaybackState */

export function Grid() {
    const { timingEngine } = useStudio();
    const { preferences } = usePreferences();
    const { playbackState } = usePlayback();
    const activeNotes = useActiveNotes();
    const { handlePointerDown, handlePointerEnter, handlePointerLeave, handlePointerUpOrCancel } = usePointerPlay();
    const [gridData] = useState(() => buildGridData());
    const [currentChord, setCurrentChord] = useState(/** @type {string | null} */ (null));
    const [nextChord, setNextChord] = useState(/** @type {string | null} */ (null));
    const [beatsUntilNextChord, setBeatsUntilNextChord] = useState(/** @type {number | null} */ (null));
    const isStopped = playbackState === 'stopped';
    const isPlaying = playbackState === 'playing';
    const currentChordHelperEnabled = preferences.difficulty !== 'hard';
    const countdownHelperEnabled = preferences.difficulty === 'easy';

    /**
     * Set up beat change listener in TimingEngine to update current/next chord and countdown.
     * Note: we filter updates to React state based on difficulty, so using state already reflects whether to show helpers.
     */
    useEffect(() => {
        /**
         * @param {{ currentChord: string | null, nextChord: string, beatsUntilNextChord: number | null }} data
         */
        const handleBeatChange = ({ currentChord, nextChord, beatsUntilNextChord }) => {
            setCurrentChord(currentChordHelperEnabled ? currentChord : null);
            setNextChord(currentChordHelperEnabled ? nextChord : null);
            setBeatsUntilNextChord(
                countdownHelperEnabled && (beatsUntilNextChord !== null && beatsUntilNextChord <= 4)
                    ? beatsUntilNextChord
                    : null
            );
        };
        timingEngine.setOnBeatChange(handleBeatChange);
        return () => timingEngine.setOnBeatChange(null);
    }, [currentChordHelperEnabled, countdownHelperEnabled, timingEngine]);

    /**
     * Renders a cell based on its type (note, scale label, chord label, scale degree label, empty).
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
                        handlePointerDown={isPlaying ? handlePointerDown : null}
                        handlePointerEnter={isPlaying ? handlePointerEnter : null}
                        handlePointerLeave={isPlaying ? handlePointerLeave : null}
                        handlePointerUpOrCancel={isPlaying ? handlePointerUpOrCancel : null}
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
                        label={label}
                        keyboardHint={keyboardHint}
                        isHighlighted={!isStopped && chordName !== null && chordName === currentChord}
                        countdown={
                            !isStopped
                            && chordName !== null
                            && chordName === nextChord
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
                return <div key={key} className={rowIdx === 0 ? '' : 'scale-label-row'} />; //ugly fix
            }
            default: {
                const _exhaustiveCheck = /** @type {never} */ (cell);
                throw new Error(`Unhandled cell type: ${JSON.stringify(_exhaustiveCheck)}`);
            }
        }
    }

    return (
        <div className={`music-grid playback-${playbackState}`}>
            {gridData.map((row, rowIdx) => 
                row.map((cell, colIdx) => 
                    renderCell(cell, rowIdx, colIdx))
            )}
            <span className="sr-only" role="status">
                { currentChord ? `${currentChord}.` : ''}
            </span>
            <span className="sr-only" role="status">
                { beatsUntilNextChord !== null ? `${nextChord} next.` : ''}
            </span>
        </div>
    );
}