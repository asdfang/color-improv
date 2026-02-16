export class DifficultyControls {
    constructor() {
        this.difficultySelect = /** @type {HTMLSelectElement} */ (document.getElementById('difficulty-select'));
    }

    /**
     * No callbacks needed. Changes in rendering managed by main.js by checking the difficulty when needed.
     */
    enable() {
        this.difficultySelect.addEventListener('change', () => {
            console.log(`Difficulty changed to ${this.difficultySelect.value}`);
        });
    }

    /**
     * 
     * @returns 'easy' | 'medium' | 'hard' - current difficulty level
     */
    getDifficulty() {
        return this.difficultySelect.value;
    }
}