import { showAlert, formatDate, setButtonLoading } from '../utils/helpers.js';
import { authService } from '../services/authService.js';
import { siteService } from '../services/siteService.js';
import { SiteCard } from '../../components/site-card.js';
import { MaintenanceAlert } from '../../components/maintenance-alert.js';
import { 
    AddSiteModal, 
    FuelSiteSelectorModal,
    FuelLogModal,
    MaintenanceSiteSelectorModal,
    MaintenanceLogModal,
    MaintenanceSchedulerModal
} from '../modals/index.js';

export class TechnicianDashboard {
    constructor() {
        this.userProfile = null;
        this.sites = [];
        this.siteComponents = [];
        this.activities = [];
        this.alertComponents = [];
        this.alerts = [];
        this.isInitialized = false;
        this.isSidebarOpen = false;
        this.isSettingsOpen = false;
        this.eventHandlers = {};
        this.eventsAttached = false;
        
        // Initialize services
        this.initServices();
        
        // Bind methods
        this.showAddSiteForm = this.showAddSiteForm.bind(this);
        this.showFuelLogForm = this.showFuelLogForm.bind(this);
        this.showMaintenanceForm = this.showMaintenanceForm.bind(this);
        this.syncOfflineData = this.syncOfflineData.bind(this);
        
        this.init();
    }

    initServices() {
        // Initialize authService if not already initialized
        if (authService && !authService.config) {
            authService.init();
        }
        
        // Initialize siteService if not already initialized
        if (siteService && !siteService.config) {
            siteService.init();
        }
    }

    async init() {
        console.log('🏗️ Technician Dashboard initializing...');
        
        try {
            // Check authentication using authService
            const isAuthenticated = authService.isAuthenticated();
            
            if (!isAuthenticated) {
                showAlert('Please login to access dashboard', 'error');
                window.location.hash = 'login';
                return;
            }

            // Load user profile using authService
            this.userProfile = authService.getUserProfile();
            
            if (!this.userProfile) {
                showAlert('Failed to load user profile', 'error');
                await authService.logout();
                return;
            }
            
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
            // Load assigned sites using siteService
            this.sites = await this.loadAssignedSites();
            
            // Load recent activities
            this.activities = await this.loadRecentActivities();
            
            // Load alerts
            this.alerts = await this.loadAlerts();
            
            console.log(`✅ Dashboard data loaded: ${this.sites.length} sites, ${this.activities.length} activities, ${this.alerts.length} alerts`);
            
        } catch (error) {
            console.error('❌ Failed to load dashboard data:', error);
            throw error;
        }
    }

    async loadAssignedSites() {
        try {
            console.log('📡 Loading assigned sites...');
            
            // Try to get sites from service
            let sites = [];
            
            if (siteService && typeof siteService.getSites === 'function') {
                const result = await siteService.getSites();
                console.log('📡 Site service result:', result);
                
                // Handle different response formats
                if (Array.isArray(result)) {
                    sites = result;
                } else if (result && result.data && Array.isArray(result.data)) {
                    sites = result.data;
                } else if (result && result.sites && Array.isArray(result.sites)) {
                    sites = result.sites;
                } else if (result && typeof result === 'object') {
                    // Convert object to array
                    sites = Object.values(result);
                }
            }
            
            // If we got no sites, use mock data
            if (!sites || sites.length === 0) {
                console.log('📡 No sites from service, using mock data');
                sites = this.getMockSites();
            }
            
            console.log(`✅ Loaded ${sites.length} sites`);
            return sites;
            
        } catch (error) {
            console.error('❌ Failed to load assigned sites:', error);
            
            // Always return an array
            return this.getMockSites();
        }
    }

    getMockSites() {
        return [
            {
                id: '600545',
                siteId: '600545',
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
                siteId: '600546',
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
                siteId: '600547',
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
        try {
            // Try to load alerts from siteService or API
            // For now, return mock data
            return this.getMockAlerts();
        } catch (error) {
            console.error('❌ Failed to load alerts:', error);
            return this.getMockAlerts();
        }
    }

    getMockAlerts() {
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
        
        // Calculate unread alerts
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
                            <button class="notification-btn" id="notificationBtn">
                                <i class="fas fa-bell"></i>
                                ${unreadAlertsCount > 0 ? 
                                    `<span class="notification-badge">${unreadAlertsCount}</span>` : ''}
                            </button>

                            <button class="menu-btn" id="menuBtn" title="Menu">
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
                                <div class="settings-chevron">
                                    <i class="fas fa-chevron-down"></i>
                                </div>
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
                            <button class="close-sidebar-btn" id="closeSidebarBtn">
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
                    <button class="add-site-btn" id="emptyStateAddSiteBtn" style="
                        margin-top: 16px;
                        padding: 10px 20px;
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        border-radius: 8px;
                        cursor: pointer;
                        font-weight: 500;
                    ">
                        <i class="fas fa-plus-circle"></i> Add Your First Site
                    </button>
                </div>
            `;
        }

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
        // Filter to only show unacknowledged alerts or all alerts
        const displayAlerts = this.alerts.filter(alert => !alert.acknowledged);
        
        if (displayAlerts.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon"><i class="fas fa-bell"></i></div>
                    <h3 class="empty-title">No Unread Alerts</h3>
                    <p class="empty-description">
                        Great! No unread alerts at the moment.
                    </p>
                </div>
            `;
        }

        return displayAlerts.map(alert => 
            `<div id="alert-${alert.id}" class="alert-container"></div>`
        ).join('');
    }

    renderComponents() {
    console.log('🎨 Rendering components...');
    
    // Ensure sites is an array
    if (!Array.isArray(this.sites)) {
        console.error('❌ this.sites is not an array:', this.sites);
        this.sites = this.sites ? [this.sites] : [];
    }
    
    // Clear previous components
    this.siteComponents = [];
    this.alertComponents = [];
    
    // Render Site Cards only if we have sites
    if (this.sites.length > 0) {
        this.sites.forEach(site => {
            const container = document.getElementById(`site-card-${site.id}`);
            if (container) {
                const siteCard = new SiteCard(site);
                container.innerHTML = siteCard.render();
                siteCard.attachEvents();
                this.siteComponents.push(siteCard);
                
                // Setup event listeners for site card actions
                this.setupSiteCardEvents(siteCard, site.id);
            }
        });
    }
    
    // Render Maintenance Alerts
    const displayAlerts = Array.isArray(this.alerts) ? 
        this.alerts.filter(alert => !alert.acknowledged) : [];
    
    displayAlerts.forEach(alert => {
        const container = document.getElementById(`alert-${alert.id}`);
        if (container) {
            const maintenanceAlert = new MaintenanceAlert(alert);
            container.innerHTML = maintenanceAlert.render();
            maintenanceAlert.attachEvents();
            this.alertComponents.push(maintenanceAlert);
            
            // Setup event listeners for alert actions
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

    attachEvents() {
       console.log('🔗 Attaching dashboard events...');
        
        // DEBUG: Check if events are already attached
        if (this.eventsAttached) {
            console.warn('⚠️ Events already attached, skipping...');
            return;
        }
        
        // First, remove any existing event listeners
        this.removeEventListeners();
    
        // Menu button (mobile)
        const menuBtn = document.getElementById('menuBtn');
        if (menuBtn) {
            this.eventHandlers.menuBtn = () => this.toggleSidebar();
            menuBtn.addEventListener('click', this.eventHandlers.menuBtn);
        }
        
        // Close sidebar button
        const closeSidebarBtn = document.getElementById('closeSidebarBtn');
        if (closeSidebarBtn) {
            this.eventHandlers.closeSidebarBtn = () => this.closeSidebar();
            closeSidebarBtn.addEventListener('click', this.eventHandlers.closeSidebarBtn);
        }
        
        // Sidebar overlay
        const sidebarOverlay = document.getElementById('sidebarOverlay');
        if (sidebarOverlay) {
            this.eventHandlers.sidebarOverlay = () => this.closeSidebar();
            sidebarOverlay.addEventListener('click', this.eventHandlers.sidebarOverlay);
        }
        
        // Settings dropdown - FIXED: Only attach to userInfo
        const userInfo = document.getElementById('userInfo');
        
        if (userInfo) {
            this.eventHandlers.userInfo = (e) => {
                console.log('👤 User info clicked, :');
                e.stopPropagation();
                this.toggleSettingsDropdown(e);
            };
            userInfo.addEventListener('click', this.eventHandlers.userInfo);
        }
        
        // Close dropdown when clicking outside
        this.eventHandlers.closeDropdownOnClick = (e) => {
            const userInfo = document.getElementById('userInfo');
            const dropdown = document.getElementById('settingsDropdown');
            
            if (dropdown.classList.contains('show')) {
                if (!userInfo?.contains(e.target)) {
                    console.log('👆 Clicked outside, closing dropdown');
                    this.closeSettingsDropdown();
                }
            }
        };
        document.addEventListener('click', this.eventHandlers.closeDropdownOnClick);
        
        // Close on escape key
        this.eventHandlers.closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                this.closeSettingsDropdown();
            }
        };
        document.addEventListener('keydown', this.eventHandlers.closeOnEscape);
        
        // Logout buttons
        const dropdownLogoutBtn = document.getElementById('dropdownLogoutBtn');
        const sidebarLogoutBtn = document.getElementById('sidebarLogoutBtn');
        
        if (dropdownLogoutBtn) {
            this.eventHandlers.dropdownLogoutBtn = async (e) => {
                e.stopPropagation();
                this.closeSettingsDropdown();
                await this.handleLogout();
            };
            dropdownLogoutBtn.addEventListener('click', this.eventHandlers.dropdownLogoutBtn);
        }
        
        if (sidebarLogoutBtn) {
            this.eventHandlers.sidebarLogoutBtn = async (e) => {
                e.stopPropagation();
                this.closeSidebar();
                await this.handleLogout();
            };
            sidebarLogoutBtn.addEventListener('click', this.eventHandlers.sidebarLogoutBtn);
        }

        // Notification button
        const notificationBtn = document.getElementById('notificationBtn');
        if (notificationBtn) {
            this.eventHandlers.notificationBtn = () => this.showNotifications();
            notificationBtn.addEventListener('click', this.eventHandlers.notificationBtn);
        }

        // View all buttons
        const viewAllSitesBtn = document.getElementById('viewAllSitesBtn');
        if (viewAllSitesBtn) {
            this.eventHandlers.viewAllSitesBtn = () => this.showAllSites();
            viewAllSitesBtn.addEventListener('click', this.eventHandlers.viewAllSitesBtn);
        }
        
        const viewAllActivitiesBtn = document.getElementById('viewAllActivitiesBtn');
        if (viewAllActivitiesBtn) {
            this.eventHandlers.viewAllActivitiesBtn = () => this.showAllActivities();
            viewAllActivitiesBtn.addEventListener('click', this.eventHandlers.viewAllActivitiesBtn);
        }
        
        const markAllReadBtn = document.getElementById('markAllReadBtn');
        if (markAllReadBtn) {
            this.eventHandlers.markAllReadBtn = () => this.markAllAlertsRead();
            markAllReadBtn.addEventListener('click', this.eventHandlers.markAllReadBtn);
        }

        // Empty state add site button
        const emptyStateAddSiteBtn = document.getElementById('emptyStateAddSiteBtn');
        if (emptyStateAddSiteBtn) {
            this.eventHandlers.emptyStateAddSiteBtn = () => this.showAddSiteForm();
            emptyStateAddSiteBtn.addEventListener('click', this.eventHandlers.emptyStateAddSiteBtn);
        }

        // Quick action buttons
        this.attachQuickActions();
        
        // Render components after DOM is ready
        setTimeout(() => {
            this.renderComponents();
        }, 100);

        // Mark as attached
        this.eventsAttached = true;
        console.log('✅ Dashboard events attached successfully');
    }

    toggleSettingsDropdown(e) {
        console.log('🔄 Toggling settings dropdown');
        
        // if (e) {
        //     e.stopPropagation();
        // }
        
        const settingsDropdown = document.getElementById('settingsDropdown');
        
        if (settingsDropdown && settingsDropdown.classList.contains('show')) {
            this.closeSettingsDropdown();
        } else {
            this.openSettingsDropdown();
        }
    }

    openSettingsDropdown() {
        console.log('📖 Opening settings dropdown');
        
        const settingsDropdown = document.getElementById('settingsDropdown');
        const settingsOverlay = document.getElementById('settingsOverlay');
        
        if (settingsDropdown) {
            settingsDropdown.classList.add('show');
            settingsDropdown.style.display = 'block';
            settingsDropdown.style.opacity = '1';
            settingsDropdown.style.visibility = 'visible';
            settingsDropdown.style.zIndex = '1000';
        }
        
        if (settingsOverlay) {
            settingsOverlay.classList.add('active');
            settingsOverlay.style.display = 'block';
        }
        
        this.isSettingsOpen = true;
    }

    closeSettingsDropdown() {
        console.log('📕 Closing settings dropdown');
        
        const settingsDropdown = document.getElementById('settingsDropdown');
        const settingsOverlay = document.getElementById('settingsOverlay');
        
        if (settingsDropdown) {
            settingsDropdown.classList.remove('show');
            settingsDropdown.style.display = 'none';
        }
        
        if (settingsOverlay) {
            settingsOverlay.classList.remove('active');
            settingsOverlay.style.display = 'none';
        }
        
        this.isSettingsOpen = false;
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
    console.log('🧹 Removing event listeners...');
    
    // Remove all event listeners
    Object.entries(this.eventHandlers).forEach(([key, handler]) => {
        if (key === 'closeDropdownOnClick' || key === 'closeOnEscape') {
            document.removeEventListener(key === 'closeDropdownOnClick' ? 'click' : 'keydown', handler);
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
    
    // Reset handlers
    this.eventHandlers = {};
    this.eventsAttached = false;
    
    console.log('✅ Event listeners removed');
}

    cleanupComponents() {
        // Clean up site card components
        this.siteComponents.forEach(siteCard => {
            if (siteCard && typeof siteCard.destroy === 'function') {
                siteCard.destroy();
            }
        });
        this.siteComponents = [];
        
        // Clean up alert components
        this.alertComponents.forEach(alert => {
            if (alert && typeof alert.destroy === 'function') {
                alert.destroy();
            }
        });
        this.alertComponents = [];
    }

    attachQuickActions() {
        // Create debounced versions of handlers
        const debouncedShowAddSite = this.debounce(() => this.showAddSiteForm(), 300);
        const debouncedShowFuelLog = this.debounce(() => this.showFuelLogForm(), 300);
        const debouncedShowMaintenance = this.debounce(() => this.showMaintenanceForm(), 300);
        const debouncedSyncData = this.debounce(() => this.syncOfflineData(), 300);
        
        const quickActions = {
            'logFuelBtn': debouncedShowFuelLog,
            'logMaintenanceBtn': debouncedShowMaintenance,
            'addSiteBtn': debouncedShowAddSite,
            'syncDataBtn': debouncedSyncData
        };

        Object.entries(quickActions).forEach(([btnId, handler]) => {
            const button = document.getElementById(btnId);
            if (button) {
                // Remove existing listener first
                button.removeEventListener('click', handler);
                
                // Add new listener
                this.eventHandlers[btnId] = handler;
                button.addEventListener('click', handler);
                
                console.log(`✅ Attached debounced handler to ${btnId}`);
            }
        });
    }

    removeQuickActionListeners() {
        Object.keys(this.eventHandlers).forEach(key => {
            if (['logFuelBtn', 'logMaintenanceBtn', 'addSiteBtn', 'syncDataBtn'].includes(key)) {
                const button = document.getElementById(key);
                const handler = this.eventHandlers[key];
                if (button && handler) {
                    button.removeEventListener('click', handler);
                }
            }
        });
    }

    // Sidebar Methods
    toggleSidebar() {
        if (this.isSidebarOpen) {
            this.closeSidebar();
        } else {
            this.openSidebar();
        }
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

    // Navigation Methods
    showAllSites() {
        showAlert('Showing all sites...', 'info');
        console.log('📋 Showing all sites');
    }

    showAllActivities() {
        showAlert('Showing all activities...', 'info');
        console.log('📋 Showing all activities');
    }

    markAllAlertsRead() {
        // Mark all alerts as read
        this.alerts.forEach(alert => {
            alert.acknowledged = true;
        });
        
        // Update alert components
        this.alertComponents.forEach(alertComponent => {
            alertComponent.updateData({ acknowledged: true });
        });
        
        // Update UI
        this.updateAlertsDisplay();
        
        showAlert('All alerts marked as read', 'success');
        console.log('✅ Marking all alerts as read');
    }

    showAddSiteForm() {
        console.log('➕ Add Site clicked:', {
            userProfile: this.userProfile,
            timestamp: new Date().toISOString(),
            stack: new Error().stack // This will show where the call came from
        });
        
        const isAuthenticated = authService.isAuthenticated();
        
        if (!isAuthenticated || !this.userProfile) {
            showAlert('Please login to add sites', 'error');
            console.log('User not authenticated, redirecting to login...');
            window.location.hash = 'login';
            return;
        }
        
        // Prevent multiple modals
        if (this.addSiteModalOpen) {
            console.log('⚠️ Add site modal already open');
            return;
        }
        
        this.addSiteModalOpen = true;
        
        const modal = new AddSiteModal(this.userProfile, async (formData) => {
            await this.handleAddSiteSubmit(formData);
            this.addSiteModalOpen = false;
        });
        
        modal.open();
    }
    
    async handleAddSiteSubmit(formData) {
        try {
            const createdSite = await siteService.createSite(formData);
            
            showAlert('✅ Site registered successfully!', 'success');
            
            // Update dashboard
            this.sites.unshift(createdSite);
            this.updateSitesDisplay();
            
            // Add activity
            this.addActivity('site', formData.siteId, 'New site registered');
            
            this.updateActivitiesList();
            
        } catch (error) {
            console.error('Add site error:', error);
            throw error;
        }
    }
    
    showFuelLogForm() {
        if (this.sites.length === 0) {
            showAlert('No sites available to log fuel', 'warning');
            return;
        }
        
        const modal = new FuelSiteSelectorModal(this.sites, (selectedSite) => {
            this.showFuelLogModal(selectedSite.id, selectedSite.name);
        });
        modal.open();
    }
    
    showFuelLogModal(siteId, siteName) {
        const modal = new FuelLogModal(siteId, siteName, this.userProfile, async (formData) => {
            await this.handleFuelLogSubmit(formData);
        });
        modal.open();
    }
    
    async handleFuelLogSubmit(formData) {
        try {
            await siteService.addFuelLog(formData);
            
            showAlert('✅ Fuel logged successfully!', 'success');
            
            this.updateSiteAfterFuelLog(formData.siteId, formData);
            
            this.addActivity('fuel', formData.siteId, `Fuel refill - ${formData.fuelAmount} liters`);
            
            this.updateActivitiesList();

        } catch (error) {
            console.error('Fuel log error:', error);
            throw error;
        }
    }
    
    showMaintenanceForm() {
        if (this.sites.length === 0) {
            showAlert('No sites available for maintenance', 'warning');
            return;
        }
        
        const modal = new MaintenanceSiteSelectorModal(this.sites, (selectedSite) => {
            this.showMaintenanceModal(selectedSite.id, selectedSite.name);
        });
        modal.open();
    }
    
    showMaintenanceModal(siteId, siteName) {
        const modal = new MaintenanceLogModal(siteId, siteName, this.userProfile, async (formData) => {
            await this.handleMaintenanceLogSubmit(formData);
        });
        modal.open();
    }
    
    async handleMaintenanceLogSubmit(formData) {
        try {
            await siteService.addMaintenanceLog(formData);
            
            showAlert('✅ Maintenance logged successfully!', 'success');
            
            this.updateSiteAfterMaintenance(formData.siteId);
            
            this.addActivity('maintenance', formData.siteId, `${formData.type} maintenance completed`);
            
            this.updateActivitiesList();

        } catch (error) {
            console.error('Maintenance log error:', error);
            throw error;
        }
    }
    
    scheduleMaintenance(siteId, siteName) {
        const modal = new MaintenanceSchedulerModal(siteId, siteName, this.userProfile, async (formData) => {
            await this.handleMaintenanceScheduleSubmit(formData);
        });
        modal.open();
    }
    
    async handleMaintenanceScheduleSubmit(formData) {
        try {
            // This should use siteService when available
            showAlert('✅ Maintenance scheduled successfully!', 'success');
            
            this.alerts.unshift({
                id: `alert-${Date.now()}`,
                siteId: formData.siteId,
                siteName: formData.siteName,
                alertType: 'scheduled_maintenance',
                severity: 'medium',
                message: `Scheduled ${formData.maintenanceType} maintenance for ${formData.siteName}`,
                dueDate: formData.startDate,
                maintenanceType: formData.maintenanceType,
                createdAt: new Date().toISOString(),
                acknowledged: false
            });
            
            this.updateAlertsDisplay();

        } catch (error) {
            console.error('Schedule maintenance error:', error);
            throw error;
        }
    }
    
    // ===== HELPER METHODS =====
    
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
    
    // ===== SITE ACTIONS =====
    
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

    // ===== ALERT ACTIONS =====
    
    acknowledgeAlert(alertId) {
        console.log(`✅ Acknowledging alert: ${alertId}`);
        
        const alertIndex = this.alerts.findIndex(a => a.id === alertId);
        if (alertIndex !== -1) {
            this.alerts[alertIndex].acknowledged = true;
            
            const alertComponent = this.alertComponents.find(ac => ac.alertData.id === alertId);
            if (alertComponent?.updateData) {
                alertComponent.updateData({ acknowledged: true });
            }
            
            // Remove from display
            this.updateAlertsDisplay();
            
            showAlert('Alert acknowledged successfully', 'success');
        }
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
        
        // Update notification badge
        const notificationBadge = document.querySelector('.notification-badge');
        const unreadCount = this.alerts.filter(a => !a.acknowledged).length;
        
        if (notificationBadge) {
            if (unreadCount > 0) {
                notificationBadge.textContent = unreadCount;
                notificationBadge.style.display = 'block';
            } else {
                notificationBadge.style.display = 'none';
            }
        }
    }

    updateActivitiesList() {
        const activitiesList = document.querySelector('.activities-list');
        if (activitiesList) {
            activitiesList.innerHTML = this.renderActivitiesList();
        }
    }
    
    // ===== SYNC METHOD =====
    
    async syncOfflineData() {
        try {
            const syncBtn = document.getElementById('syncDataBtn');
            setButtonLoading(syncBtn, true, 'Syncing...');
            
            console.log('🔄 Starting data sync...');
            
            const result = await siteService.syncOfflineData();
            
            showAlert(`✅ Sync completed! Processed ${result.processed || 0} operations`, 'success');
            
            await this.loadDashboardData();
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            showAlert(`Sync failed: ${error.message}`, 'error');
        } finally {
            const syncBtn = document.getElementById('syncDataBtn');
            setButtonLoading(syncBtn, false);
        }
    }

    showNotifications() {
        const unreadCount = this.alerts.filter(a => !a.acknowledged).length;
        console.log('🔔 Showing notifications...');
        
        if (unreadCount > 0) {
            showAlert(`You have ${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`, 'info');
            // Scroll to alerts section
            document.querySelector('.alerts-container')?.scrollIntoView({ behavior: 'smooth' });
        } else {
            showAlert('No unread notifications', 'info');
        }
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    // ===== DESTROY METHOD =====
    
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