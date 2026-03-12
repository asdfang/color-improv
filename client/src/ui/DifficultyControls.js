export class DifficultyControls {
    constructor() {
        this.difficultySelect = /** @type {HTMLSelectElement} */ (document.getElementById('difficulty-select'));
    }

    /**
     * Set up event listener for difficulty select.
     * @param {object} callbacks containing function: onDifficultyChange(newDifficulty)
     * newDifficulty: 'easy' | 'medium' | 'hard'
     */
    enable(callbacks) {
        this.difficultySelect.addEventListener('change', () => {
            const newDifficulty = this.normalizeDifficulty(this.difficultySelect.value);
            callbacks.onDifficultyChange(newDifficulty);
        });
    }

    /**
     * Sets the difficulty select dropdown to the given difficulty level.
     * @param {string} difficulty 'easy' | 'medium' | 'hard'
     */
    setDifficulty(difficulty) {
        const normalized = this.normalizeDifficulty(difficulty);
        this.difficultySelect.value = normalized;
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