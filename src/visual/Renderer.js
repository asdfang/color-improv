import { GRID, GRID_LAYOUT, CELL_TYPE, buildGridData } from "/src/visual/grid-data.js";
import { COLOR_ALPHA, PLAYBACK_VISUALS } from "/src/visual/color-data.js";

// ============================================================================
// RENDERING CONSTANTS
// ============================================================================

/**
 * Visual styling constants for the grid renderer.
 * These values control the appearance and layout of grid elements.
 */
const VISUAL_CONFIG = {
    /** Font family with fallbacks for musical symbols */
    FONT_FAMILY: "'Segoe UI Symbol', 'Apple Symbols', 'Noto Music', Arial, sans-serif",
    
    /** Note cell styling */
    NOTE: {
        PADDING: 4,              // Pixels of padding around note cells
        RADIUS: 8,               // Border radius for rounded corners
        PRESSED_OFFSET_Y: 2,     // Vertical offset when note is pressed (pixels)
        BORDER_WIDTH: 1.5,       // Border thickness (pixels)
        BORDER_OPACITY: 0.25,    // Border opacity for unpressed state
        BORDER_OPACITY_PRESSED: 0.4, // Border opacity for pressed state
        PRESSED_BRIGHTNESS_ADJUST: -0.2, // Brightness adjustment for pressed state (-1 to 1)
        MAX_FONT_HEIGHT: 0.3,    // Maximum font size as fraction of cell height
        MAX_FONT_WIDTH: 0.6,     // Maximum font size as fraction of cell width
    },
    
    /** Label cell styling */
    LABEL: {
        ROW1_Y: 0.16,            // Vertical position for first row labels (fraction of cell height)
        MAX_FONT_HEIGHT: 0.22,   // Maximum font size as fraction of cell height
        MAX_FONT_WIDTH: 0.16,    // Maximum font size as fraction of cell width
        SECONDARY_FONT_SCALE: 0.75, // Scale factor for secondary text
        SECONDARY_OPACITY: 0.5,  // Opacity for secondary label text
        LINE_SPACING: 1.2,       // Line height multiplier for multi-line labels
    },
    
    /** Scale degree label styling */
    SCALE_DEGREE: {
        ROW1_OFFSET: -0.15,      // Vertical offset for row 1 (fraction of cell height)
        OTHER_OFFSET: 0.20,      // Vertical offset for other rows (fraction of cell height)
        TEXT_OFFSET: 0.2,        // Text baseline adjustment (fraction of font size)
        ACCENT_OFFSET: 0.45,     // Accent mark vertical position (fraction of font size)
        ACCENT_SCALE_X: 1.3,     // Horizontal stretch for accent mark
        ACCENT_SCALE_Y: 0.8,     // Vertical stretch for accent mark
        ACCENT_FONT_SCALE: 0.7,  // Font size for accent mark (fraction of main font size)
        FONT_HEIGHT: 0.30,       // Font size as fraction of cell height
    },
    
    /** Chord highlight styling */
    CHORD_HIGHLIGHT: {
        BORDER_WIDTH: 4,         // Border thickness for highlighted chord (pixels)
        FILL_OPACITY: 0.2,       // Fill opacity for highlighted chord background
    },

    /** Countdown badge styling */
    COUNTDOWN_BADGE: {
        SIZE: 22,                // Diameter of badge (pixels)
        PADDING: 8,              // Padding from cell edges (pixels)
        BORDER_WIDTH: 1.5,       // Border thickness (pixels)
        BG_OPACITY: 0.9,         // Badge background opacity
        BORDER_OPACITY: 0.9,     // Badge border opacity
        TEXT_OPACITY: 1,         // Badge text opacity
        FONT_SCALE: 0.65,        // Font size relative to badge size
    },
    
    /** Grid column sizing */
    LAYOUT: {
        PREFERRED_LABEL_WIDTH: 180, // Preferred width for label column (pixels)
        MIN_NOTE_COL_WIDTH: 26,     // Minimum width for note columns (pixels)
        MIN_LABEL_WIDTH: 80,        // Minimum width for label column (pixels)
    },
};

/**
 * Renders the visual grid for the ColorImprov application.
 * Manages canvas rendering, including note cells, chord/scale labels,
 * highlighting of current chord and active notes.
 * Handles responsive canvas sizing with device pixel ratio support.
 */
export class Renderer {
    /**
     * Creates a new Renderer instance.
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.gridData = buildGridData();

        this.activeCells = new Set(); // number calculated as row * GRID.COLS + col
        this.currentChord = null;
        this.playbackState = 'stopped'; // 'playing', 'paused', 'stopped'

        this.cellWidth = null;
        this.cellHeight = null;
        this.gridWidth = null;
        this.gridHeight = null;
        this.labelColWidth = null;
        this.noteColWidth = null;
        this.columnX = [];
        this.columnWidth = [];

        // Initial resize
        this.resize();
    }

    /**
     * Adjusts the canvas size and resolution to match its current CSS dimensions.
     * Should be called when the window or canvas container is resized.
     * Handles device pixel ratio for crisp rendering on high-DPI displays.
     */
    resize() {
        const dpr = window.devicePixelRatio || 1;
        
        // Use clientWidth/clientHeight to get CSS pixel dimensions
        const cssWidth = this.canvas.clientWidth;
        const cssHeight = this.canvas.clientHeight;

        // Set canvas internal resolution based on display size
        // Setting width/height automatically resets the canvas context
        this.canvas.width = cssWidth * dpr;
        this.canvas.height = cssHeight * dpr;
        
        // Scale context to account for device pixel ratio
        // Now when we draw at 100 CSS pixels, it becomes 100*dpr device pixels
        this.ctx.scale(dpr, dpr);

        // Update grid size and cell sizes based on display size (in CSS pixels)
        this.gridWidth = cssWidth;
        this.gridHeight = cssHeight;
        this.cellHeight = cssHeight / GRID.ROWS;

        // Fixed label column width, note columns flex
        const preferredLabelWidth = VISUAL_CONFIG.LAYOUT.PREFERRED_LABEL_WIDTH;
        const minNoteColWidth = VISUAL_CONFIG.LAYOUT.MIN_NOTE_COL_WIDTH;
        const maxLabelWidth = cssWidth - minNoteColWidth * (GRID.COLS - 1);
        const safeLabelWidth = Math.min(preferredLabelWidth, Math.max(VISUAL_CONFIG.LAYOUT.MIN_LABEL_WIDTH, maxLabelWidth));
        this.labelColWidth = Math.min(cssWidth, safeLabelWidth);
        this.noteColWidth = (cssWidth - this.labelColWidth) / (GRID.COLS - 1);

        this.columnX = new Array(GRID.COLS);
        this.columnWidth = new Array(GRID.COLS);
        for (let col = 0; col < GRID.COLS; col++) {
            this.columnX[col] = col === 0 ? 0 : this.labelColWidth + (col - 1) * this.noteColWidth;
            this.columnWidth[col] = col === 0 ? this.labelColWidth : this.noteColWidth;
        }
    }

    /**
     * Returns the x position for a column.
     * @private
     */
    getColumnX(col) {
        return this.columnX[col] ?? 0;
    }

    /**
     * Returns the width for a column.
     * @private
     */
    getColumnWidth(col) {
        return this.columnWidth[col] ?? this.noteColWidth;
    }

    /**
     * Renders the complete visual grid to the canvas.
     * Clears the canvas and draws all grid elements including notes, labels,
     * chord highlights, and active cell overlays.
     */
    render() {
        // Clear using CSS pixel coordinates (context is scaled by dpr)
        this.ctx.clearRect(0, 0, this.gridWidth, this.gridHeight);

        this.drawGrid();
        this.drawChordHighlight();
        this.drawNextChordCountdown();
        this.drawActiveCells();
    }

    /**
     * Sets the playback state to control visual feedback.
     * @param {string} state - 'playing', 'paused', or 'stopped'
     */
    setPlaybackState(state) {
        this.playbackState = state;
    }


    /**
     * Returns opacity/desaturation settings based on playback state.
     * @private
     */
    getPlaybackVisuals() {
        return PLAYBACK_VISUALS[this.playbackState] || PLAYBACK_VISUALS.playing;
    }

    /**
     * Draws a note cell.
     * @private
     */
    drawNoteCell({ cell, x, y, cellWidth, opacity, desaturate }) {
        const btnX = x + VISUAL_CONFIG.NOTE.PADDING;
        const btnY = y + VISUAL_CONFIG.NOTE.PADDING;
        const btnW = cellWidth - VISUAL_CONFIG.NOTE.PADDING * 2;
        const btnH = this.cellHeight - VISUAL_CONFIG.NOTE.PADDING * 2;

        const cellColor = this.applyDesaturateAndOpacity(cell.color, desaturate, opacity);
        this.ctx.fillStyle = cellColor;
        this.ctx.beginPath();
        this.ctx.roundRect(btnX, btnY, btnW, btnH, VISUAL_CONFIG.NOTE.RADIUS);
        this.ctx.fill();

        this.ctx.strokeStyle = COLOR_ALPHA.BLACK(VISUAL_CONFIG.NOTE.BORDER_OPACITY * opacity);
        this.ctx.lineWidth = VISUAL_CONFIG.NOTE.BORDER_WIDTH;
        this.ctx.beginPath();
        this.ctx.roundRect(btnX, btnY, btnW, btnH, VISUAL_CONFIG.NOTE.RADIUS);
        this.ctx.stroke();

        this.ctx.fillStyle = COLOR_ALPHA.BLACK(1);
        const noteFontSize = Math.min(this.cellHeight * VISUAL_CONFIG.NOTE.MAX_FONT_HEIGHT, cellWidth * VISUAL_CONFIG.NOTE.MAX_FONT_WIDTH);
        this.ctx.font = `${noteFontSize}px ${VISUAL_CONFIG.FONT_FAMILY}`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(cell.noteName, x + cellWidth / 2, y + this.cellHeight / 2);
    }

    /**
     * Draws scale/chord label cells.
     * @private
     */
    drawScaleOrChordLabelCell({ cell, x, y, cellWidth, row, opacity, labelFontSize }) {
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';

        const lines = cell.labelText.split('\n');
        const firstLineY = row === 1 ? y + this.cellHeight * VISUAL_CONFIG.LABEL.ROW1_Y : y + this.cellHeight / 2;

        lines.forEach((line, i) => {
            if (i === 0) {
                this.ctx.font = `${labelFontSize}px ${VISUAL_CONFIG.FONT_FAMILY}`;
                this.ctx.fillStyle = COLOR_ALPHA.WHITE(opacity);
                this.ctx.fillText(line, x + cellWidth / 2, firstLineY);
            } else if (line === 'Scale Degrees') {
                this.ctx.font = `${labelFontSize}px ${VISUAL_CONFIG.FONT_FAMILY}`;
                this.ctx.fillStyle = COLOR_ALPHA.WHITE(opacity);
                this.ctx.fillText(line, x + cellWidth / 2, firstLineY + labelFontSize * VISUAL_CONFIG.LABEL.LINE_SPACING);
            } else {
                this.ctx.font = `italic ${labelFontSize * VISUAL_CONFIG.LABEL.SECONDARY_FONT_SCALE}px ${VISUAL_CONFIG.FONT_FAMILY}`;
                this.ctx.fillStyle = COLOR_ALPHA.WHITE(VISUAL_CONFIG.LABEL.SECONDARY_OPACITY * opacity);
                this.ctx.fillText(line, x + cellWidth / 2, firstLineY + labelFontSize * VISUAL_CONFIG.LABEL.LINE_SPACING);
            }
        });
    }

    /**
     * Draws scale degree label cells.
     * @private
     */
    drawScaleDegreeLabelCell({ cell, x, y, cellWidth, row, opacity, scaleDegreeFontSize }) {
        this.ctx.font = `${scaleDegreeFontSize}px ${VISUAL_CONFIG.FONT_FAMILY}`;
        this.ctx.fillStyle = COLOR_ALPHA.WHITE(opacity);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'alphabetic';

        const centerX = x + cellWidth / 2;
        const verticalOffset = row === 1 ? this.cellHeight * VISUAL_CONFIG.SCALE_DEGREE.ROW1_OFFSET : this.cellHeight * VISUAL_CONFIG.SCALE_DEGREE.OTHER_OFFSET;
        const centerY = y + this.cellHeight / 2 + verticalOffset;

        const numericPart = cell.scaleDegree.slice(-1);

        this.ctx.fillText(cell.scaleDegree, centerX, centerY + scaleDegreeFontSize * VISUAL_CONFIG.SCALE_DEGREE.TEXT_OFFSET);

        const fullWidth = this.ctx.measureText(cell.scaleDegree).width;
        const numWidth = this.ctx.measureText(numericPart).width;
        const accentX = centerX + (fullWidth - numWidth) / 2;

        this.ctx.save();
        this.ctx.translate(accentX, centerY - scaleDegreeFontSize * VISUAL_CONFIG.SCALE_DEGREE.ACCENT_OFFSET);
        this.ctx.scale(VISUAL_CONFIG.SCALE_DEGREE.ACCENT_SCALE_X, VISUAL_CONFIG.SCALE_DEGREE.ACCENT_SCALE_Y);
        this.ctx.font = `${scaleDegreeFontSize * VISUAL_CONFIG.SCALE_DEGREE.ACCENT_FONT_SCALE}px ${VISUAL_CONFIG.FONT_FAMILY}`;
        this.ctx.fillText('^', 0, 0);
        this.ctx.restore();
    }

    /**
     * Draws the grid cells according to cell types and data.
     * Each cell type (NOTE, SCALE_OR_CHORD_LABEL, SCALE_DEGREE_LABEL) is rendered
     * with appropriate colors, text, and formatting.
     * @private
     */
    drawGrid() {
        const { opacity, desaturate } = this.getPlaybackVisuals();
        // For each cell in grid
        for (let row = 0; row < GRID.ROWS; row++) {
            for (let col = 0; col < GRID.COLS; col++) {
                const cell = this.gridData[row][col];
                if (!cell) throw new Error('no cell data');
                if (cell.type === CELL_TYPE.EMPTY) continue;

                const x = this.getColumnX(col);
                const y = row * this.cellHeight;
                const cellWidth = this.getColumnWidth(col);
                const labelFontSize = Math.min(this.cellHeight * VISUAL_CONFIG.LABEL.MAX_FONT_HEIGHT, cellWidth * VISUAL_CONFIG.LABEL.MAX_FONT_WIDTH);
                const scaleDegreeFontSize = this.cellHeight * VISUAL_CONFIG.SCALE_DEGREE.FONT_HEIGHT;

                // For notes
                if (cell.type === CELL_TYPE.NOTE) {
                    this.drawNoteCell({ cell, x, y, cellWidth, opacity, desaturate });
                }

                // For scale/chord labels
                else if (cell.type === CELL_TYPE.SCALE_OR_CHORD_LABEL) {
                    this.drawScaleOrChordLabelCell({ cell, x, y, cellWidth, row, opacity, labelFontSize });
                }

                // For scale degree labels
                else if (cell.type === CELL_TYPE.SCALE_DEGREE_LABEL) {
                    this.drawScaleDegreeLabelCell({
                        cell,
                        x,
                        y,
                        cellWidth,
                        row,
                        opacity,
                        scaleDegreeFontSize,
                    });
                }
            }
        }
    }

    /**
     * Draws the current chord highlight on the appropriate chord label cell only.
     * @private
     */
    drawChordHighlight() {
        if (!this.currentChord) return;
        // Determine row from currentChord, remove the '7' suffix
        const row = GRID_LAYOUT.mixolydian.rows[this.currentChord[0]];
        if (row === undefined) return;

        // Draw highlight box around chord label cell only
        const x = 0;
        const y = row * this.cellHeight;
        const labelWidth = this.getColumnWidth(0);

        this.ctx.strokeStyle = COLOR_ALPHA.WHITE(1);
        this.ctx.lineWidth = VISUAL_CONFIG.CHORD_HIGHLIGHT.BORDER_WIDTH;
        this.ctx.strokeRect(x, y, labelWidth, this.cellHeight);

        // Fill with semi-transparent white
        this.ctx.fillStyle = COLOR_ALPHA.WHITE(VISUAL_CONFIG.CHORD_HIGHLIGHT.FILL_OPACITY);
        this.ctx.fillRect(x, y, labelWidth, this.cellHeight);

    }

    /**
     * Draws countdown badge on the next chord label cell.
     * @private
     */
    drawNextChordCountdown() {
        if (!this.nextChord) return;
        const row = GRID_LAYOUT.mixolydian.rows[this.nextChord[0]];
        if (row === undefined) return;

        const x = 0;
        const y = row * this.cellHeight;
        const labelWidth = this.getColumnWidth(0);

        this.drawCountdownBadge({
            x,
            y,
            width: labelWidth,
            height: this.cellHeight,
            count: this.nextChordCountdown,
        });
    }

    /**
     * Draws a small countdown badge in the highlighted chord cell.
     * @param {{x: number, y: number, width: number, height: number, count: number|null}} options
     * @private
     */
    drawCountdownBadge({ x, y, width, height, count }) {
        if (count === null || count < 1 || count > 4) return;

        const size = VISUAL_CONFIG.COUNTDOWN_BADGE.SIZE;
        const padding = VISUAL_CONFIG.COUNTDOWN_BADGE.PADDING;
        const badgeX = x + width - size - padding;
        const badgeY = y + padding;
        const radius = size / 2;

        this.ctx.save();
        this.ctx.fillStyle = COLOR_ALPHA.BLACK(VISUAL_CONFIG.COUNTDOWN_BADGE.BG_OPACITY);
        this.ctx.strokeStyle = COLOR_ALPHA.WHITE(VISUAL_CONFIG.COUNTDOWN_BADGE.BORDER_OPACITY);
        this.ctx.lineWidth = VISUAL_CONFIG.COUNTDOWN_BADGE.BORDER_WIDTH;

        this.ctx.beginPath();
        this.ctx.arc(badgeX + radius, badgeY + radius, radius, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.stroke();

        const fontSize = size * VISUAL_CONFIG.COUNTDOWN_BADGE.FONT_SCALE;
        this.ctx.font = `${fontSize}px ${VISUAL_CONFIG.FONT_FAMILY}`;
        this.ctx.fillStyle = COLOR_ALPHA.WHITE(VISUAL_CONFIG.COUNTDOWN_BADGE.TEXT_OPACITY);
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillText(String(count), badgeX + radius, badgeY + radius + 0.5);

        this.ctx.restore();
    }

    /**
     * Helper to adjust HSL brightness.
     * @param {string} hslColor - HSL color string
     * @param {number} amount - Brightness adjustment (-1 to 1, where 0 is no change)
     * @returns {string} Adjusted HSL color string
     * @private
     */
    adjustBrightness(hslColor, amount) {
        const match = hslColor.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
        if (!match) return hslColor;
        const h = match[1];
        const s = match[2];
        const l = Math.max(0, Math.min(100, parseFloat(match[3]) + amount * 100));
        return `hsl(${h}, ${s}%, ${l}%)`;
    }

    /**
     * Helper to apply desaturation and opacity to a color.
     * Desaturation blends the color toward grayscale (0 = normal, 1 = full grayscale).
     * @private
     */
    applyDesaturateAndOpacity(hslColor, desaturate, opacity) {
        const match = hslColor.match(/hsl\((\d+),\s*([\d.]+)%,\s*([\d.]+)%\)/);
        if (!match) return hslColor;
        const h = match[1];
        let s = parseFloat(match[2]);
        const l = parseFloat(match[3]);
        
        // Desaturate by reducing saturation toward 0
        s = s * (1 - desaturate);
        
        // Apply opacity
        return `hsla(${h}, ${s}%, ${l}%, ${opacity})`;
    }

    /**
     * Draws overlays on currently active (playing) note cells.
     * Active cells appear slightly darker/pressed.
     * @private
     */
    drawActiveCells() {
        for (const cellIndex of this.activeCells) {
            const row = Math.floor(cellIndex / GRID.COLS);
            const col = cellIndex % GRID.COLS;
            const cell = this.gridData[row][col];

            if (!cell || cell.type !== CELL_TYPE.NOTE) {
                continue;
            };

            const x = this.getColumnX(col);
            const y = row * this.cellHeight;
            const cellWidth = this.getColumnWidth(col);
            const btnX = x + VISUAL_CONFIG.NOTE.PADDING;
            const btnY = y + VISUAL_CONFIG.NOTE.PADDING;
            const btnW = cellWidth - VISUAL_CONFIG.NOTE.PADDING * 2;
            const btnH = this.cellHeight - VISUAL_CONFIG.NOTE.PADDING * 2;

            // Fill with darker version of color
            const pressedColor = this.adjustBrightness(cell.color, VISUAL_CONFIG.NOTE.PRESSED_BRIGHTNESS_ADJUST);
            this.ctx.fillStyle = pressedColor;
            this.ctx.beginPath();
            this.ctx.roundRect(btnX, btnY, btnW, btnH, VISUAL_CONFIG.NOTE.RADIUS);
            this.ctx.fill();

            // Bold border for pressed state
            this.ctx.strokeStyle = COLOR_ALPHA.BLACK(VISUAL_CONFIG.NOTE.BORDER_OPACITY_PRESSED);
            this.ctx.lineWidth = VISUAL_CONFIG.NOTE.BORDER_WIDTH;
            this.ctx.beginPath();
            this.ctx.roundRect(btnX, btnY, btnW, btnH, VISUAL_CONFIG.NOTE.RADIUS);
            this.ctx.stroke();

            // Redraw note name (offset down slightly for pressed effect)
            this.ctx.fillStyle = COLOR_ALPHA.BLACK(1);
            const noteFontSize = Math.min(this.cellHeight * VISUAL_CONFIG.NOTE.MAX_FONT_HEIGHT, cellWidth * VISUAL_CONFIG.NOTE.MAX_FONT_WIDTH);
            this.ctx.font = `${noteFontSize}px ${VISUAL_CONFIG.FONT_FAMILY}`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
                cell.noteName,
                x + cellWidth / 2,
                y + this.cellHeight / 2 + VISUAL_CONFIG.NOTE.PRESSED_OFFSET_Y,
            );
        }
    }

    /**
     * Sets the current chord to highlight.
     * @param {string|null} chord - The chord name (e.g., 'C7', 'F7', 'G7') or null to clear
     */
    setCurrentChord(chord) {
        this.currentChord = chord;
    }

    /**
     * Sets the next chord to display countdown for.
     * @param {string|null} chord
     */
    setNextChord(chord) {
        this.nextChord = chord;
    }

    /**
     * Sets the countdown for the next chord (1-4). Use null to hide.
     * @param {number|null} count
     */
    setNextChordCountdown(count) {
        this.nextChordCountdown = count;
    }

    /**
     * Marks a cell as active (currently playing).
     * @param {number} row - The row index of the cell
     * @param {number} col - The column index of the cell
     */
    addActiveCell(row, col) {
        this.activeCells.add(row * GRID.COLS + col);
    }

    /**
     * Removes a cell from the active (playing) state.
     * @param {number} row - The row index of the cell
     * @param {number} col - The column index of the cell
     */
    removeActiveCell(row, col) {
        this.activeCells.delete(row * GRID.COLS + col);
    }

    /**
     * Clears all active cells, removing all active note highlights.
     */
    clearActiveCells() {
        this.activeCells.clear();
    }
}