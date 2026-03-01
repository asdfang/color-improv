export class InstructionsDialog {
    constructor() {
        this.instructionsBtn = /** @type {HTMLButtonElement} */ (document.getElementById('instructions'));
        this.dialog = /** @type {HTMLDialogElement} */ (document.getElementById('instructions-dialog'));
        this.closeBtn = /** @type {HTMLButtonElement} */ (document.getElementById('instructions-close-btn'));
    }

    /**
     * Set up instructions tooltip/modal with open and close event listeners.
     */
    setupEventListeners() {
        if (!this.instructionsBtn || !this.dialog || !this.closeBtn) return;

        this.instructionsBtn.addEventListener('click', () => this.dialog.showModal());
        this.closeBtn.addEventListener('click', () => this.dialog.close());
        // Close when clicking the backdrop
        this.dialog.addEventListener('click', (e) => {
            if (e.target === this.dialog) this.dialog.close();
        });
    }
}