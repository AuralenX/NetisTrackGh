import { showAlert, formatDate, setButtonLoading } from '../utils/helpers.js';
import { authService } from '../services/authService.js';
import { SiteCard } from '../../components/site-card.js';
import { MaintenanceAlert } from '../../components/maintenance-alert.js';
import { Modal } from '../../components/modal.js';

export class TechnicianDashboard {
    constructor() {
        this.userProfile = null;
        this.sites = [];
        this.siteComponents = []; // Store site card components
        this.activities = [];
        this.alertComponents = []; // Store alert components
        this.alerts = [];
        this.isInitialized = false;
        this.isSidebarOpen = false;
        this.isSettingsOpen = false;
        this.eventHandlers = {};
        this.quickActionHandlers = {};
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
                status: 'active',
                generatorHours: 1500,
                batteryLevel: 85,
                solarStatus: 'active'
            },
            {
                id: '600546',
                name: 'Kumasi North Site',
                location: 'Adum, Kumasi',
                fuelLevel: 45,
                maintenanceStatus: 'overdue',
                lastUpdated: '2024-01-14T14:20:00.000Z',
                status: 'active',
                generatorHours: 3200,
                batteryLevel: 60,
                solarStatus: 'inactive'
            },
            {
                id: '600547',
                name: 'Tamale Telecom Hub',
                location: 'Tamale Central',
                fuelLevel: 90,
                maintenanceStatus: 'ok',
                lastUpdated: '2024-01-15T08:15:00.000Z',
                status: 'active',
                generatorHours: 800,
                batteryLevel: 95,
                solarStatus: 'active'
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
                siteId: '600546',
                siteName: 'Kumasi North Site',
                alertType: 'maintenance',
                severity: 'high',
                message: 'Maintenance overdue by 2 days. Immediate action required.',
                dueDate: '2024-01-12T00:00:00.000Z',
                remainingHours: -48,
                maintenanceType: 'preventive',
                createdAt: '2024-01-15T09:00:00.000Z',
                acknowledged: false
            },
            {
                id: '2',
                siteId: '600545',
                siteName: 'Accra Central Tower',
                alertType: 'fuel',
                severity: 'medium',
                message: 'Fuel level below 50%. Schedule refueling soon.',
                dueDate: '2024-01-18T00:00:00.000Z',
                remainingHours: 72,
                maintenanceType: 'routine',
                createdAt: '2024-01-14T16:30:00.000Z',
                acknowledged: false
            },
            {
                id: '3',
                siteId: '600547',
                siteName: 'Tamale Telecom Hub',
                alertType: 'info',
                severity: 'low',
                message: 'Monthly preventive maintenance due in 7 days',
                dueDate: '2024-01-22T00:00:00.000Z',
                remainingHours: 168,
                maintenanceType: 'preventive',
                createdAt: '2024-01-13T11:15:00.000Z',
                acknowledged: true
            }
        ];
    }

    render() {
        const userName = this.userProfile?.firstName || 'Technician';
        const userRole = this.userProfile?.role || 'technician';
        const userInitial = userName.charAt(0).toUpperCase();
        const unreadAlertsCount = this.alerts.filter(a => !a.acknowledged).length;
        const urgentAlertsCount = this.alerts.filter(a => a.severity === 'high' && !a.acknowledged).length;
        
        return `
            <div class="dashboard-container">
                <!-- Header -->
                <header class="dashboard-header">
                    <div class="header-content">
                        <!-- Logo Section -->
                        <div class="logo-section">
                            <img src="icons/icon.png" class="logo" alt="NetisTrackGH logo" />
                            <h1 class="app-title">NetisTrackGh</h1>
                        </div>

                        <!-- User Section -->
                        <div class="user-section">
                            <button class="action-btn notification-btn" id="notificationBtn" title="Notifications">
                                <i class="fas fa-bell"></i>
                                ${unreadAlertsCount > 0 ? 
                                    `<span class="notification-badge">${unreadAlertsCount}</span>` : ''}
                            </button>

                            <button class="action-btn menu-btn" id="menuBtn" title="Menu">
                                <i class="fas fa-bars"></i>
                            </button>
                            
                            <div class="user-info" id="userInfo">
                                <div class="user-avatar">
                                    ${userInitial}
                                </div>
                                <div class="user-details">
                                    <div class="user-name">${userName}</div>
                                    <div class="user-role">${userRole}</div>
                                </div>
                                <button class="settings-toggle" id="settingsToggle">
                                    <i class="fas fa-chevron-down"></i>
                                </button>
                            </div>
                            
                            <!-- Settings Dropdown -->
                            <div class="settings-dropdown" id="settingsDropdown">
                                <div class="dropdown-header">
                                    <div class="dropdown-user">
                                        <div class="dropdown-avatar">${userInitial}</div>
                                        <div class="dropdown-user-info">
                                            <div class="dropdown-name">${userName}</div>
                                            <div class="dropdown-email">${this.userProfile?.email || 'user@mail.com'}</div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="dropdown-menu">
                                    <a href="#profile" class="dropdown-item">
                                        <i class="fas fa-user-circle"></i>
                                        <span>Profile</span>
                                    </a>
                                    
                                    <a href="#settings" class="dropdown-item">
                                        <i class="fas fa-cog"></i>
                                        <span>Settings</span>
                                    </a>
                                    
                                    <a href="#help" class="dropdown-item">
                                        <i class="fas fa-question-circle"></i>
                                        <span>Help & Support</span>
                                    </a>
                                    
                                    <div class="dropdown-divider"></div>
                                    
                                    <button class="dropdown-item logout-item" id="dropdownLogoutBtn">
                                        <i class="fas fa-sign-out-alt"></i>
                                        <span>Logout</span>
                                    </button>
                                    
                                    <div class="dropdown-footer">
                                        <div class="app-version">v1.0.0</div>
                                        <div class="user-role-badge">${userRole}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                <!-- Main Content -->
                <main class="dashboard-main">
                    <!-- Sidebar -->
                    <aside class="dashboard-sidebar" id="dashboardSidebar">
                        <div class="sidebar-header">
                            <h3 class="sidebar-title">Navigation</h3>
                            <button class="close-sidebar-btn" id="closeSidebarBtn" title="Close Menu">
                                <i class="fas fa-xmark"></i>
                            </button>
                        </div>
                        <ul class="nav-menu">
                            <li class="nav-item">
                                <a href="#dashboard" class="nav-link active">
                                    <i class="fas fa-tachometer-alt nav-icon"></i>
                                    <span>Dashboard</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#sites" class="nav-link">
                                    <i class="fas fa-tower-cell nav-icon"></i>
                                    <span>My Sites</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#fuel" class="nav-link">
                                    <i class="fas fa-gas-pump nav-icon"></i>
                                    <span>Fuel Logs</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#maintenance" class="nav-link">
                                    <i class="fas fa-tools nav-icon"></i>
                                    <span>Maintenance</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#reports" class="nav-link">
                                    <i class="fas fa-chart-bar nav-icon"></i>
                                    <span>Reports</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#profile" class="nav-link">
                                    <i class="fas fa-user-circle nav-icon"></i>
                                    <span>Profile</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#settings" class="nav-link">
                                    <i class="fas fa-cog nav-icon"></i>
                                    <span>Settings</span>
                                </a>
                            </li>
                        </ul>
                        
                        <!-- Mobile-only navigation items -->
                        <div class="mobile-nav-extras">
                            <div class="sidebar-divider"></div>
                            <ul class="nav-menu mobile-only">
                                <li class="nav-item">
                                    <a href="#help" class="nav-link">
                                        <i class="fas fa-question-circle nav-icon"></i>
                                        <span>Help & Support</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#about" class="nav-link">
                                        <i class="fas fa-info-circle nav-icon"></i>
                                        <span>About</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <button class="nav-link logout-nav" id="sidebarLogoutBtn">
                                        <i class="fas fa-sign-out-alt nav-icon"></i>
                                        <span>Logout</span>
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </aside>

                    <!-- Overlay for mobile sidebar -->
                    <div class="sidebar-overlay" id="sidebarOverlay"></div>

                    <!-- Main Content Area -->
                    <div class="dashboard-content">
                        <!-- Welcome Banner -->
                        <section class="welcome-banner">
                            <div class="banner-content">
                                <h2 class="welcome-title">Welcome back, ${userName}! <i class="fas fa-hand-wave"></i></h2>
                                <p class="welcome-subtitle">
                                    Here's what's happening with your sites today
                                </p>
                                
                                <div class="quick-stats">
                                    <div class="stat-item">
                                        <div class="stat-value">${this.sites.length}</div>
                                        <div class="stat-label">
                                            <i class="fas fa-tower-cell"></i> Assigned Sites
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${urgentAlertsCount}</div>
                                        <div class="stat-label">
                                            <i class="fas fa-exclamation-triangle"></i> Urgent Alerts
                                        </div>
                                    </div>
                                    <div class="stat-item">
                                        <div class="stat-value">${this.activities.length}</div>
                                        <div class="stat-label">
                                            <i class="fas fa-tasks"></i> Today's Activities
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- Quick Actions -->
                        <section class="quick-actions">
                            <div class="action-card" id="logFuelBtn">
                                <div class="action-icon">
                                    <i class="fas fa-gas-pump"></i>
                                </div>
                                <h3 class="action-title">Log Fuel</h3>
                                <p class="action-description">
                                    Record fuel consumption for a site
                                </p>
                            </div>
                            
                            <div class="action-card" id="logMaintenanceBtn">
                                <div class="action-icon">
                                    <i class="fas fa-tools"></i>
                                </div>
                                <h3 class="action-title">Log Maintenance</h3>
                                <p class="action-description">
                                    Record maintenance activities
                                </p>
                            </div>
                            
                            <div class="action-card" id="addSiteBtn">
                                <div class="action-icon">
                                    <i class="fas fa-plus-circle"></i>
                                </div>
                                <h3 class="action-title">Add Site</h3>
                                <p class="action-description">
                                    Register a new telecom site
                                </p>
                            </div>
                            
                            <div class="action-card" id="syncDataBtn">
                                <div class="action-icon">
                                    <i class="fas fa-sync-alt"></i>
                                </div>
                                <h3 class="action-title">Sync Data</h3>
                                <p class="action-description">
                                    Sync offline data with server
                                </p>
                            </div>
                        </section>

                        <!-- Assigned Sites -->
                        <section class="dashboard-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="fas fa-tower-cell"></i> Assigned Sites
                                </h3>
                                <div class="section-actions">
                                    <button class="view-all-btn" id="viewAllSitesBtn">
                                        <i class="fas fa-list"></i> View All
                                    </button>
                                </div>
                            </div>
                            
                            <div class="sites-grid" id="sitesGridContainer">
                                ${this.renderSitesGrid()}
                            </div>
                        </section>

                        <!-- Recent Activities -->
                        <section class="dashboard-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="fas fa-history"></i> Recent Activities
                                </h3>
                                <div class="section-actions">
                                    <button class="view-all-btn" id="viewAllActivitiesBtn">
                                        <i class="fas fa-list"></i> View All
                                    </button>
                                </div>
                            </div>
                            
                            <div class="activities-list">
                                ${this.renderActivitiesList()}
                            </div>
                        </section>

                        <!-- Alerts -->
                        <section class="dashboard-section">
                            <div class="section-header">
                                <h3 class="section-title">
                                    <i class="fas fa-bell"></i> Alerts & Notifications
                                </h3>
                                <div class="section-actions">
                                    <button class="view-all-btn" id="markAllReadBtn">
                                        <i class="fas fa-check-double"></i> Mark All Read
                                    </button>
                                </div>
                            </div>
                            
                            <div class="alerts-container" id="alertsContainer">
                                ${this.renderAlerts()}
                            </div>
                        </section>
                    </div>
                </main>
                
                <!-- Settings Overlay -->
                <div class="settings-overlay" id="settingsOverlay"></div>
            </div>
        `;
    }

    renderSitesGrid() {
        if (this.sites.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-tower-cell"></i></div>
                    <h3 class="empty-title">No Sites Assigned</h3>
                    <p class="empty-description">
                        You haven't been assigned to any sites yet. 
                        Contact your supervisor for site assignments.
                    </p>
                    <button class="add-site-btn" id="emptyStateAddSiteBtn">
                        <i class="fas fa-plus-circle"></i> Add Your First Site
                    </button>
                </div>
            `;
        }

        // Return container HTML - SiteCard components will render after DOM is ready
        return this.sites.map(site => 
            `<div id="site-card-${site.id}" class="site-card-container"></div>`
        ).join('');
    }

    renderActivitiesList() {
        if (this.activities.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-tasks"></i></div>
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
                    <i class="fas ${this.getActivityIcon(activity.type)}"></i>
                </div>
                <div class="activity-details">
                    <div class="activity-title">${activity.siteName}</div>
                    <div class="activity-description">${activity.description}</div>
                    <div class="activity-time">
                        <i class="fas fa-clock"></i> ${formatDate(activity.timestamp)} • ${activity.user}
                    </div>
                </div>
            </div>
        `).join('');
    }

    renderAlerts() {
        if (this.alerts.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-bell"></i></div>
                    <h3 class="empty-title">No Alerts</h3>
                    <p class="empty-description">
                        Great! No alerts at the moment.
                    </p>
                </div>
            `;
        }

        // Return container HTML - MaintenanceAlert components will render after DOM is ready
        return this.alerts.map(alert => 
            `<div id="alert-${alert.id}" class="alert-container"></div>`
        ).join('');
    }

    // ===== COMPONENT MANAGEMENT =====
    
    renderComponents() {
        console.log('🎨 Rendering components...');
        
        // Clear previous components
        this.cleanupComponents();
        
        // Render Site Cards
        this.sites.forEach(site => {
            const container = document.getElementById(`site-card-${site.id}`);
            if (container) {
                const siteCard = new SiteCard(site);
                container.innerHTML = siteCard.render();
                siteCard.attachEvents();
                this.siteComponents.push(siteCard);
                this.setupSiteCardEvents(siteCard, site.id);
            }
        });
        
        // Render Maintenance Alerts
        this.alerts.forEach(alert => {
            const container = document.getElementById(`alert-${alert.id}`);
            if (container) {
                const maintenanceAlert = new MaintenanceAlert(alert);
                container.innerHTML = maintenanceAlert.render();
                maintenanceAlert.attachEvents();
                this.alertComponents.push(maintenanceAlert);
                this.setupAlertEvents(maintenanceAlert, alert.id);
            }
        });
    }

    setupSiteCardEvents(siteCard, siteId) {
        // Listen for custom events from site card
        window.addEventListener('siteViewDetails', (e) => {
            if (e.detail.siteId === siteId) {
                this.viewSiteDetails(siteId);
            }
        });
        
        window.addEventListener('siteLogFuel', (e) => {
            if (e.detail.siteId === siteId) {
                this.showFuelLogFormForSite(e.detail.siteId, e.detail.siteName);
            }
        });
        
        window.addEventListener('siteLogMaintenance', (e) => {
            if (e.detail.siteId === siteId) {
                this.showMaintenanceFormForSite(e.detail.siteId, e.detail.siteName);
            }
        });
    }

    setupAlertEvents(alertComponent, alertId) {
        // Listen for custom events from alert component
        window.addEventListener('maintenanceAlertAcknowledge', (e) => {
            if (e.detail.alertId === alertId) {
                this.acknowledgeAlert(alertId);
            }
        });
        
        window.addEventListener('maintenanceAlertSchedule', (e) => {
            if (e.detail.alertId === alertId) {
                this.scheduleMaintenance(e.detail.siteId, e.detail.siteName);
            }
        });
        
        window.addEventListener('maintenanceAlertLog', (e) => {
            if (e.detail.alertId === alertId) {
                this.showMaintenanceFormForSite(e.detail.siteId, e.detail.siteName);
            }
        });
        
        window.addEventListener('maintenanceAlertViewSite', (e) => {
            if (e.detail.alertId === alertId) {
                this.viewSiteDetails(e.detail.siteId);
            }
        });
    }

    getActivityIcon(type) {
        const icons = {
            'fuel': 'fa-gas-pump',
            'maintenance': 'fa-tools',
            'site': 'fa-tower-cell'
        };
        return icons[type] || 'fa-clipboard-list';
    }

    // ===== EVENT HANDLING =====
    
    attachEvents() {
    console.log('🔗 Attaching dashboard events...');
    
    // Remove any existing event listeners
    this.removeEventListeners();
    
    // Mobile sidebar controls
    this.attachEvent('menuBtn', () => this.toggleSidebar());
    this.attachEvent('closeSidebarBtn', () => this.closeSidebar());
    this.attachEvent('sidebarOverlay', () => this.closeSidebar());
    
    // Settings dropdown
    this.attachEvent('userInfo', (e) => this.toggleSettingsDropdown(e));
    this.attachEvent('settingsToggle', (e) => {
        e.stopPropagation();
        this.toggleSettingsDropdown();
    });
    this.attachEvent('settingsOverlay', () => this.closeSettingsDropdown());
    
    // Logout handlers
    this.attachEvent('dropdownLogoutBtn', async (e) => {
        e.stopPropagation();
        this.closeSettingsDropdown();
        await this.handleLogout();
    });
    this.attachEvent('sidebarLogoutBtn', async (e) => {
        e.stopPropagation();
        this.closeSidebar();
        await this.handleLogout();
    });
    
    // Notification and navigation
    this.attachEvent('notificationBtn', () => this.showNotifications());
    this.attachEvent('viewAllSitesBtn', () => this.showAllSites());
    this.attachEvent('viewAllActivitiesBtn', () => this.showAllActivities());
    this.attachEvent('markAllReadBtn', () => this.markAllAlertsRead());
    this.attachEvent('emptyStateAddSiteBtn', () => this.showAddSiteForm());
    
    // Close settings dropdown when clicking outside
    this.eventHandlers.closeSettingsOnClickOutside = (e) => this.handleClickOutsideSettings(e);
    document.addEventListener('click', this.eventHandlers.closeSettingsOnClickOutside);
    
    // Quick action buttons - USE ARROW FUNCTIONS HERE
    this.attachQuickActions();
    
    // Render components after DOM is ready
    setTimeout(() => this.renderComponents(), 100);

    console.log('✅ Dashboard events attached successfully');
}

attachQuickActions() {
    const quickActions = {
        'logFuelBtn': () => this.showFuelLogForm(),
        'logMaintenanceBtn': () => this.showMaintenanceForm(),
        'addSiteBtn': () => this.showAddSiteForm(),
        'syncDataBtn': () => this.syncOfflineData()
    };

    Object.entries(quickActions).forEach(([btnId, handler]) => {
        const button = document.getElementById(btnId);
        if (button) {
            this.quickActionHandlers[btnId] = handler;
            button.addEventListener('click', handler);
        }
    });
}

    attachEvent(elementId, handler) {
    const element = document.getElementById(elementId);
    if (element) {
        // Ensure handler is properly bound
        const boundHandler = handler.bind ? handler : handler; // handler should already be an arrow function
        this.eventHandlers[elementId] = boundHandler;
        element.addEventListener('click', boundHandler);
    }
}

    toggleSettingsDropdown(e) {
        if (e) e.stopPropagation();
        
        const settingsDropdown = document.getElementById('settingsDropdown');
        if (settingsDropdown?.classList.contains('show')) {
            this.closeSettingsDropdown();
        } else {
            this.openSettingsDropdown();
        }
    }

    openSettingsDropdown() {
        const settingsDropdown = document.getElementById('settingsDropdown');
        const settingsOverlay = document.getElementById('settingsOverlay');
        
        if (settingsDropdown) settingsDropdown.classList.add('show');
        if (settingsOverlay) settingsOverlay.classList.add('active');
        
        this.isSettingsOpen = true;
    }

    closeSettingsDropdown() {
        const settingsDropdown = document.getElementById('settingsDropdown');
        const settingsOverlay = document.getElementById('settingsOverlay');
        
        if (settingsDropdown) settingsDropdown.classList.remove('show');
        if (settingsOverlay) settingsOverlay.classList.remove('active');
        
        this.isSettingsOpen = false;
    }

    handleClickOutsideSettings(e) {
        const settingsDropdown = document.getElementById('settingsDropdown');
        const userInfo = document.getElementById('userInfo');
        const settingsToggle = document.getElementById('settingsToggle');
        
        if (settingsDropdown?.classList.contains('show')) {
            if (!settingsDropdown.contains(e.target) && 
                !userInfo?.contains(e.target) && 
                !settingsToggle?.contains(e.target)) {
                this.closeSettingsDropdown();
            }
        }
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await authService.logout();
            } catch (error) {
                console.error('Logout failed:', error);
                showAlert('Logout failed. Please try again.', 'error');
            }
        }
    }

    removeEventListeners() {
        // Remove all event listeners
        Object.entries(this.eventHandlers).forEach(([key, handler]) => {
            if (key === 'closeSettingsOnClickOutside') {
                document.removeEventListener('click', handler);
            } else {
                const element = document.getElementById(key);
                if (element && handler) {
                    element.removeEventListener('click', handler);
                }
            }
        });
        
        // Clear quick action handlers
        this.removeQuickActionListeners();
        
        // Clear component listeners
        this.cleanupComponents();
        
        this.eventHandlers = {};
    }

    cleanupComponents() {
        // Clean up site card components
        this.siteComponents.forEach(siteCard => {
            if (siteCard?.destroy) siteCard.destroy();
        });
        this.siteComponents = [];
        
        // Clean up alert components
        this.alertComponents.forEach(alert => {
            if (alert?.destroy) alert.destroy();
        });
        this.alertComponents = [];
    }

    // attachQuickActions() {
    //     const quickActions = {
    //         'logFuelBtn': () => this.showFuelLogForm(),
    //         'logMaintenanceBtn': () => this.showMaintenanceForm(),
    //         'addSiteBtn': () => this.showAddSiteForm(),
    //         'syncDataBtn': () => this.syncOfflineData()
    //     };

    //     Object.entries(quickActions).forEach(([btnId, handler]) => {
    //         const button = document.getElementById(btnId);
    //         if (button) {
    //             this.quickActionHandlers[btnId] = handler;
    //             button.addEventListener('click', handler);
    //         }
    //     });
    // }

    removeQuickActionListeners() {
        Object.entries(this.quickActionHandlers).forEach(([btnId, handler]) => {
            const button = document.getElementById(btnId);
            if (button && handler) {
                button.removeEventListener('click', handler);
            }
        });
        this.quickActionHandlers = {};
    }

    // ===== SIDEBAR METHODS =====
    
    toggleSidebar() {
        this.isSidebarOpen ? this.closeSidebar() : this.openSidebar();
    }

    openSidebar() {
        const sidebar = document.getElementById('dashboardSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.add('open');
            sidebar.style.transform = 'translateX(0)';
        }
        
        if (overlay) {
            overlay.classList.add('active');
            overlay.style.display = 'block';
        }
        
        this.isSidebarOpen = true;
    }

    closeSidebar() {
        const sidebar = document.getElementById('dashboardSidebar');
        const overlay = document.getElementById('sidebarOverlay');
        
        if (sidebar) {
            sidebar.classList.remove('open');
            sidebar.style.transform = 'translateX(-100%)';
        }
        
        if (overlay) {
            overlay.classList.remove('active');
            overlay.style.display = 'none';
        }
        
        this.isSidebarOpen = false;
    }

    // ===== NAVIGATION METHODS =====
    
    showAllSites() {
        showAlert('Showing all sites...', 'info');
        console.log('📋 Showing all sites');
    }

    showAllActivities() {
        showAlert('Showing all activities...', 'info');
        console.log('📋 Showing all activities');
    }

    markAllAlertsRead() {
        this.alerts.forEach(alert => alert.acknowledged = true);
        
        this.alertComponents.forEach(alertComponent => {
            if (alertComponent.updateData) {
                alertComponent.updateData({ acknowledged: true });
            }
        });
        
        showAlert('All alerts marked as read', 'success');
        console.log('✅ Marking all alerts as read');
    }

    // ===== MODAL METHODS =====
    
    showFuelLogFormForSite(siteId, siteName) {
        console.log(`⛽ Logging fuel for site: ${siteId} - ${siteName}`);
        this.showFuelLogModal(siteId, siteName);
    }

    showMaintenanceFormForSite(siteId, siteName) {
        console.log(`🔧 Logging maintenance for site: ${siteId} - ${siteName}`);
        this.showMaintenanceModal(siteId, siteName);
    }

    viewSiteDetails(siteId) {
        console.log(`🔍 Viewing details for site: ${siteId}`);
        showAlert(`Site ${siteId} details will be shown in the next phase`, 'info');
    }

    // Alert Actions
    acknowledgeAlert(alertId) {
        console.log(`✅ Acknowledging alert: ${alertId}`);
        
        const alertIndex = this.alerts.findIndex(a => a.id === alertId);
        if (alertIndex !== -1) {
            this.alerts[alertIndex].acknowledged = true;
            
            const alertComponent = this.alertComponents.find(ac => ac.alertData.id === alertId);
            if (alertComponent?.updateData) {
                alertComponent.updateData({ acknowledged: true });
            }
            
            showAlert('Alert acknowledged successfully', 'success');
        }
    }

    scheduleMaintenance(siteId, siteName) {
        console.log(`📅 Scheduling maintenance for site: ${siteId} - ${siteName}`);
        this.showMaintenanceSchedulerModal(siteId, siteName);
    }

    showFuelLogModal(siteId = null, siteName = '') {
        if (!siteId) {
            this.showFuelLogForm();
            return;
        }

        const modal = this.createFuelLogModal(siteId, siteName);
        modal.open();
    }

    createFuelLogModal(siteId, siteName) {
        return new Modal({
            id: 'fuelLogModal',
            title: `<i class="fas fa-gas-pump"></i> Log Fuel Refill`,
            content: this.getFuelLogFormHTML(siteId, siteName),
            size: 'md',
            confirmText: 'Log Fuel',
            cancelText: 'Cancel',
            confirmButtonClass: 'btn-primary',
            onConfirm: () => this.submitFuelLog(modal, siteId)
        });
    }

    getFuelLogFormHTML(siteId, siteName) {
        const currentDateTime = new Date().toISOString().slice(0, 16);
        
        return `
            <form id="fuelLogForm" data-site-id="${siteId}">
                <div class="modal-form-group">
                    <div class="modal-form-row">
                        <div class="site-info">
                            <div class="modal-form-label">Site</div>
                            <div class="site-display">
                                <strong>${siteName}</strong> (ID: ${siteId})
                            </div>
                        </div>
                        <div>
                            <label class="modal-form-label" for="fuelDate">
                                <i class="far fa-calendar"></i> Date & Time
                            </label>
                            <input type="datetime-local" 
                                   id="fuelDate" 
                                   class="modal-form-input"
                                   value="${currentDateTime}"
                                   required>
                        </div>
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="fuelAmount">
                        <i class="fas fa-oil-can"></i> Fuel Amount (Liters)
                    </label>
                    <input type="number" 
                           id="fuelAmount" 
                           class="modal-form-input" 
                           min="1" 
                           max="10000" 
                           step="0.1"
                           placeholder="Enter amount in liters"
                           required>
                    <div class="modal-form-helper">
                        Typical diesel generator consumption: 3-5 L/hour
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="fuelType">
                        <i class="fas fa-gas-pump"></i> Fuel Type
                    </label>
                    <select id="fuelType" class="modal-form-select" required>
                        <option value="">Select fuel type</option>
                        <option value="diesel" selected>Diesel</option>
                        <option value="petrol">Petrol/Gasoline</option>
                        <option value="hybrid">Hybrid (Solar + Generator)</option>
                    </select>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="fuelSupplier">
                        <i class="fas fa-truck"></i> Fuel Supplier
                    </label>
                    <input type="text" 
                           id="fuelSupplier" 
                           class="modal-form-input" 
                           placeholder="Enter supplier name">
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="meterReading">
                        <i class="fas fa-tachometer-alt"></i> Generator Meter Reading (Hours)
                    </label>
                    <input type="number" 
                           id="meterReading" 
                           class="modal-form-input" 
                           min="0"
                           step="0.1"
                           placeholder="Current generator hours">
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="cost">
                        <i class="fas fa-money-bill-wave"></i> Cost (GHS)
                    </label>
                    <input type="number" 
                           id="cost" 
                           class="modal-form-input" 
                           min="0"
                           step="0.01"
                           placeholder="Enter cost in Ghana Cedis">
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="notes">
                        <i class="far fa-sticky-note"></i> Notes
                    </label>
                    <textarea id="notes" 
                              class="modal-form-textarea" 
                              placeholder="Add any additional notes about this refill..."
                              rows="3"></textarea>
                </div>

                <div class="form-errors" id="fuelFormErrors"></div>
            </form>
        `;
    }

    async submitFuelLog(modal, siteId) {
        const form = document.getElementById('fuelLogForm');
        if (!form) return;

        const formData = this.getFormData(form);
        const errors = this.validateFuelLog(formData);

        if (errors.length > 0) {
            this.showFormErrors('fuelFormErrors', errors);
            return;
        }

        try {
            modal.setLoading(true, 'Logging fuel...');
            
            const response = await fetch('/api/fuel', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to log fuel');
            }

            await response.json();
            
            showAlert('✅ Fuel logged successfully!', 'success');
            
            this.updateSiteAfterFuelLog(siteId, formData);
            this.addActivity('fuel', siteId, `Fuel refill - ${formData.fuelAmount} liters`);
            
            this.updateActivitiesList();
        } catch (error) {
            console.error('Fuel log error:', error);
            showAlert('❌ Failed to log fuel. Please try again.', 'error');
        } finally {
            modal.setLoading(false);
        }
    }

    getFormData(form) {
        return {
            siteId: form.dataset.siteId,
            fuelDate: document.getElementById('fuelDate').value,
            fuelAmount: parseFloat(document.getElementById('fuelAmount').value),
            fuelType: document.getElementById('fuelType').value,
            fuelSupplier: document.getElementById('fuelSupplier').value,
            meterReading: document.getElementById('meterReading').value ? 
                         parseFloat(document.getElementById('meterReading').value) : null,
            cost: document.getElementById('cost').value ? 
                  parseFloat(document.getElementById('cost').value) : null,
            notes: document.getElementById('notes').value,
            loggedBy: this.userProfile?.id || 'technician',
            timestamp: new Date().toISOString()
        };
    }

    validateFuelLog(formData) {
        const errors = [];
        if (!formData.fuelAmount || formData.fuelAmount <= 0) {
            errors.push('Please enter a valid fuel amount');
        }
        if (!formData.fuelType) {
            errors.push('Please select fuel type');
        }
        if (!formData.fuelDate) {
            errors.push('Please select date and time');
        }
        return errors;
    }

    showFormErrors(elementId, errors) {
        const errorDiv = document.getElementById(elementId);
        if (errorDiv) {
            errorDiv.innerHTML = errors.map(e => `<div>• ${e}</div>`).join('');
            errorDiv.style.display = 'block';
        }
    }

    updateSiteAfterFuelLog(siteId, formData) {
        const siteIndex = this.sites.findIndex(s => s.id === siteId);
        if (siteIndex !== -1) {
            this.sites[siteIndex].fuelLevel = Math.min(100, 
                this.sites[siteIndex].fuelLevel + Math.floor(formData.fuelAmount / 10));
            this.sites[siteIndex].lastUpdated = new Date().toISOString();
            
            const siteComponent = this.siteComponents.find(sc => sc.siteData.id === siteId);
            if (siteComponent?.updateData) {
                siteComponent.updateData({
                    fuelLevel: this.sites[siteIndex].fuelLevel,
                    lastUpdated: this.sites[siteIndex].lastUpdated
                });
            }
        }
    }

    addActivity(type, siteId, description) {
        const site = this.sites.find(s => s.id === siteId);
        this.activities.unshift({
            id: `activity-${Date.now()}`,
            type,
            siteId,
            siteName: site?.name || 'Unknown Site',
            description,
            timestamp: new Date().toISOString(),
            user: 'You'
        });
    }

    showFuelLogForm() {
        if (this.sites.length === 0) {
            showAlert('No sites available to log fuel', 'warning');
            return;
        }

        const sitesOptions = this.sites.map(site => 
            `<option value="${site.id}">${site.name} (Fuel: ${site.fuelLevel}%)</option>`
        ).join('');

        const modal = new Modal({
            id: 'fuelSiteSelector',
            title: '<i class="fas fa-gas-pump"></i> Select Site for Fuel Log',
            content: `
                <div class="modal-form-group">
                    <label class="modal-form-label" for="selectSite">
                        <i class="fas fa-tower-cell"></i> Select Site
                    </label>
                    <select id="selectSite" class="modal-form-select" required>
                        <option value="">Choose a site...</option>
                        ${sitesOptions}
                    </select>
                </div>
            `,
            size: 'sm',
            confirmText: 'Continue',
            cancelText: 'Cancel',
            onConfirm: () => {
                const selectedSite = document.getElementById('selectSite').value;
                if (!selectedSite) {
                    showAlert('Please select a site', 'warning');
                    return;
                }
                
                const site = this.sites.find(s => s.id === selectedSite);
                if (site) {
                    modal.close();
                    setTimeout(() => this.showFuelLogModal(site.id, site.name), 300);
                }
            }
        });

        modal.open();
    }

    showMaintenanceModal(siteId = null, siteName = '') {
        if (!siteId) {
            this.showMaintenanceForm();
            return;
        }

        const modal = new Modal({
            id: 'maintenanceLogModal',
            title: `<i class="fas fa-tools"></i> Log Maintenance`,
            content: this.getMaintenanceLogFormHTML(siteId, siteName),
            size: 'lg',
            confirmText: 'Log Maintenance',
            cancelText: 'Cancel',
            confirmButtonClass: 'btn-primary',
            onConfirm: () => this.submitMaintenanceLog(modal, siteId)
        });

        modal.open();
    }

    getMaintenanceLogFormHTML(siteId, siteName) {
        const currentDateTime = new Date().toISOString().slice(0, 16);
        const userName = `${this.userProfile?.firstName || ''} ${this.userProfile?.lastName || ''}`.trim();
        
        return `
            <form id="maintenanceLogForm" data-site-id="${siteId}">
                <div class="modal-form-group">
                    <div class="modal-form-row">
                        <div class="site-info">
                            <div class="modal-form-label">Site</div>
                            <div class="site-display">
                                <strong>${siteName}</strong> (ID: ${siteId})
                            </div>
                        </div>
                        <div>
                            <label class="modal-form-label" for="maintenanceDate">
                                <i class="far fa-calendar"></i> Date & Time
                            </label>
                            <input type="datetime-local" 
                                   id="maintenanceDate" 
                                   class="modal-form-input"
                                   value="${currentDateTime}"
                                   required>
                        </div>
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="maintenanceType">
                        <i class="fas fa-cog"></i> Maintenance Type
                    </label>
                    <select id="maintenanceType" class="modal-form-select" required>
                        <option value="">Select type</option>
                        <option value="preventive">Preventive Maintenance</option>
                        <option value="corrective">Corrective Maintenance</option>
                        <option value="emergency">Emergency Repair</option>
                        <option value="routine">Routine Check</option>
                        <option value="inspection">Site Inspection</option>
                    </select>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="description">
                        <i class="fas fa-clipboard"></i> Description
                    </label>
                    <textarea id="description" 
                              class="modal-form-textarea" 
                              placeholder="Describe what maintenance was performed..."
                              rows="3"
                              required></textarea>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="technician">
                        <i class="fas fa-user-hard-hat"></i> Technician Name
                    </label>
                    <input type="text" 
                           id="technician" 
                           class="modal-form-input" 
                           value="${userName || 'Technician'}"
                           required>
                </div>

                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="hoursSpent">
                            <i class="fas fa-clock"></i> Hours Spent
                        </label>
                        <input type="number" 
                               id="hoursSpent" 
                               class="modal-form-input" 
                               min="0.5" 
                               max="24" 
                               step="0.5"
                               placeholder="e.g., 2.5"
                               required>
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="cost">
                            <i class="fas fa-money-bill-wave"></i> Cost (GHS)
                        </label>
                        <input type="number" 
                               id="cost" 
                               class="modal-form-input" 
                               min="0"
                               step="0.01"
                               placeholder="Enter cost">
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="partsUsed">
                        <i class="fas fa-cogs"></i> Parts Used
                    </label>
                    <textarea id="partsUsed" 
                              class="modal-form-textarea" 
                              placeholder="List any parts replaced or used..."
                              rows="2"></textarea>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="nextMaintenance">
                        <i class="fas fa-calendar-check"></i> Next Maintenance Due
                    </label>
                    <input type="date" 
                           id="nextMaintenance" 
                           class="modal-form-input"
                           min="${new Date().toISOString().split('T')[0]}">
                    <div class="modal-form-helper">
                        Recommended: 30 days for preventive maintenance
                    </div>
                </div>

                <div class="modal-form-group">
                    <div class="modal-form-row">
                        <div>
                            <label class="modal-form-label">
                                <i class="fas fa-check-circle"></i> Status
                            </label>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="status" value="completed" checked>
                                    <span>Completed</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="status" value="in_progress">
                                    <span>In Progress</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="status" value="scheduled">
                                    <span>Scheduled</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label class="modal-form-label">
                                <i class="fas fa-exclamation-triangle"></i> Priority
                            </label>
                            <div class="radio-group">
                                <label class="radio-label">
                                    <input type="radio" name="priority" value="low">
                                    <span class="priority-low">Low</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="priority" value="medium" checked>
                                    <span class="priority-medium">Medium</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="priority" value="high">
                                    <span class="priority-high">High</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-errors" id="maintenanceFormErrors"></div>
            </form>
        `;
    }

    async submitMaintenanceLog(modal, siteId) {
        const form = document.getElementById('maintenanceLogForm');
        if (!form) return;

        const formData = this.getMaintenanceFormData(form);
        const errors = this.validateMaintenanceLog(formData);

        if (errors.length > 0) {
            this.showFormErrors('maintenanceFormErrors', errors);
            return;
        }

        try {
            modal.setLoading(true, 'Logging maintenance...');
            
            const response = await fetch('/api/maintenance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error('Failed to log maintenance');
            }

            await response.json();
            
            showAlert('✅ Maintenance logged successfully!', 'success');
            
            this.updateSiteAfterMaintenance(siteId);
            this.addActivity('maintenance', siteId, `${formData.type} maintenance completed`);
            
            this.updateActivitiesList();
        } catch (error) {
            console.error('Maintenance log error:', error);
            showAlert('❌ Failed to log maintenance. Please try again.', 'error');
        } finally {
            modal.setLoading(false);
        }
    }

    getMaintenanceFormData(form) {
        return {
            siteId: form.dataset.siteId,
            date: document.getElementById('maintenanceDate').value,
            type: document.getElementById('maintenanceType').value,
            description: document.getElementById('description').value,
            technician: document.getElementById('technician').value,
            hoursSpent: parseFloat(document.getElementById('hoursSpent').value),
            cost: document.getElementById('cost').value ? 
                  parseFloat(document.getElementById('cost').value) : null,
            partsUsed: document.getElementById('partsUsed').value,
            nextMaintenanceDate: document.getElementById('nextMaintenance').value,
            status: document.querySelector('input[name="status"]:checked').value,
            priority: document.querySelector('input[name="priority"]:checked').value,
            loggedBy: this.userProfile?.id || 'technician',
            timestamp: new Date().toISOString()
        };
    }

    validateMaintenanceLog(formData) {
        const errors = [];
        if (!formData.type) errors.push('Please select maintenance type');
        if (!formData.description) errors.push('Please enter description');
        if (!formData.technician) errors.push('Please enter technician name');
        if (!formData.hoursSpent || formData.hoursSpent <= 0) {
            errors.push('Please enter valid hours spent');
        }
        return errors;
    }

    updateSiteAfterMaintenance(siteId) {
        const siteIndex = this.sites.findIndex(s => s.id === siteId);
        if (siteIndex !== -1) {
            this.sites[siteIndex].maintenanceStatus = 'ok';
            this.sites[siteIndex].lastUpdated = new Date().toISOString();
            
            const siteComponent = this.siteComponents.find(sc => sc.siteData.id === siteId);
            if (siteComponent?.updateData) {
                siteComponent.updateData({
                    maintenanceStatus: 'ok',
                    lastUpdated: this.sites[siteIndex].lastUpdated
                });
            }
        }
    }

    showMaintenanceForm() {
        if (this.sites.length === 0) {
            showAlert('No sites available for maintenance', 'warning');
            return;
        }

        const sitesOptions = this.sites.map(site => 
            `<option value="${site.id}">${site.name} (Status: ${site.maintenanceStatus})</option>`
        ).join('');

        const modal = new Modal({
            id: 'maintenanceSiteSelector',
            title: '<i class="fas fa-tools"></i> Select Site for Maintenance',
            content: `
                <div class="modal-form-group">
                    <label class="modal-form-label" for="selectSite">
                        <i class="fas fa-tower-cell"></i> Select Site
                    </label>
                    <select id="selectSite" class="modal-form-select" required>
                        <option value="">Choose a site...</option>
                        ${sitesOptions}
                    </select>
                </div>
            `,
            size: 'sm',
            confirmText: 'Continue',
            cancelText: 'Cancel',
            onConfirm: () => {
                const selectedSite = document.getElementById('selectSite').value;
                if (!selectedSite) {
                    showAlert('Please select a site', 'warning');
                    return;
                }
                
                const site = this.sites.find(s => s.id === selectedSite);
                if (site) {
                    modal.close();
                    setTimeout(() => this.showMaintenanceModal(site.id, site.name), 300);
                }
            }
        });

        modal.open();
    }

    // ===== SYNC METHODS =====
    
    async syncOfflineData() {
        try {
            const syncBtn = document.getElementById('syncDataBtn');
            setButtonLoading(syncBtn, true, 'Syncing...');
            
            console.log('🔄 Starting data sync...');
            
            const syncQueue = await this.getSyncQueue();
            
            if (syncQueue.length === 0) {
                showAlert('✅ No offline data to sync', 'success');
                return;
            }
            
            const syncData = {
                operations: syncQueue,
                lastSyncTimestamp: localStorage.getItem('lastSyncTimestamp') || new Date().toISOString(),
                deviceId: localStorage.getItem('deviceId') || `device-${Date.now()}`,
                appVersion: '1.0.0',
                deviceInfo: {
                    userAgent: navigator.userAgent,
                    platform: navigator.platform,
                    language: navigator.language
                }
            };
            
            const response = await fetch('/api/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(syncData)
            });
            
            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Sync failed');
            }
            
            const result = await response.json();
            
            await this.clearSyncQueue();
            localStorage.setItem('lastSyncTimestamp', result.timestamp || new Date().toISOString());
            await this.loadDashboardData();
            
            showAlert(`✅ Sync completed! Processed ${syncQueue.length} operations`, 'success');
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            showAlert(`Sync failed: ${error.message}`, 'error');
        } finally {
            const syncBtn = document.getElementById('syncDataBtn');
            setButtonLoading(syncBtn, false);
        }
    }

    async getSyncQueue() {
        // TODO: Implement actual sync queue from IndexedDB
        return [];
    }

    async clearSyncQueue() {
        // TODO: Implement clearing sync queue from IndexedDB
        console.log('Clearing sync queue...');
    }

    showNotifications() {
        const unreadCount = this.alerts.filter(a => !a.acknowledged).length;
        console.log('🔔 Showing notifications...');
        showAlert(`You have ${unreadCount} unread notifications`, 'info');
    }

    // ===== UPDATE METHODS =====
    
    updateSitesDisplay() {
        const sitesGrid = document.getElementById('sitesGridContainer');
        if (sitesGrid) {
            sitesGrid.innerHTML = this.renderSitesGrid();
            setTimeout(() => this.renderComponents(), 100);
        }
    }

    updateAlertsDisplay() {
        const alertsContainer = document.getElementById('alertsContainer');
        if (alertsContainer) {
            alertsContainer.innerHTML = this.renderAlerts();
            setTimeout(() => this.renderComponents(), 100);
        }
    }

    updateActivitiesList() {
        const activitiesList = document.querySelector('.activities-list');
        if (activitiesList) {
            activitiesList.innerHTML = this.renderActivitiesList();
        }
    }

    destroy() {
        console.log('🧹 Cleaning up dashboard...');
        
        this.removeEventListeners();
        this.cleanupComponents();
        this.closeSidebar();
        this.closeSettingsDropdown();
        
        this.isInitialized = false;
        console.log('✅ Dashboard destroyed');
    }
}