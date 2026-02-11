import { Renderer } from '../src/visual/Renderer.js';
import { GRID } from '../src/visual/grid-data.js';
import { COLORS } from '../src/visual/color-data.js';

const output = document.getElementById('output');
const canvas = document.getElementById('testCanvas');
const statusEl = document.getElementById('status');

function log(message, isError = false) {
    const timestamp = new Date().toLocaleTimeString();
    const prefix = isError ? '❌' : '✓';
    const line = `[${timestamp}] ${prefix} ${message}`;
    console.log(line);
    output.textContent += line + '\n';
    output.scrollTop = output.scrollHeight;
}

let renderer = null;
let currentChordIndex = 0;
const chords = ['C7', 'F7', 'G7'];

function initRenderer() {
    try {
        renderer = new Renderer(canvas);
        statusEl.textContent = 'Status: renderer initialized';
        log('Renderer initialized');
        renderer.render();
        log('Initial render complete');
    } catch (error) {
        statusEl.textContent = 'Status: error initializing renderer';
        log(`Failed to initialize renderer: ${error.message}`, true);
    }
}

function testSetCurrentChord() {
    if (!renderer) {
        log('Renderer not initialized', true);
        return;
    }
    try {
        const chord = chords[currentChordIndex];
        renderer.setCurrentChord(chord);
        renderer.render();
        log(`setCurrentChord("${chord}") and rendered`);
        
        currentChordIndex = (currentChordIndex + 1) % chords.length;
    } catch (error) {
        log(`Error testing setCurrentChord: ${error.message}`, true);
    }
}

let addRemoveState = 0;
function testAddRemoveSingleCell() {
    if (!renderer) {
        log('Renderer not initialized', true);
        return;
    }
    try {
        if (addRemoveState === 0) {
            renderer.addActiveCell(0, 1); // G row, scale degree 1
            renderer.render();
            log('Added active cell at (0, 1) and rendered');
            addRemoveState = 1;
        } else {
            renderer.removeActiveCell(0, 1);
            renderer.render();
            log('Removed active cell at (0, 1) and rendered');
            addRemoveState = 0;
        }
    } catch (error) {
        log(`Error testing single active cell: ${error.message}`, true);
    }
}

let multiCellState = 0;
function testAddRemoveMultipleCells() {
    if (!renderer) {
        log('Renderer not initialized', true);
        return;
    }
    try {
        if (multiCellState === 0) {
            renderer.addActiveCell(1, 2); // F row, scale degree 2
            renderer.render();
            log('Added first active cell at (1, 2) and rendered');
            multiCellState = 1;
        } else if (multiCellState === 1) {
            renderer.addActiveCell(2, 3); // C row, scale degree 3
            renderer.render();
            log('Added second active cell at (2, 3) and rendered');
            multiCellState = 2;
        } else {
            renderer.clearActiveCells();
            renderer.render();
            log('Cleared all active cells and rendered');
            multiCellState = 0;
        }
    } catch (error) {
        log(`Error testing multiple active cells: ${error.message}`, true);
    }
}

function testResize() {
    if (!renderer) {
        log('Renderer not initialized', true);
        return;
    }
    try {
        log('Testing resize...');
        renderer.resize();
        renderer.render();
        log('Resized and rendered');
    } catch (error) {
        log(`Error testing resize: ${error.message}`, true);
    }
}

function clearCanvas() {
    if (!renderer) {
        log('Renderer not initialized', true);
        return;
    }
    try {
        renderer.clearActiveCells();
        renderer.setCurrentChord(null);
        renderer.render();
        log('Canvas cleared');
    } catch (error) {
        log(`Error clearing canvas: ${error.message}`, true);
    }
}

function testSequence() {
    if (!renderer) {
        log('Renderer not initialized', true);
        return;
    }
    try {
        log('Running test sequence...');
        
        // Set chord
        renderer.setCurrentChord('C7');
        renderer.render();
        log('Step 1: Set C7 chord');
        
        // Add some notes
        setTimeout(() => {
            renderer.addActiveCell(2, 1);
            renderer.render();
            log('Step 2: Activated note at C row, col 1');
        }, 500);
        
        // Change chord
        setTimeout(() => {
            renderer.setCurrentChord('G7');
            renderer.render();
            log('Step 3: Changed to G7 chord');
        }, 1000);
        
        // Add more notes
        setTimeout(() => {
            renderer.addActiveCell(0, 2);
            renderer.addActiveCell(0, 3);
            renderer.render();
            log('Step 4: Activated 2 notes at G row');
        }, 1500);
        
        // Clear all
        setTimeout(() => {
            renderer.clearActiveCells();
            renderer.setCurrentChord(null);
            renderer.render();
            log('Step 5: Cleared all');
        }, 2000);
    } catch (error) {
        log(`Error in test sequence: ${error.message}`, true);
    }
}

// Event listeners
document.getElementById('initBtn').addEventListener('click', initRenderer);
document.getElementById('chordBtn').addEventListener('click', testSetCurrentChord);
document.getElementById('singleCellBtn').addEventListener('click', testAddRemoveSingleCell);
document.getElementById('multiCellBtn').addEventListener('click', testAddRemoveMultipleCells);
document.getElementById('resizeBtn').addEventListener('click', testResize);
document.getElementById('clearBtn').addEventListener('click', clearCanvas);
document.getElementById('sequenceBtn').addEventListener('click', testSequence);
document.getElementById('clearLogBtn').addEventListener('click', () => {
    output.textContent = '';
    log('Log cleared');
});

// Handle window resize
window.addEventListener('resize', () => {
    if (renderer) {
        renderer.resize();
        renderer.render();
    }
});

log('Renderer test initialized');
