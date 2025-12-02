import { showAlert, formatDate, setButtonLoading } from '../utils/helpers.js';
import { authService } from '../services/authService.js';

export class TechnicianDashboard {
    constructor() {
        this.userProfile = null;
        this.sites = [];
        this.activities = [];
        this.alerts = [];
        this.isInitialized = false;
        this.init();
    }

    async init() {
        console.log('🏗️ Technician Dashboard initializing...');
        
        try {
            // Check authentication
            const isAuthenticated = await authService.isAuthenticated();
            if (!isAuthenticated) {
                showAlert('Please login to access dashboard', 'error');
                window.location.hash = 'login';
                return;
            }

            // Load user profile
            this.userProfile = authService.getUserProfile();
            
            // Load dashboard data
            await this.loadDashboardData();
            
            this.isInitialized = true;
            console.log('✅ Technician Dashboard initialized');
            
        } catch (error) {
            console.error('❌ Dashboard initialization failed:', error);
            showAlert('Failed to load dashboard. Please refresh the page.', 'error');
        }
    }

    async loadDashboardData() {
        console.log('📊 Loading dashboard data...');
        
        try {
            // In production, these would be API calls to your backend
            // For now, we'll use mock data
            
            // Load assigned sites
            this.sites = await this.loadAssignedSites();
            
            // Load recent activities
            this.activities = await this.loadRecentActivities();
            
            // Load alerts
            this.alerts = await this.loadAlerts();
            
            console.log('✅ Dashboard data loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            throw error;
        }
    }

    async loadAssignedSites() {
        // Mock data - replace with actual API call
        return [
            {
                id: '600545',
                name: 'Accra Central Tower',
                location: 'Ring Road Central, Accra',
                fuelLevel: 75,
                maintenanceStatus: 'due_soon',
                lastUpdated: '2024-01-15T10:30:00.000Z',
                status: 'active'
            },
            {
                id: '600546',
                name: 'Kumasi North Site',
                location: 'Adum, Kumasi',
                fuelLevel: 45,
                maintenanceStatus: 'overdue',
                lastUpdated: '2024-01-14T14:20:00.000Z',
                status: 'active'
            },
            {
                id: '600547',
                name: 'Tamale Telecom Hub',
                location: 'Tamale Central',
                fuelLevel: 90,
                maintenanceStatus: 'ok',
                lastUpdated: '2024-01-15T08:15:00.000Z',
                status: 'active'
            }
        ];
    }

    async loadRecentActivities() {
        // Mock data - replace with actual API call
        return [
            {
                id: '1',
                type: 'fuel',
                siteId: '600545',
                siteName: 'Accra Central Tower',
                description: 'Fuel refill - 50 liters',
                timestamp: '2024-01-15T10:30:00.000Z',
                user: 'You'
            },
            {
                id: '2',
                type: 'maintenance',
                siteId: '600546',
                siteName: 'Kumasi North Site',
                description: 'Preventive maintenance completed',
                timestamp: '2024-01-14T14:20:00.000Z',
                user: 'You'
            },
            {
                id: '3',
                type: 'site',
                siteId: '600547',
                siteName: 'Tamale Telecom Hub',
                description: 'Site inspection completed',
                timestamp: '2024-01-14T08:15:00.000Z',
                user: 'You'
            }
        ];
    }

    async loadAlerts() {
        // Mock data - replace with actual API call
        return [
            {
                id: '1',
                type: 'warning',
                message: 'Site 600546 - Maintenance overdue by 2 days',
                priority: 'high',
                timestamp: '2024-01-15T09:00:00.000Z'
            },
            {
                id: '2',
                type: 'warning',
                message: 'Site 600545 - Fuel level below 50%',
                priority: 'medium',
                timestamp: '2024-01-14T16:30:00.000Z'
            },
            {
                id: '3',
                type: 'info',
                message: 'New maintenance schedule available',
                priority: 'low',
                timestamp: '2024-01-13T11:15:00.000Z'
            }
        ];
    }

    render() {
        const userName = this.userProfile?.firstName || 'Technician';
        const userRole = this.userProfile?.role || 'technician';
        
        return `
            <div class="dashboard-container">
                <!-- Header -->
                <header class="dashboard-header">
                    <div class="header-content">
                        <!-- Logo Section -->
                        <div class="logo-section">
                            <div class="logo"></div>
                            <h1 class="app-title">NetisTrackGh</h1>
                        </div>

                        <!-- User Section -->
                        <div class="user-section">
                            <button class="notification-btn" id="notificationBtn">
                                <svg width="20" height="20" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z"/>
                                </svg>
                                <span class="notification-badge">${this.alerts.length}</span>
                            </button>
                            
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
                    <!-- Sidebar -->
                    <aside class="dashboard-sidebar">
                        <h3 class="sidebar-title">Navigation</h3>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <a href="#dashboard" class="nav-link active">
                                    <span class="nav-icon">🏠</span>
                                    <span>Dashboard</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#sites" class="nav-link">
                                    <span class="nav-icon">🏢</span>
                                    <span>My Sites</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#fuel" class="nav-link">
                                    <span class="nav-icon">⛽</span>
                                    <span>Fuel Logs</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#maintenance" class="nav-link">
                                    <span class="nav-icon">🔧</span>
                                    <span>Maintenance</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#reports" class="nav-link">
                                    <span class="nav-icon">📊</span>
                                    <span>Reports</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#profile" class="nav-link">
                                    <span class="nav-icon">👤</span>
                                    <span>Profile</span>
                                </a>
                            </li>
                        </ul>
                    </aside>

                    <!-- Main Content Area -->
                    <div class="dashboard-content">
                        <!-- Welcome Banner -->
                        <section class="welcome-banner">
                            <div class="banner-content">
                                <h2 class="welcome-title">Welcome back, ${userName}! 👋</h2>
                                <p class="welcome-subtitle">
                                    Here's what's happening with your sites today
                                </p>
                                
                                <div class="quick-stats">
                                    <div class="stat-item">
                                        <div class="stat-value">${this.sites.length}</div>
                                        <div class="stat-label">Assigned Sites</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${this.alerts.filter(a => a.priority === 'high').length}</div>
                                        <div class="stat-label">Urgent Alerts</div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${this.activities.length}</div>
                                        <div class="stat-label">Today's Activities</div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- Quick Actions -->
                        <section class="quick-actions">
                            <div class="action-card" id="logFuelBtn">
                                <div class="action-icon">⛽</div>
                                <h3 class="action-title">Log Fuel</h3>
                                <p class="action-description">
                                    Record fuel consumption for a site
                                </p>
                            </div>
                            
                            <div class="action-card" id="logMaintenanceBtn">
                                <div class="action-icon">🔧</div>
                                <h3 class="action-title">Log Maintenance</h3>
                                <p class="action-description">
                                    Record maintenance activities
                                </p>
                            </div>
                            
                            <div class="action-card" id="addSiteBtn">
                                <div class="action-icon">🏢</div>
                                <h3 class="action-title">Add Site</h3>
                                <p class="action-description">
                                    Register a new telecom site
                                </p>
                            </div>
                            
                            <div class="action-card" id="syncDataBtn">
                                <div class="action-icon">🔄</div>
                                <h3 class="action-title">Sync Data</h3>
                                <p class="action-description">
                                    Sync offline data with server
                                </p>
                            </div>
                        </section>

                        <!-- Assigned Sites -->
                        <section class="dashboard-section">
                            <div class="section-header">
                                <h3 class="section-title">Assigned Sites</h3>
                                <div class="section-actions">
                                    <button class="view-all-btn">View All</button>
                                </div>
                            </div>
                            
                            <div class="sites-grid">
                                ${this.renderSitesGrid()}
                            </div>
                        </section>

                        <!-- Recent Activities -->
                        <section class="dashboard-section">
                            <div class="section-header">
                                <h3 class="section-title">Recent Activities</h3>
                                <div class="section-actions">
                                    <button class="view-all-btn">View All</button>
                                </div>
                            </div>
                            
                            <div class="activities-list">
                                ${this.renderActivitiesList()}
                            </div>
                        </section>

                        <!-- Alerts -->
                        <section class="dashboard-section">
                            <div class="section-header">
                                <h3 class="section-title">Alerts & Notifications</h3>
                                <div class="section-actions">
                                    <button class="view-all-btn">Mark All Read</button>
                                </div>
                            </div>
                            
                            <div class="alerts-container">
                                ${this.renderAlerts()}
                            </div>
                        </section>
                    </div>
                </main>
            </div>
        `;
    }

    renderSitesGrid() {
        if (this.sites.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🏢</div>
                    <h3 class="empty-title">No Sites Assigned</h3>
                    <p class="empty-description">
                        You haven't been assigned to any sites yet. 
                        Contact your supervisor for site assignments.
                    </p>
                </div>
            `;
        }

        return this.sites.map(site => `
            <div class="site-card" data-site-id="${site.id}">
                <div class="site-card-header">
                    <h4 class="site-name">${site.name}</h4>
                    <span class="status-badge ${site.status}">${site.status}</span>
                </div>
                
                <div class="site-details">
                    <div class="site-id">ID: ${site.id}</div>
                    <div class="site-location">📍 ${site.location}</div>
                    
                    <div class="site-metrics">
                        <div class="metric">
                            <div class="metric-label">Fuel Level</div>
                            <div class="metric-value">
                                <div class="fuel-gauge" data-level="${site.fuelLevel}">
                                    <div class="fuel-bar" style="width: ${site.fuelLevel}%"></div>
                                    <span class="fuel-text">${site.fuelLevel}%</span>
                                </div>
                            </div>
                        </div>
                        
                        <div class="metric">
                            <div class="metric-label">Maintenance</div>
                            <div class="metric-value">
                                ${this.getMaintenanceStatusBadge(site.maintenanceStatus)}
                            </div>
                        </div>
                    </div>
                    
                    <div class="site-footer">
                        <div class="last-updated">
                            Updated: ${formatDate(site.lastUpdated)}
                        </div>
                        <button class="site-action-btn" data-site-id="${site.id}">
                            View Details →
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getMaintenanceStatusBadge(status) {
        const badges = {
            'ok': '<span class="status-badge active">OK</span>',
            'due_soon': '<span class="status-badge warning">Due Soon</span>',
            'overdue': '<span class="status-badge inactive">Overdue</span>',
            'in_progress': '<span class="status-badge maintenance">In Progress</span>'
        };
        
        return badges[status] || '<span class="status-badge">Unknown</span>';
    }

    renderActivitiesList() {
        if (this.activities.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">📋</div>
                    <h3 class="empty-title">No Recent Activities</h3>
                    <p class="empty-description">
                        Your recent activities will appear here once you start working.
                    </p>
                </div>
            `;
        }

        return this.activities.map(activity => `
            <div class="activity-item">
                <div class="activity-icon ${activity.type}">
                    ${this.getActivityIcon(activity.type)}
                </div>
                <div class="activity-details">
                    <div class="activity-title">${activity.siteName}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">
                        ${formatDate(activity.timestamp)} • ${activity.user}
                    </div>
                </div>
            </div>
        `).join('');
    }

    getActivityIcon(type) {
        const icons = {
            'fuel': '⛽',
            'maintenance': '🔧',
            'site': '🏢'
        };
        return icons[type] || '📝';
    }

    renderAlerts() {
        if (this.alerts.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">🔔</div>
                    <h3 class="empty-title">No Alerts</h3>
                    <p class="empty-description">
                        Great! No alerts at the moment.
                    </p>
                </div>
            `;
        }

        return this.alerts.map(alert => `
            <div class="alert-item ${alert.type}">
                <div class="alert-icon">
                    ${alert.priority === 'high' ? '⚠️' : 'ℹ️'}
                </div>
                <div class="alert-message">${alert.message}</div>
                <div class="alert-time">${formatDate(alert.timestamp)}</div>
            </div>
        `).join('');
    }

    attachEvents() {
        console.log('🔗 Attaching dashboard events...');
        
        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                if (confirm('Are you sure you want to logout?')) {
                    await authService.logout();
                }
            });
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', () => {
                this.showNotifications();
            });
        }

        // Quick action buttons
        this.attachQuickActions();
        
        // Site card actions
        this.attachSiteActions();

        console.log('✅ Dashboard events attached successfully');
    }

    attachQuickActions() {
        const quickActions = {
            'logFuelBtn': () => this.showFuelLogForm(),
            'logMaintenanceBtn': () => this.showMaintenanceForm(),
            'addSiteBtn': () => this.showAddSiteForm(),
            'syncDataBtn': () => this.syncOfflineData()
        };

        Object.entries(quickActions).forEach(([btnId, action]) => {
            const button = document.getElementById(btnId);
            if (button) {
                button.addEventListener('click', action);
            }
        });
    }

    attachSiteActions() {
        // Site card click events
        const siteCards = document.querySelectorAll('.site-card');
        siteCards.forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.site-action-btn')) {
                    const siteId = card.dataset.siteId;
                    this.viewSiteDetails(siteId);
                }
            });
        });

        // Site action buttons
        const siteActionBtns = document.querySelectorAll('.site-action-btn');
        siteActionBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const siteId = btn.dataset.siteId;
                this.viewSiteDetails(siteId);
            });
        });
    }

    showFuelLogForm() {
        showAlert('Fuel logging form will be implemented in the next phase', 'info');
        console.log('⛽ Opening fuel log form...');
        // To be implemented
    }

    showMaintenanceForm() {
        showAlert('Maintenance logging form will be implemented in the next phase', 'info');
        console.log('🔧 Opening maintenance form...');
        // To be implemented
    }

    showAddSiteForm() {
        showAlert('Add site form will be implemented in the next phase', 'info');
        console.log('🏢 Opening add site form...');
        // To be implemented
    }

    async syncOfflineData() {
        try {
            const syncBtn = document.getElementById('syncDataBtn');
            setButtonLoading(syncBtn, true, 'Syncing...');
            
            console.log('🔄 Syncing offline data...');
            // To be implemented with offline sync module
            
            await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate sync
            
            showAlert('Data synced successfully!', 'success');
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            showAlert('Sync failed. Please check your connection.', 'error');
        } finally {
            const syncBtn = document.getElementById('syncDataBtn');
            setButtonLoading(syncBtn, false);
        }
    }

    viewSiteDetails(siteId) {
        console.log('🔍 Viewing site details:', siteId);
        showAlert(`Site ${siteId} details will be shown in the next phase`, 'info');
        // To be implemented
    }

    showNotifications() {
        console.log('🔔 Showing notifications...');
        showAlert(`You have ${this.alerts.length} notifications`, 'info');
        // To be implemented
    }

    destroy() {
        console.log('🧹 Cleaning up dashboard...');
        this.isInitialized = false;
        console.log('✅ Dashboard destroyed');
    }
}