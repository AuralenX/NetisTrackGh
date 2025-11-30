import { authService } from '../services/authService.js';
import { showAlert, validateEmail } from '../utils/helpers.js';

export class PasswordReset {
    constructor() {
        this.init();
    }

    init() {
        this.render();
        this.attachEvents();
        loadCSS() {
            if (!document.querySelector('link[href*="auth.css"]')) {
                const link = document.createElement('link');
                link.rel = 'stylesheet';
                link.href = '/src/auth/auth.css'; // Absolute path
                document.head.appendChild(link);
            }
        };
    }

    render() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <img src="/icons/logo.png" alt="NetisTrackGh" class="auth-logo">
                        <h1 class="auth-title">Reset Password</h1>
                        <p class="auth-subtitle">Enter your email to receive a reset link</p>
                    </div>

                    <form id="passwordResetForm" class="auth-form">
                        <div id="alertContainer"></div>
                        
                        <div class="form-group">
                            <label for="resetEmail" class="form-label">Email Address</label>
                            <input 
                                type="email" 
                                id="resetEmail" 
                                class="form-input" 
                                placeholder="Enter your email"
                                required
                            >
                        </div>

                        <button type="submit" class="auth-button" id="resetButton">
                            Send Reset Link
                        </button>

                        <div class="auth-links">
                            <a href="#login" class="auth-link">Back to Login</a>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const resetForm = document.getElementById('passwordResetForm');
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handlePasswordReset();
        });

        // Handle back to login
        window.addEventListener('hashchange', () => {
            if (window.location.hash === '#login') {
                this.navigateToLogin();
            }
        });
    }

    async handlePasswordReset() {
        const email = document.getElementById('resetEmail').value;
        const resetButton = document.getElementById('resetButton');

        if (!validateEmail(email)) {
            showAlert('Please enter a valid email address', 'error');
            return;
        }

        try {
            resetButton.innerHTML = '<div class="loading"></div> Sending...';
            resetButton.disabled = true;

            await authService.sendPasswordResetEmail(email);
            
            showAlert('Password reset link sent! Check your email.', 'success');
            
            // Clear form
            document.getElementById('passwordResetForm').reset();

        } catch (error) {
            console.error('Password reset error:', error);
            showAlert(this.getErrorMessage(error.code), 'error');
        } finally {
            resetButton.innerHTML = 'Send Reset Link';
            resetButton.disabled = false;
        }
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/invalid-email': 'Invalid email address',
            'auth/user-not-found': 'No account found with this email',
            'auth/too-many-requests': 'Too many attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your connection'
        };

        return errorMessages[errorCode] || 'Failed to send reset link. Please try again.';
    }

    navigateToLogin() {
        window.dispatchEvent(new CustomEvent('routeChange', {
            detail: { route: 'login' }
        }));
    }
}