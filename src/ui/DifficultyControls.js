export class DifficultyControls {
    constructor() {
        this.difficultySelect = /** @type {HTMLSelectElement} */ (document.getElementById('difficulty-select'));
        this.currentDifficulty = this.normalizeDifficulty(this.difficultySelect.value);
    }

    /**
     * No callbacks needed. Changes in rendering managed by main.js by checking the difficulty when needed.
     */
    enable() {
        this.difficultySelect.addEventListener('change', () => {
            this.currentDifficulty = this.normalizeDifficulty(this.difficultySelect.value);
            console.log(`Difficulty changed to ${this.currentDifficulty}`);
        });
    }

    /**
     * @returns {'easy' | 'medium' | 'hard'} - current difficulty level
     */
    getDifficulty() {
        return this.currentDifficulty;
    }

    /**
     * @param {string} value
     * @returns {'easy' | 'medium' | 'hard'}
     */
    normalizeDifficulty(value) {
        if (!['easy', 'medium', 'hard'].includes(value)) {
            console.warn(`Unexpected difficulty value '${value}'. Defaulting to 'easy'.`);
            return 'easy';
        }

        return value;
    }
}