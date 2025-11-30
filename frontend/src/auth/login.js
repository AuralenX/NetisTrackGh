import { authService } from '../services/authService.js';
import { showAlert, validateEmail } from '../utils/helpers.js';

export class Login {
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
                        <h1 class="auth-title">Welcome Back</h1>
                        <p class="auth-subtitle">Sign in to your NetisTrackGh account</p>
                    </div>

                    <form id="loginForm" class="auth-form">
                        <div id="alertContainer"></div>
                        
                        <div class="form-group">
                            <label for="email" class="form-label">Email Address</label>
                            <input 
                                type="email" 
                                id="email" 
                                class="form-input" 
                                placeholder="Enter your email"
                                required
                            >
                        </div>

                        <div class="form-group">
                            <label for="password" class="form-label">Password</label>
                            <input 
                                type="password" 
                                id="password" 
                                class="form-input" 
                                placeholder="Enter your password"
                                required
                            >
                        </div>

                        <button type="submit" class="auth-button" id="loginButton">
                            Sign In
                        </button>

                        <div class="auth-links">
                            <a href="#forgot-password" class="auth-link">Forgot Password?</a>
                            <a href="#request-account" class="auth-link">Request Account</a>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const loginForm = document.getElementById('loginForm');
        const loginButton = document.getElementById('loginButton');

        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.handleLogin();
        });

        // Handle route changes
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });
    }

    async handleLogin() {
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const loginButton = document.getElementById('loginButton');

        // Validation
        if (!validateEmail(email)) {
            showAlert('Please enter a valid email address', 'error');
            return;
        }

        if (password.length < 6) {
            showAlert('Password must be at least 6 characters', 'error');
            return;
        }

        try {
            // Show loading state
            loginButton.innerHTML = '<div class="loading"></div> Signing In...';
            loginButton.disabled = true;

            // Authenticate user
            const user = await authService.login(email, password);
            
            showAlert('Login successful! Redirecting...', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                authService.redirectBasedOnRole(user);
            }, 1500);

        } catch (error) {
            console.error('Login error:', error);
            showAlert(this.getErrorMessage(error.code), 'error');
        } finally {
            // Reset button state
            loginButton.innerHTML = 'Sign In';
            loginButton.disabled = false;
        }
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/invalid-email': 'Invalid email address',
            'auth/user-disabled': 'This account has been disabled',
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your connection'
        };

        return errorMessages[errorCode] || 'Login failed. Please try again.';
    }

    handleRouteChange() {
        const hash = window.location.hash;
        
        if (hash === '#forgot-password') {
            this.navigateToPasswordReset();
        } else if (hash === '#request-account') {
            this.navigateToRequestAccount();
        }
    }

    navigateToPasswordReset() {
        // This will be handled by the main router
        window.dispatchEvent(new CustomEvent('routeChange', {
            detail: { route: 'password-reset' }
        }));
    }

    navigateToRequestAccount() {
        window.dispatchEvent(new CustomEvent('routeChange', {
            detail: { route: 'request-account' }
        }));
    }
}