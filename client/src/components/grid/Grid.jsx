import { useState, useEffect, useRef } from 'react';
import { useStudio } from '/src/contexts/StudioContext';
import { usePreferences } from '/src/contexts/PreferencesContext';
import { usePlayback } from '/src/contexts/PlaybackContext';
import { useActiveNotes } from '/src/hooks/useActiveNotes';
import { NoteCell } from './NoteCell';
import { ScaleDegreeLabelCell } from './ScaleDegreeLabelCell';
import { ScaleLabelCell } from './ScaleLabelCell';
import { ChordLabelCell } from './ChordLabelCell';
import { CELL_TYPE, buildGridData } from '/src/visual/grid-data.js';
import { dispatchNoteEvent } from '/src/utils.js';

/** @typedef {import('/src/visual/grid-data.js').CellData} CellData */
/** @typedef {import('/src/visual/grid-data.js').KeyCode} KeyCode */
/** @typedef {import('/src/contexts/PlaybackContext.jsx').PlaybackState} PlaybackState */
/** @typedef {{ keyCode: KeyCode, midiNumber: number }} PointerData */

export function Grid() {
    const { audioEngine, timingEngine } = useStudio();
    const { preferences } = usePreferences();
    const { playbackState } = usePlayback();
    const activeNotes = useActiveNotes();
    const [gridData] = useState(() => buildGridData());
    const [currentChord, setCurrentChord] = useState(/** @type {string | null} */ (null));
    const [nextChord, setNextChord] = useState(/** @type {string | null} */ (null));
    const [beatsUntilNextChord, setBeatsUntilNextChord] = useState(/** @type {number | null} */ (null));
    const isStopped = playbackState === 'stopped';
    
    const activePointers = useRef(/** @type {Map<number, PointerData>} */ (new Map()));

    /**
     * Triggers note when pointer enters a cell if pointer slides from another.
     * Note: its first touch must have been a NoteCell.
     * Note: for convenience, pointer events still use keyCode as the unqiueID.
     * @param {number} pointerId 
     * @param {KeyCode} keyCode 
     * @param {number} midiNumber 
     */
    const handlePointerEnter = (pointerId, keyCode, midiNumber) => {
        const isActive = activePointers.current.get(pointerId)?.keyCode === keyCode;
        if (activePointers.current.has(pointerId) && !isActive) {
            audioEngine.playNote(keyCode, midiNumber);
            activePointers.current.set(pointerId, { keyCode, midiNumber });
            dispatchNoteEvent('notestart', keyCode, midiNumber);
        }
    };

    /**
     * Triggers note if the cell was not already playing a note.
     * Note: for convenience, pointer events still use keyCode as the unqiueID.
     * @param {number} pointerId 
     * @param {KeyCode} keyCode 
     * @param {number} midiNumber 
     */
    const handlePointerDown = (pointerId, keyCode, midiNumber) => {
        const isActive = activePointers.current.get(pointerId)?.keyCode === keyCode;
        activePointers.current.set(pointerId, { keyCode, midiNumber });
        if (!isActive) {
            audioEngine.playNote(keyCode, midiNumber);
            dispatchNoteEvent('notestart', keyCode, midiNumber);
        }
    };

    /**
     * Stops note if cell is active when pointer released or cancelled.
     * @param {number} pointerId 
     * @param {KeyCode} keyCode 
     * @param {number} midiNumber 
     */
    const handlePointerUpOrCancel = (pointerId, keyCode, midiNumber) => {
        const isActive = activePointers.current.get(pointerId)?.keyCode === keyCode;
        activePointers.current.delete(pointerId);
        if (isActive) {
            audioEngine.stopNote(keyCode, midiNumber);
            dispatchNoteEvent('noteend', keyCode, midiNumber);
        }
    }

    /**
     * Stops note if cell is active when pointer leaves the cell.
     * @param {number} pointerId 
     * @param {KeyCode} keyCode 
     * @param {number} midiNumber 
     */
    const handlePointerLeave = (pointerId, keyCode, midiNumber) => {
        const wasActive = activePointers.current.get(pointerId)?.keyCode === keyCode;
        if (activePointers.current.has(pointerId) && wasActive) {
            audioEngine.stopNote(keyCode, midiNumber);
            dispatchNoteEvent('noteend', keyCode, midiNumber);
        }
    };

    useEffect(() => {
        /**
         * Cleans up active pointer data if released off the grid.
         * Note: does not need to stop a note - would have been stopped on pointerleave.
         * @param {PointerEvent} e
         */
        const handleDocumentPointerUpOrCancel = (e) => {
            activePointers.current.delete(e.pointerId);
        }
        document.addEventListener('pointerup', handleDocumentPointerUpOrCancel);
        document.addEventListener('pointercancel', handleDocumentPointerUpOrCancel);

        return () => {
            document.removeEventListener('pointerup', handleDocumentPointerUpOrCancel);
            document.removeEventListener('pointercancel', handleDocumentPointerUpOrCancel);
        };
    }, [audioEngine]);

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
    }, [timingEngine, preferences.difficulty]);

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
                        handlePointerDown={handlePointerDown}
                        handlePointerEnter={handlePointerEnter}
                        handlePointerLeave={handlePointerLeave}
                        handlePointerUpOrCancel={handlePointerUpOrCancel}
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
                        isHighlighted={!isStopped && chordName !== null && chordName === currentChord}
                        countdown={
                            !isStopped
                            && chordName != null
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