import { showAlert, validateEmail, setButtonLoading } from '../utils/helpers.js';

export class PasswordReset {
    constructor() {
        this.init();
    }

    init() {
        console.log('PasswordReset component initialized');
    }

    render() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <img src="icons/logo.png" alt="NetisTrackGh" class="auth-logo" 
                             onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiByeD0iMTIiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiPgo8cGF0aCBkPSJNMTUgN0wyMCAxMk0yMCAxMkwxNSAxN00yMCAxMkg0TTE4IDEyQzE4IDE2IDYgMTggNiAxMkM2IDYgMTggOCAxOCAxMloiLz4KPC9zdmc+Cjwvc3ZnPg=='">
                        <h1 class="auth-title">Reset Password</h1>
                        <p class="auth-subtitle">Enter your email to receive a password reset link</p>
                    </div>

                    <form id="passwordResetForm" class="auth-form" novalidate>
                        <div id="passwordResetAlertContainer"></div>
                        
                        <div class="form-group">
                            <label for="resetEmail" class="form-label">Email Address</label>
                            <input 
                                type="email" 
                                id="resetEmail" 
                                class="form-input" 
                                placeholder="Enter your registered email"
                                required
                                autocomplete="email"
                            >
                            <div class="error-message" id="emailError" style="display: none; color: #e53e3e; font-size: 12px; margin-top: 4px;"></div>
                        </div>

                        <button type="submit" class="auth-button" id="resetButton">
                            Send Reset Link
                        </button>

                        <div class="auth-links">
                            <a href="#login" class="auth-link" id="backToLoginLink">← Back to Login</a>
                        </div>

                        <div class="auth-divider">
                            <span>Don't have an account?</span>
                        </div>

                        <div style="text-align: center;">
                            <a href="#request-account" class="auth-link">Request Account</a>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEvents() {
        console.log('Attaching password reset events');
        
        const resetForm = document.getElementById('passwordResetForm');
        const resetButton = document.getElementById('resetButton');
        const backToLoginLink = document.getElementById('backToLoginLink');

        if (resetForm) {
            resetForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handlePasswordReset();
            });
        }

        if (backToLoginLink) {
            backToLoginLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToLogin();
            });
        }

        // Add real-time validation
        this.attachRealTimeValidation();
    }

    attachRealTimeValidation() {
        const emailInput = document.getElementById('resetEmail');

        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validateEmailField();
            });

            // Also validate on input for better UX
            emailInput.addEventListener('input', () => {
                const emailError = document.getElementById('emailError');
                if (emailError && emailError.style.display !== 'none') {
                    this.validateEmailField();
                }
            });
        }
    }

    validateEmailField() {
        const emailInput = document.getElementById('resetEmail');
        const emailError = document.getElementById('emailError');
        
        if (!emailInput || !emailError) return true;

        const email = emailInput.value.trim();
        
        if (!email) {
            emailError.textContent = 'Email is required';
            emailError.style.display = 'block';
            return false;
        }

        if (!validateEmail(email)) {
            emailError.textContent = 'Please enter a valid email address';
            emailError.style.display = 'block';
            return false;
        }

        emailError.style.display = 'none';
        return true;
    }

    async handlePasswordReset() {
        console.log('Handling password reset...');
        
        const email = document.getElementById('resetEmail')?.value.trim();
        const resetButton = document.getElementById('resetButton');

        // Validate form
        const isEmailValid = this.validateEmailField();

        if (!isEmailValid) {
            showAlert('Please fix the email error', 'error');
            return;
        }

        try {
            setButtonLoading(resetButton, true, 'Sending Reset Link...');

            // Use Firebase Authentication to send password reset email
            await firebase.auth().sendPasswordResetEmail(email);
            
            console.log('Password reset email sent to:', email);
            
            showAlert('Password reset link sent! Check your email inbox.', 'success', 6000);
            
            // Clear form
            document.getElementById('passwordResetForm').reset();
            
            // Show additional instructions
            this.showSuccessInstructions(email);

        } catch (error) {
            console.error('Password reset error:', error);
            this.handlePasswordResetError(error);
        } finally {
            setButtonLoading(resetButton, false);
        }
    }

    showSuccessInstructions(email) {
        const alertContainer = document.getElementById('passwordResetAlertContainer');
        if (!alertContainer) return;

        const infoAlert = document.createElement('div');
        infoAlert.className = 'alert alert-info';
        infoAlert.innerHTML = `
            <div style="font-size: 13px; line-height: 1.4;">
                <strong>What to do next:</strong><br>
                • Check your inbox at <strong>${email}</strong><br>
                • Look for an email from NetisTrackGh<br>
                • Click the reset link in the email<br>
                • Create your new password<br>
                • Return here to login
            </div>
        `;

        // Remove any existing info alerts
        const existingInfoAlerts = alertContainer.querySelectorAll('.alert-info');
        existingInfoAlerts.forEach(alert => alert.remove());

        alertContainer.appendChild(infoAlert);
    }

    handlePasswordResetError(error) {
        const errorMessages = {
            'auth/invalid-email': 'Invalid email address format',
            'auth/user-not-found': 'No account found with this email address',
            'auth/too-many-requests': 'Too many attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your internet connection',
            'auth/operation-not-allowed': 'Password reset is not enabled for this application'
        };

        const message = errorMessages[error.code] || 'Failed to send reset link. Please try again.';
        showAlert(message, 'error');
    }

    navigateToLogin() {
        console.log('Navigating to login');
        window.location.hash = 'login';
    }

    destroy() {
        console.log('PasswordReset component destroyed');
        // Clean up any event listeners or timeouts
    }
}