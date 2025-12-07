import { authService } from '../services/authService.js';
import { showAlert } from '../utils/helpers.js';

/**
 * Shared Layout Component
 * Provides consistent header and sidebar navigation across all pages
 */
export class Layout {
    constructor(options = {}) {
        this.currentPage = options.currentPage || 'dashboard';
        this.userProfile = null;
        this.isSidebarOpen = false;
        this.isSettingsOpen = false;
        this.eventHandlers = {};
        this.eventsAttached = false;
        this._suppressCloseUntil = 0;

        this.init();
    }

    async init() {
        // Get user profile
        this.userProfile = authService.getUserProfile();
    }

    render(content) {
        const userName = this.userProfile?.firstName || 'User';
        const userRole = this.userProfile?.role;
        const userInitial = userName.charAt(0).toUpperCase();

        // Get unread alerts count (mock for now)
        const unreadAlertsCount = 0; 

        return `
            <div class="app-layout">
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
                                <a href="#dashboard" class="nav-link ${this.currentPage === 'dashboard' ? 'active' : ''}">
                                    <i class="fas fa-tachometer-alt nav-icon"></i>
                                    <span>Dashboard</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#sites" class="nav-link ${this.currentPage === 'sites' ? 'active' : ''}">
                                    <i class="fas fa-tower-cell nav-icon"></i>
                                    <span>My Sites</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#fuel" class="nav-link ${this.currentPage === 'fuel' ? 'active' : ''}">
                                    <i class="fas fa-gas-pump nav-icon"></i>
                                    <span>Fuel Logs</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#maintenance" class="nav-link ${this.currentPage === 'maintenance' ? 'active' : ''}">
                                    <i class="fas fa-tools nav-icon"></i>
                                    <span>Maintenance</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#reports" class="nav-link ${this.currentPage === 'reports' ? 'active' : ''}">
                                    <i class="fas fa-chart-bar nav-icon"></i>
                                    <span>Reports</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#profile" class="nav-link ${this.currentPage === 'profile' ? 'active' : ''}">
                                    <i class="fas fa-user-circle nav-icon"></i>
                                    <span>Profile</span>
                                </a>
                            </li>
                            <li class="nav-item">
                                <a href="#settings" class="nav-link ${this.currentPage === 'settings' ? 'active' : ''}">
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
                                    <a href="#help" class="nav-link ${this.currentPage === 'help' ? 'active' : ''}">
                                        <i class="fas fa-question-circle nav-icon"></i>
                                        <span>Help & Support</span>
                                    </a>
                                </li>
                                <li class="nav-item">
                                    <a href="#about" class="nav-link ${this.currentPage === 'about' ? 'active' : ''}">
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
                    <div class="page-content">
                        ${content}
                    </div>
                </main>

                <!-- Settings Overlay -->
                <div class="settings-overlay" id="settingsOverlay"></div>
            </div>
        `;
    }

    attachEvents() {
        // Prevent attaching handlers multiple times
        if (this.eventsAttached) return;

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

        // Settings dropdown
        const userInfo = document.getElementById('userInfo');
        if (userInfo) {
            this.eventHandlers.userInfo = (e) => {
                // Prevent the global click handler from immediately closing the dropdown
                e.stopPropagation();
                this._suppressCloseUntil = Date.now() + 250;
                this.toggleSettingsDropdown();
            };
            userInfo.addEventListener('click', this.eventHandlers.userInfo);
        }

        // Close dropdown when clicking outside
        this.eventHandlers.closeDropdownOnClick = (e) => {
            // If we recently opened the dropdown, ignore stray clicks for a short window
            if (Date.now() < (this._suppressCloseUntil || 0)) return;

            const userInfo = document.getElementById('userInfo');
            const dropdown = document.getElementById('settingsDropdown');

            if (dropdown && dropdown.classList.contains('show')) {
                // If click target is not inside the dropdown or userInfo, close it
                if (!dropdown.contains(e.target) && !userInfo?.contains(e.target)) {
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

        // Mark that we've attached events
        this.eventsAttached = true;
    }

    removeEventListeners() {
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
        this.eventHandlers = {};
        this.eventsAttached = false;
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

    // Settings Dropdown Methods
    toggleSettingsDropdown() {
        this.isSettingsOpen
            ? this.closeSettingsDropdown()
            : this.openSettingsDropdown();
    }

    openSettingsDropdown() {
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
        console.log('Settings dropdown opened');
    }

    closeSettingsDropdown() {
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
        console.log('Settings dropdown closed');
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

    showNotifications() {
        showAlert('Notifications feature coming soon!', 'info');
    }

    destroy() {
        this.removeEventListeners();
        this.closeSidebar();
        this.closeSettingsDropdown();
    }
}
