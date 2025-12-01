// NetisTrackGh - Main Application Router
class NetisTrackApp {
    constructor() {
        this.currentPage = null;
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Initializing NetisTrackGh Application...');
            
            // Load authentication CSS
            this.loadAuthStyles();
            
            // Initialize EmailJS
            await this.initializeEmailJS();
            
            // Initialize Firebase
            await this.initializeFirebase();
            
            // Set up routing
            this.setupRouting();
            
            // Load initial page based on route
            await this.handleRouteChange();
            
            this.isInitialized = true;
            console.log('✅ NetisTrackGh app initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize app:', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    loadAuthStyles() {
        // Check if auth styles are already loaded
        if (document.getElementById('auth-styles')) return;
        
        // Create link element for auth styles
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'src/auth/auth.css'; // Correct path from public/
        link.id = 'auth-styles';
        document.head.appendChild(link);
        
        console.log('✅ Auth styles loaded');
    }

    initializeEmailJS() {
        return new Promise((resolve, reject) => {
            if (typeof emailjs === 'undefined') {
                reject(new Error('EmailJS not loaded'));
                return;
            }
            
            try {
                // Initialize with your public key - UPDATE THIS WITH YOUR ACTUAL KEY
                emailjs.init('4_lUB6bKxfFV5xsno');
                console.log('✅ EmailJS initialized');
                resolve();
            } catch (error) {
                console.error('❌ EmailJS initialization failed:', error);
                reject(error);
            }
        });
    }

    initializeFirebase() {
        return new Promise((resolve, reject) => {
            try {
                // Firebase configuration - UPDATE WITH YOUR ACTUAL CONFIG
                const firebaseConfig = {
                    apiKey: "AIzaSyBperUb2lwgzAj21izWQqqAVKF9tgP3jbM",
                    authDomain: "netistrackgh.firebaseapp.com",
                    projectId: "netistrackgh",
                    storageBucket: "netistrackgh.firebasestorage.app",
                    messagingSenderId: "701158642294",
                    appId: "1:701158642294:web:1f5eed9c227c3e4cc18557",
                    measurementId: "G-BLRYP2K2Q0"
                };

                // Check if Firebase is already initialized
                if (!firebase.apps.length) {
                    firebase.initializeApp(firebaseConfig);
                }
                
                console.log('✅ Firebase initialized');
                resolve();
                
            } catch (error) {
                console.error('❌ Firebase initialization failed:', error);
                reject(error);
            }
        });
    }

    setupRouting() {
        // Handle hash-based routing
        window.addEventListener('hashchange', () => {
            console.log('📍 Hash changed:', window.location.hash);
            this.handleRouteChange();
        });

        // Handle initial page load
        window.addEventListener('load', () => {
            console.log('📄 Page loaded');
            if (!this.isInitialized) {
                this.handleRouteChange();
            }
        });

        // Handle browser back/forward buttons
        window.addEventListener('popstate', () => {
            this.handleRouteChange();
        });
    }

    async handleRouteChange() {
        const hash = window.location.hash.replace('#', '') || 'login';
        const mainContent = document.getElementById('main-content');

        if (!mainContent) {
            console.error('❌ Main content element not found');
            return;
        }

        console.log('🔄 Handling route change to:', hash);

        try {
            // Show loading state
            mainContent.innerHTML = `
                <div class="loading-container">
                    <div class="loading-spinner"></div>
                    <p class="loading-text">Loading ${hash}...</p>
                </div>
            `;

            // Clear current page
            if (this.currentPage && typeof this.currentPage.destroy === 'function') {
                this.currentPage.destroy();
            }

            // Load the appropriate page based on route
            await this.loadPage(hash, mainContent);

        } catch (error) {
            console.error('❌ Route change error:', error);
            this.showError(`Failed to load ${hash} page. Please try again.`);
        }
    }

    async loadPage(route, container) {
        console.log('📂 Loading page module for:', route);
        
        try {
            let pageModule;

            // Use correct relative paths from public/js/
            switch (route) {
                case 'login':
                    pageModule = await import('../src/auth/login.js');
                    this.currentPage = new pageModule.Login();
                    break;
                    
                case 'password-reset':
                    pageModule = await import('../src/auth/password-reset.js');
                    this.currentPage = new pageModule.PasswordReset();
                    break;
                    
                case 'request-account':
                    pageModule = await import('../src/auth/register.js');
                    this.currentPage = new pageModule.RequestAccount();
                    break;
                    
                case 'dashboard':
                    // We'll implement this later
                    this.currentPage = { 
                        render: () => `
                            <div style="padding: 40px; text-align: center;">
                                <h2>Dashboard</h2>
                                <p>Welcome to NetisTrackGh Dashboard!</p>
                                <p>This is a placeholder. Dashboard components coming soon.</p>
                                <button onclick="authService.logout()" style="
                                    background: #667eea;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    margin-top: 20px;
                                ">Logout</button>
                            </div>
                        `,
                        attachEvents: () => {}
                    };
                    break;
                    
                case 'analytics':
                    // We'll implement this later
                    this.currentPage = { 
                        render: () => `
                            <div style="padding: 40px; text-align: center;">
                                <h2>Analytics Dashboard</h2>
                                <p>Supervisor/Admin analytics view coming soon.</p>
                                <button onclick="authService.logout()" style="
                                    background: #667eea;
                                    color: white;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    margin-top: 20px;
                                ">Logout</button>
                            </div>
                        `,
                        attachEvents: () => {}
                    };
                    break;
                    
                default:
                    // 404 page
                    this.currentPage = {
                        render: () => `
                            <div style="padding: 40px; text-align: center;">
                                <h2>Page Not Found</h2>
                                <p>The page you're looking for doesn't exist.</p>
                                <a href="#login" style="
                                    color: #667eea; 
                                    text-decoration: none;
                                    font-weight: 500;
                                    padding: 10px 20px;
                                    border: 2px solid #667eea;
                                    border-radius: 5px;
                                    display: inline-block;
                                    margin-top: 10px;
                                ">Go to Login</a>
                            </div>
                        `,
                        attachEvents: () => {}
                    };
            }

            // Render the page
            if (this.currentPage && typeof this.currentPage.render === 'function') {
                console.log('🎨 Rendering page:', route);
                container.innerHTML = this.currentPage.render();
                
                // Attach event listeners if the method exists
                if (typeof this.currentPage.attachEvents === 'function') {
                    console.log('🔗 Attaching events for:', route);
                    // Small timeout to ensure DOM is ready
                    setTimeout(() => {
                        this.currentPage.attachEvents();
                    }, 50);
                }
            }

            console.log('✅ Page loaded successfully:', route);

        } catch (error) {
            console.error('❌ Error loading page module:', error);
            throw new Error(`Failed to load ${route} module: ${error.message}`);
        }
    }

    showError(message) {
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            mainContent.innerHTML = `
                <div style="padding: 40px; text-align: center;">
                    <h2 style="color: #dc3545;">Error</h2>
                    <p style="margin-bottom: 20px;">${message}</p>
                    <button onclick="location.reload()" style="
                        background: #667eea;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 6px;
                        cursor: pointer;
                        font-size: 16px;
                        font-weight: 500;
                    ">Reload Page</button>
                </div>
            `;
        }
    }

    // Public method to navigate programmatically
    navigateTo(route) {
        window.location.hash = route;
    }
}

// Service Worker Registration for PWA
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // We'll create sw.js later - for now just log
        console.log('ℹ️ Service Worker support detected - will register when sw.js is available');
        /*
        navigator.serviceWorker.register('/sw.js')
            .then(function(registration) {
                console.log('✅ ServiceWorker registered with scope: ', registration.scope);
            })
            .catch(function(error) {
                console.log('❌ ServiceWorker registration failed: ', error);
            });
        */
    });
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM Content Loaded - Starting NetisTrackGh App');
    window.netisTrackApp = new NetisTrackApp();
});

// Make app available globally for navigation
window.NetisTrackApp = NetisTrackApp;
window.navigateTo = (route) => {
    if (window.netisTrackApp) {
        window.netisTrackApp.navigateTo(route);
    } else {
        window.location.hash = route;
    }
};