export class AuthControls {
    constructor() {
        // Outside dialog
        this.authContainer = /** @type {HTMLDivElement} */ (document.getElementById('auth-controls'));
        this.registerButton = /** @type {HTMLButtonElement} */ (document.getElementById('register-btn'));
        this.loginButton = /** @type {HTMLButtonElement} */ (document.getElementById('login-btn'));
        this.logoutButton = /** @type {HTMLButtonElement} */ (document.getElementById('logout-btn'));
        this.isLoggedIn = false;

        // Inside dialog
        this.authDialog = /** @type {HTMLDialogElement} */ (document.getElementById('auth-dialog'));
        this.authForm = /** @type {HTMLFormElement} */ (document.getElementById('auth-form'));
        this.dialogTitle = /** @type {HTMLHeadingElement} */ (document.getElementById('auth-dialog-title'));
        this.nameGroup = /** @type {HTMLDivElement} */ (document.getElementById('name-form-group'));
        this.dialogState = null; // 'register' or 'login'

        this.emailInput = /** @type {HTMLInputElement} */ (document.getElementById('email-input'));
        this.nameInput = /** @type {HTMLInputElement} */ (document.getElementById('name-input'));
        this.passwordInput = /** @type {HTMLInputElement} */ (document.getElementById('password-input'));

        this.authSubmitButton = /** @type {HTMLButtonElement} */ (document.getElementById('auth-submit-btn'));
        this.authCancelButton = /** @type {HTMLButtonElement} */ (document.getElementById('auth-cancel-btn'));
        this.authFeedback = /** @type {HTMLDivElement} */ (document.getElementById('auth-feedback'));
        this.authFeedbackMessage = /** @type {HTMLParagraphElement} */ (document.getElementById('auth-feedback-message'));

        this.switchAuthLabel = /** @type {HTMLSpanElement} */ (document.getElementById('switch-auth-label'));
        this.switchAuthLink = /** @type {HTMLAnchorElement} */ (document.getElementById('switch-auth-link'));
    }

    /**
     * 
     * @param {object} callbacks - expects onRegister(email, name, password), onLogin(email, password), onLogout(), onDialogOpen()
     */
    enable(callbacks) {
        this.registerButton.addEventListener('click', () => {
            this.setDialogMode('register');
            this.clearFeedback();
            callbacks.onDialogOpen();
            this.authDialog.showModal();
        });

        this.loginButton.addEventListener('click', () => {
            this.setDialogMode('login');
            this.clearFeedback();
            callbacks.onDialogOpen();
            this.authDialog.showModal();
        });

        this.logoutButton.addEventListener('click', () => {
            callbacks.onLogout();
        });

        this.authCancelButton.addEventListener('click', () => {
            this.closeDialog();
        });

        this.authDialog.addEventListener('click', (e) => {
            if (e.target === this.authDialog) {
                this.closeDialog();
            }
        });

        this.authForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = this.emailInput.value.trim();
            const name = this.nameInput.value.trim();
            const password = this.passwordInput.value;

            try {
                if (this.dialogState === 'register') {
                    await callbacks.onRegister(email, name, password);
                } else if (this.dialogState === 'login') {
                    await callbacks.onLogin(email, password);
                }
                this.setLoggedIn(true);
                this.closeDialog();
            } catch (error) {
                const message = error instanceof Error ? error.message : 'Authentication failed';
                const errorCode = error && typeof error === 'object' && 'code' in error
                    ? error.code
                    : null;

                if (errorCode === 'EMAIL_TAKEN' || /email already registered/i.test(message)) {
                    this.showFeedback('Email already registered. Try logging in.', 'error');
                } else if (errorCode === 'INVALID_CREDENTIALS' || /invalid email or password/i.test(message)) {
                    this.showFeedback('Invalid email or password.', 'error');
                } else {
                    this.showFeedback(message, 'error');
                }
            }
        })
    }

    setDialogMode(mode) {
        this.dialogState = mode;
        if (mode === 'register') {
            this.dialogTitle.textContent = 'Register';
            this.authSubmitButton.textContent = 'Register';
            this.nameGroup.style.display = '';
            this.nameInput.required = true;
            this.clearFeedback();
            this.switchAuthLabel.textContent = 'Already have an account? ';
            this.switchAuthLink.textContent = 'Login here.';
            this.switchAuthLink.onclick = () => this.setDialogMode('login');
        } else if (mode === 'login') {
            this.dialogTitle.textContent = 'Login';
            this.authSubmitButton.textContent = 'Login';
            this.nameGroup.style.display = 'none';
            this.nameInput.required = false;
            this.clearFeedback();
            this.switchAuthLabel.textContent = 'Don\'t have an account? ';
            this.switchAuthLink.textContent = 'Register here.';
            this.switchAuthLink.onclick = () => this.setDialogMode('register');
        }
    }

    closeDialog() {
        this.clearFeedback();
        this.authDialog.close();
        this.dialogState = null;
    }

    showFeedback(message, type = 'error') {
        if (!this.authFeedback || !this.authFeedbackMessage) return;

        this.authFeedback.hidden = false;
        this.authFeedbackMessage.textContent = message;
        this.authFeedback.dataset.type = type;
    }

    clearFeedback() {
        if (!this.authFeedback || !this.authFeedbackMessage) return;

        this.authFeedback.hidden = true;
        this.authFeedbackMessage.textContent = '';
        delete this.authFeedback.dataset.type;
    }

    setLoggedIn(loggedIn) {
        this.isLoggedIn = loggedIn;
        this.updateButtons();
    }

    updateButtons() {
        if (!this.authContainer) return;
        this.authContainer.classList.toggle('is-logged-in', this.isLoggedIn);
    }
}