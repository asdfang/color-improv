export class SimpleDialogs {
    constructor() {
        // Instructions dialog
        this.instructionsBtn = /** @type {HTMLButtonElement} */ (document.getElementById('instructions'));
        this.instructionsDialog = /** @type {HTMLDialogElement} */ (document.getElementById('instructions-dialog'));
        this.closeBtn = /** @type {HTMLButtonElement} */ (document.getElementById('instructions-close-btn'));

        // Conflict dialog
        this.conflictDialog = /** @type {HTMLDialogElement} */ (document.getElementById('conflict-dialog'));
        this.localWinsBtn = /** @type {HTMLButtonElement} */ (document.getElementById('conflict-local-btn'));
        this.serverWinsBtn = /** @type {HTMLButtonElement} */ (document.getElementById('conflict-server-btn'));

        this.setupInstructionsDialog();
    }

    /**
     * Set up instructions dialog with open/close listeners.
     * @param {object} callbacks - expects onDialogOpen()
     */
    setupInstructionsDialog(callbacks) {
        if (!this.instructionsBtn || !this.instructionsDialog || !this.closeBtn) return;
        if (!this.conflictDialog || !this.localWinsBtn || !this.serverWinsBtn) return;

        this.instructionsBtn.addEventListener('click', () => {
            callbacks.onDialogOpen();
            this.instructionsDialog.showModal();
        });
        this.closeBtn.addEventListener('click', () => this.instructionsDialog.close());

        // Close when clicking the backdrop
        this.instructionsDialog.addEventListener('click', (e) => {
            if (e.target === this.instructionsDialog) this.instructionsDialog.close();
        });
    }

    /**
     * Opens the conflict dialog.
     * @param {object} callbacks - expects onLocalWins and onServerWins
     */
    showConflictDialog(callbacks) {
        this.conflictDialog.showModal();
        this.conflictDialog.addEventListener('cancel', (e) => {
            e.preventDefault(); // User explicitly chooses which wins
        });

        this.localWinsBtn.onclick = () => {
            callbacks.onLocalWins();
            this.conflictDialog.close();
        };
        this.serverWinsBtn.onclick = () => {
            callbacks.onServerWins();
            this.conflictDialog.close();
        };
    }
}