import { showAlert } from '../utils/helpers.js';
import { authService } from '../services/authService.js';

export class AnalyticsDashboard {
    constructor() {
        this.userProfile = null;
        this.init();
    }

    async init() {
        console.log('📊 Analytics Dashboard initializing...');
        
        try {
            // Check authentication
            const isAuthenticated = await authService.isAuthenticated();
            if (!isAuthenticated) {
                showAlert('Please login to access analytics', 'error');
                window.location.hash = 'login';
                return;
            }

            // Check if user has permission (supervisor or admin)
            const userRole = authService.getUserRole();
            if (!['supervisor', 'admin'].includes(userRole)) {
                showAlert('You do not have permission to access this page', 'error');
                window.location.hash = 'dashboard';
                return;
            }

            this.userProfile = authService.getUserProfile();
            
            console.log('✅ Analytics Dashboard initialized');
            
        } catch (error) {
            console.error('❌ Analytics Dashboard initialization failed:', error);
            showAlert('Failed to load analytics dashboard.', 'error');
        }
    }

    render() {
        const userName = this.userProfile?.firstName || 'User';
        const userRole = this.userProfile?.role || 'supervisor';
        
        return `
            <div class="dashboard-container">
                <!-- Header -->
                <header class="dashboard-header">
                    <div class="header-content">
                        <!-- Logo Section -->
                        <div class="logo-section">
                            <img src="icons/icon.png" class="logo"/>
                            <h1 class="app-title">NetisTrackGh Analytics</h1>
                        </div>

                        <!-- User Section -->
                        <div class="user-section">
                            <div class="user-info">
                                <div class="user-avatar">${userName.charAt(0).toUpperCase()}</div>
                                <div class="user-details">
                                    <div class="user-name">${userName}</div>
                                    <div class="user-role">${userRole}</div>
                                </div>
                            </div>
                            
                            <button class="logout-btn" id="logoutBtn" title="Logout">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                    <path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="dashboard-main">
                    <!-- Analytics Content -->
                    <div class="dashboard-content">
                        <div class="welcome-banner">
                            <div class="banner-content">
                                <h2 class="welcome-title">Analytics Dashboard</h2>
                                <p class="welcome-subtitle">
                                    Welcome to the supervisor/admin analytics panel
                                </p>
                            </div>
                        </div>

                        <div style="padding: 40px; text-align: center; background: white; border-radius: 16px; margin-top: 24px;">
                            <h3>🚧 Analytics Dashboard Under Development</h3>
                            <p style="margin: 20px 0; color: #666;">
                                The full analytics dashboard with charts, reports, and user management 
                                will be implemented in the next phase.
                            </p>
                            
                            <div style="display: flex; gap: 16px; justify-content: center; margin-top: 30px;">
                                <button onclick="window.location.hash='dashboard'" style="
                                    background: #667eea;
                                    color: white;
                                    border: none;
                                    padding: 12px 24px;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-weight: 500;
                                ">
                                    ← Go to Technician Dashboard
                                </button>
                                
                                <button onclick="authService.logout()" style="
                                    background: #e53e3e;
                                    color: white;
                                    border: none;
                                    padding: 12px 24px;
                                    border-radius: 8px;
                                    cursor: pointer;
                                    font-weight: 500;
                                ">
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        `;
    }

    attachEvents() {
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to logout?')) {
                    await authService.logout();
                }
            });
        }
    }

    destroy() {
        console.log('🧹 Cleaning up analytics dashboard...');
    }
}