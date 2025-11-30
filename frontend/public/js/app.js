// Fix import paths - they should be relative to public/js/app.js
import { Login } from '../../src/auth/login.js';
import { PasswordReset } from '../../src/auth/password-reset.js';
import { RequestAccount } from '../../src/auth/register.js';

class NetisTrackApp {
    constructor() {
        this.currentPage = null;
        this.init();
    }

    async init() {
        // Load CSS first
        this.loadAuthCSS();
        
        // Set up routing
        this.setupRouting();
        
        // Load initial page based on route
        this.handleRouteChange();
    }

    loadAuthCSS() {
        // Dynamically load auth CSS if not already loaded
        if (!document.querySelector('link[href*="auth.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '../../src/auth/auth.css';
            document.head.appendChild(link);
        }
    }

    setupRouting() {
        // Handle browser back/forward
        window.addEventListener('hashchange', () => {
            this.handleRouteChange();
        });

        // Handle page reload
        window.addEventListener('load', () => {
            this.handleRouteChange();
        });
    }

    async handleRouteChange() {
        const hash = window.location.hash.replace('#', '') || 'login';
        const mainContent = document.getElementById('main-content');

        console.log('Loading route:', hash);

        // Clear current page
        if (this.currentPage && typeof this.currentPage.destroy === 'function') {
            this.currentPage.destroy();
        }

        // Load appropriate page
        try {
            switch (hash) {
                case 'login':
                    this.currentPage = new Login();
                    break;
                case 'password-reset':
                    this.currentPage = new PasswordReset();
                    break;
                case 'request-account':
                    this.currentPage = new RequestAccount();
                    break;
                case 'dashboard':
                    this.loadDashboard();
                    break;
                default:
                    this.load404();
                    return;
            }

            if (mainContent && this.currentPage && typeof this.currentPage.render === 'function') {
                mainContent.innerHTML = this.currentPage.render();
                if (typeof this.currentPage.attachEvents === 'function') {
                    this.currentPage.attachEvents();
                }
            }
        } catch (error) {
            console.error('Error loading page:', error);
            this.loadError();
        }
    }

    loadDashboard() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2>Welcome to NetisTrackGh Dashboard</h2>
                <p>Dashboard features coming soon...</p>
                <button onclick="window.authService.logout()" style="
                    background: #667eea; 
                    color: white; 
                    border: none; 
                    padding: 10px 20px; 
                    border-radius: 5px; 
                    cursor: pointer;
                    margin-top: 20px;
                ">Logout</button>
            </div>
        `;
    }

    load404() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2>Page Not Found</h2>
                <p>The page you're looking for doesn't exist.</p>
                <a href="#login" style="color: #667eea; text-decoration: none;">Go to Login</a>
            </div>
        `;
    }

    loadError() {
        const mainContent = document.getElementById('main-content');
        mainContent.innerHTML = `
            <div style="padding: 40px; text-align: center;">
                <h2>Error Loading Page</h2>
                <p>There was an error loading the page. Please try again.</p>
                <a href="#login" style="color: #667eea; text-decoration: none;">Go to Login</a>
            </div>
        `;
    }
}

// Make authService available globally (temporary)
window.authService = {
    logout: () => {
        localStorage.removeItem('lastLogin');
        window.location.hash = 'login';
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new NetisTrackApp();
});