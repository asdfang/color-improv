/**
 * This module defines the data structure for the visual grid used in the application.
 */

import { midiToColor } from "/src/visual/color-data.js";
import { KEY_MAPPINGS } from "/src/constants.js";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * @typedef {Object} NoteCellData
 * @property {'note'} type
 * @property {string} color - HSL color string
 * @property {string} keyCode - KeyboardEvent.code
 * @property {number} midiNumber
 * @property {string} noteName
 * @property {string} scaleRoot
 * @property {string} scaleMode
 * @property {string} scaleDegree
 */

/**
 * @typedef {Object} ScaleOrChordLabelCellData
 * @property {'scaleOrChordLabel'} type
 * @property {string} labelText - Text to display (may contain newlines)
 */

/**
 * @typedef {Object} ScaleDegreeLabelCellData
 * @property {'scaleDegreeLabel'} type
 * @property {string} scaleDegree - Scale degree notation (e.g., '1', '♭3', '♯4')
 */

/**
 * @typedef {Object} EmptyCellData
 * @property {'empty'} type
 */

/**
 * @typedef {NoteCellData | ScaleOrChordLabelCellData | ScaleDegreeLabelCellData | EmptyCellData} CellData
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Dimensions of the visual grid.
 */
export const GRID = {
    ROWS: 6, // 4 rows of scales, 2 rows of labels
    COLS: 9,
};

/**
 * Grid layout information, mapped from musical concepts to grid coordinates.
 * Rows 1 and 2 are reserved for labels, and not used for note cells.
 */
export const GRID_LAYOUT = {
    mixolydian: {
        rows: { // scaleRoot -> grid row
            // bottom three rows
            'G': 3, 'F': 4, 'C': 5,
        },
        columns: { // scaleDegree -> grid column
            '1': 1, '2': 2, '3': 3, '4': 4,
            '5': 5, '6': 6, '♭7': 7, '8': 8,
        },
    },
    // middle rows: labels
    blues: {
        rows: { // scaleRoot -> grid row
            // top row
            'C': 0,
        },
        columns: {
            '1': 1, '♭3': 2, '4': 3, '♯4': 4,
            '5': 5, '♭7': 6, '8': 7,
        }
    },
};

/**
 * Types of cells in the grid.
 */
export const CELL_TYPE = /** @type {const} */ ({
    NOTE: 'note',
    SCALE_OR_CHORD_LABEL: 'scaleOrChordLabel',
    SCALE_DEGREE_LABEL: 'scaleDegreeLabel',
    EMPTY: 'empty',
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Returns the grid coordinates from the KeyboardEvent.code.
 * Top three rows are mixolydian scales, bottom row is blues scale, middle rows are labels.
 * @param {string} key - The keyboard key as named in KEY_MAPPINGS in /src/constants.js
 * @returns {{row: number, col: number}} - The grid coordinates of the key, with (row: 0, col: 0) as top left.
 */
export function keyToGridCoordinates(key) {
    const { scaleMode, scaleRoot, scaleDegree } = KEY_MAPPINGS[key];
    if (scaleMode === 'Mixolydian') {
        const row = GRID_LAYOUT.mixolydian.rows[scaleRoot];
        const col = GRID_LAYOUT.mixolydian.columns[scaleDegree];
        
        if (row === undefined) {
            throw new Error(`Invalid mixolydian root '${scaleRoot}'.`);
        }
        if (col === undefined) {
            throw new Error(`Invalid mixolydian scale degree '${scaleDegree}'.`);
        }

        return { row, col };
    }

    if (scaleMode === 'Blues') {
        const row = GRID_LAYOUT.blues.rows[scaleRoot];
        const col = GRID_LAYOUT.blues.columns[scaleDegree];

        if (row === undefined) {
            throw new Error(`Invalid blues root '${scaleRoot}'.`);
        }
        if (col === undefined) {
            throw new Error(`Invalid blues scale degree '${scaleDegree}'.`);
        }

        return { row, col };
    }

    throw new Error(`Unknown mode '${scaleMode}'.`);
}

/**
 * Build the reverse mapping of constants.js's KEY_MAPPINGS for rendering of grid,
 * based off faster look-up of data based off of row/col.
 * Instead of hardcoding the reverse mapping, we build it dynamically to avoid duplication of data.
 * 
 * @return {CellData[][]} 2D array [row][col] of cell data objects.
 */
export function buildGridData() {
    /** @type {CellData[][]} */
    const grid = Array.from({ length: GRID.ROWS }, () =>
        Array.from({ length: GRID.COLS }, () => /** @type {EmptyCellData} */ ({ type: CELL_TYPE.EMPTY }))
    );

    // Build note cells from KEY_MAPPINGS
    for (const [keyCode, mapping] of Object.entries(KEY_MAPPINGS)) {
        const { row, col } = keyToGridCoordinates(keyCode);
        const { midiNumber, noteName, scaleRoot, scaleMode, scaleDegree } = mapping;

        // These cells should display note names
        grid[row][col] = {
            type: CELL_TYPE.NOTE,
            color: midiToColor(midiNumber),
            keyCode,
            midiNumber,
            noteName,
            scaleRoot,
            scaleMode,
            scaleDegree,
        };
    }

    // Chord labels (column 0). These cells display labelText with keyboard keys
    grid[3][0] = { type: CELL_TYPE.SCALE_OR_CHORD_LABEL, labelText: 'G⁷\n(qwertyui)' };
    grid[4][0] = { type: CELL_TYPE.SCALE_OR_CHORD_LABEL, labelText: 'F⁷\n(asdfghjk)' };
    grid[5][0] = { type: CELL_TYPE.SCALE_OR_CHORD_LABEL, labelText: 'C⁷\n(zxcvbnm,)' };
    grid[0][0] = { type: CELL_TYPE.SCALE_OR_CHORD_LABEL, labelText: 'Any!\n(1234567)' };

    // Mixolydian scale degree labels (row 2). This cell displays labelText
    grid[2][0] = {
        type: CELL_TYPE.SCALE_OR_CHORD_LABEL,
        labelText: 'Mixolydian\nScale Degrees',
    };
    // These cells display scale degrees
    for (const [scaleDegree, col] of Object.entries(GRID_LAYOUT.mixolydian.columns)) {
        grid[2][col] = {
            type: CELL_TYPE.SCALE_DEGREE_LABEL,
            scaleDegree,
        };
    }

    // Blues scale degree labels (row 1). This cell displays labelText
    grid[1][0] = {
        type: CELL_TYPE.SCALE_OR_CHORD_LABEL,
        labelText: 'Blues\nScale Degrees',
    };
    // These cells display scale degrees
    for (const [scaleDegree, col] of Object.entries(GRID_LAYOUT.blues.columns)) {
        grid[1][col] = {
            type: CELL_TYPE.SCALE_DEGREE_LABEL,
            scaleDegree,
        };
    }

    return grid;
}