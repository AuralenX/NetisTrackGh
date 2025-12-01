import { showAlert, validateEmail, setButtonLoading, showFieldError, clearFieldError } from '../utils/helpers.js';
import { authService } from '../services/authService.js';

export class Login {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    async init() {
        console.log('🔐 Login component initializing...');
        
        try {
            // Check if user is already authenticated
            await this.checkExistingAuth();
            this.isInitialized = true;
            console.log('✅ Login component initialized');
        } catch (error) {
            console.error('❌ Login component initialization failed:', error);
        }
    }

    // Check if user is already authenticated
    async checkExistingAuth() {
        try {
            const isAuthenticated = await authService.isAuthenticated();
            if (isAuthenticated) {
                console.log('🔄 User already authenticated, redirecting to dashboard...');
                showAlert('Welcome back! Redirecting...', 'success', 1500);
                
                setTimeout(() => {
                    authService.redirectBasedOnRole();
                }, 1500);
                
                return true;
            }
            return false;
        } catch (error) {
            console.log('👤 No existing authentication found');
            return false;
        }
    }

    render() {
        return `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <img src="icons/logo.png" class="auth-logo"/>
                        <h1 class="auth-title">Welcome Back</h1>
                        <p class="auth-subtitle">Sign in to your NetisTrackGh account</p>
                    </div>

                    <form id="loginForm" class="auth-form" novalidate>
                        <div id="loginAlertContainer"></div>
                        
                        <!-- Email Field -->
                        <div class="form-group">
                            <label for="loginEmail" class="form-label">Email Address</label>
                            <input 
                                type="email" 
                                id="loginEmail" 
                                class="form-input" 
                                placeholder="Enter your email address"
                                required
                                autocomplete="email"
                                value="${localStorage.getItem('userEmail') || ''}"
                            >
                            <div class="error-message" id="loginEmailError"></div>
                        </div>

                        <!-- Password Field -->
                        <div class="form-group">
                            <label for="loginPassword" class="form-label">Password</label>
                            <input 
                                type="password" 
                                id="loginPassword" 
                                class="form-input" 
                                placeholder="Enter your password"
                                required
                                autocomplete="current-password"
                            >
                            <div class="error-message" id="loginPasswordError"></div>
                        </div>

                        <!-- Submit Button -->
                        <button type="submit" class="auth-button" id="loginButton">
                            Sign In
                        </button>

                        <!-- Action Links -->
                        <div class="auth-links">
                            <a href="#password-reset" class="auth-link" id="forgotPasswordLink">
                                Forgot Password?
                            </a>
                            <a href="#request-account" class="auth-link" id="requestAccountLink">
                                Request Account
                            </a>
                        </div>

                        <!-- Demo Information -->
                        <div style="text-align: center; margin-top: 24px; padding: 16px; background: rgba(102, 126, 234, 0.1); border-radius: 8px; border: 1px solid rgba(102, 126, 234, 0.2);">
                            <p style="font-size: 14px; color: #4a5568; margin: 0; line-height: 1.4;">
                                <strong>Demo Access:</strong><br>
                                Use your registered company email and password
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEvents() {
        console.log('🔗 Attaching login events...');
        
        const loginForm = document.getElementById('loginForm');
        const loginButton = document.getElementById('loginButton');
        const forgotPasswordLink = document.getElementById('forgotPasswordLink');
        const requestAccountLink = document.getElementById('requestAccountLink');

        if (!loginForm) {
            console.error('❌ Login form not found');
            return;
        }

        // Form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Enter key support
        loginForm.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.handleLogin();
            }
        });

        // Navigation links
        if (forgotPasswordLink) {
            forgotPasswordLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToPasswordReset();
            });
        }

        if (requestAccountLink) {
            requestAccountLink.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToRequestAccount();
            });
        }

        // Real-time validation
        this.attachRealTimeValidation();

        // Auto-focus email field
        setTimeout(() => {
            const emailInput = document.getElementById('loginEmail');
            if (emailInput) {
                emailInput.focus();
            }
        }, 100);

        console.log('✅ Login events attached successfully');
    }

    attachRealTimeValidation() {
        const emailInput = document.getElementById('loginEmail');
        const passwordInput = document.getElementById('loginPassword');

        if (emailInput) {
            emailInput.addEventListener('blur', () => {
                this.validateEmailField();
            });

            emailInput.addEventListener('input', () => {
                // Clear error when user starts typing
                if (emailInput.value.trim()) {
                    clearFieldError('loginEmail');
                }
            });
        }

        if (passwordInput) {
            passwordInput.addEventListener('blur', () => {
                this.validatePasswordField();
            });

            passwordInput.addEventListener('input', () => {
                // Clear error when user starts typing
                if (passwordInput.value) {
                    clearFieldError('loginPassword');
                }
            });
        }
    }

    validateEmailField() {
        const emailInput = document.getElementById('loginEmail');
        const email = emailInput?.value.trim();
        
        if (!email) {
            showFieldError('loginEmail', 'Email address is required');
            return false;
        }

        if (!validateEmail(email)) {
            showFieldError('loginEmail', 'Please enter a valid email address');
            return false;
        }

        clearFieldError('loginEmail');
        return true;
    }

    validatePasswordField() {
        const passwordInput = document.getElementById('loginPassword');
        const password = passwordInput?.value;
        
        if (!password) {
            showFieldError('loginPassword', 'Password is required');
            return false;
        }

        if (password.length < 6) {
            showFieldError('loginPassword', 'Password must be at least 6 characters');
            return false;
        }

        clearFieldError('loginPassword');
        return true;
    }

    async handleLogin() {
        console.log('🔄 Handling login process...');
        
        const email = document.getElementById('loginEmail')?.value.trim();
        const password = document.getElementById('loginPassword')?.value;
        const loginButton = document.getElementById('loginButton');

        if (!email || !password || !loginButton) {
            showAlert('Form elements not found. Please refresh the page.', 'error');
            return;
        }

        // Validate form fields
        const isEmailValid = this.validateEmailField();
        const isPasswordValid = this.validatePasswordField();

        if (!isEmailValid || !isPasswordValid) {
            showAlert('Please fix the errors in the form before submitting.', 'error');
            return;
        }

        try {
            // Show loading state
            setButtonLoading(loginButton, true, 'Signing In...');

            console.log('📡 Attempting login for:', email);
            
            // Use the integrated auth service
            const authResult = await authService.login(email, password);
            
            console.log('✅ Login successful:', authResult);
            
            // Show success message
            this.showLoginSuccess(authResult);

            // Store email for future use
            localStorage.setItem('userEmail', email);

            // Redirect after delay
            setTimeout(() => {
                authService.redirectBasedOnRole();
            }, 2000);

        } catch (error) {
            console.error('❌ Login failed:', error);
            this.handleLoginError(error);
        } finally {
            setButtonLoading(loginButton, false);
        }
    }

    showLoginSuccess(authResult) {
        const userRole = authResult.backendData?.user?.role || 'user';
        const userName = authResult.backendData?.user?.firstName || '';
        
        let welcomeMessage = 'Login successful!';
        if (userName) {
            welcomeMessage = `Welcome back, ${userName}!`;
        }
        
        showAlert(welcomeMessage, 'success', 3000);
        
        // Update UI with success state
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.style.opacity = '0.7';
        }
        
        // Show role-based message
        const alertContainer = document.getElementById('loginAlertContainer');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-success">
                    <strong>Success!</strong><br>
                    ${welcomeMessage}<br>
                    <small>Redirecting to ${userRole} dashboard...</small>
                </div>
            `;
        }
    }

    handleLoginError(error) {
        console.error('🔴 Login error details:', error);
        
        const errorMessages = {
            // Firebase Auth Errors
            'auth/invalid-email': 'Invalid email address format. Please check your email.',
            'auth/user-disabled': 'This account has been disabled. Please contact your administrator.',
            'auth/user-not-found': 'No account found with this email address.',
            'auth/wrong-password': 'Incorrect password. Please try again.',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later or reset your password.',
            'auth/network-request-failed': 'Network error. Please check your internet connection.',
            'auth/operation-not-allowed': 'Email/password login is not enabled for this application.',
            
            // Backend Errors
            'Backend verification failed': 'Authentication service unavailable. Please try again later.',
            'Unable to connect to authentication service': 'Cannot reach authentication server. Please check your connection.',
            'Failed to fetch': 'Cannot connect to the server. Please check your internet connection.',
            
            // Generic Errors
            'Invalid credentials': 'The email or password you entered is incorrect.'
        };

        let message = 'Login failed. Please try again.';
        let errorCode = error.code || error.message;
        
        if (errorMessages[errorCode]) {
            message = errorMessages[errorCode];
        } else if (error.message && errorMessages[error.message]) {
            message = errorMessages[error.message];
        } else if (error.message) {
            message = error.message;
        }

        // Show error in alert container
        const alertContainer = document.getElementById('loginAlertContainer');
        if (alertContainer) {
            alertContainer.innerHTML = `
                <div class="alert alert-error">
                    <strong>Login Failed</strong><br>
                    ${message}
                </div>
            `;
        }

        // Also show global alert
        showAlert(message, 'error', 5000);

        // Highlight problematic fields
        this.highlightErrorFields(error);
    }

    highlightErrorFields(error) {
        const errorCode = error.code || error.message;
        
        // Email-related errors
        if (errorCode === 'auth/invalid-email' || errorCode === 'auth/user-not-found') {
            const emailInput = document.getElementById('loginEmail');
            if (emailInput) {
                emailInput.focus();
                emailInput.select();
            }
        }
        
        // Password-related errors
        if (errorCode === 'auth/wrong-password') {
            const passwordInput = document.getElementById('loginPassword');
            if (passwordInput) {
                showFieldError('loginPassword', 'Incorrect password');
                passwordInput.focus();
                passwordInput.select();
            }
        }
        
        // Network errors
        if (errorCode === 'auth/network-request-failed' || errorCode === 'Failed to fetch') {
            showAlert('Please check your internet connection and try again.', 'warning', 5000);
        }
    }

    navigateToPasswordReset() {
        console.log('🔄 Navigating to password reset');
        window.location.hash = 'password-reset';
    }

    navigateToRequestAccount() {
        console.log('🔄 Navigating to request account');
        window.location.hash = 'request-account';
    }

    destroy() {
        console.log('🧹 Cleaning up login component...');
        
        // Remove event listeners if needed
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.removeEventListener('submit', this.handleLogin);
            loginForm.removeEventListener('keypress', this.handleEnterKey);
        }
        
        this.isInitialized = false;
        console.log('✅ Login component destroyed');
    }
}