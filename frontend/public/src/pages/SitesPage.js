// frontend/src/pages/SitesPage.js
import { showAlert, formatDate } from '../utils/helpers.js';
import { authService } from '../services/authService.js';
import { siteService } from '../services/siteService.js';
import { SiteCard } from '../../components/site-card.js';
import { AddSiteModal } from '../modals/index.js';

export default class SitesPage {
    constructor() {
        this.userProfile = null;
        this.sites = [];
        this.siteComponents = [];
        this.filteredSites = [];
        this.filters = {
            search: '',
            status: 'all',
            region: 'all'
        };
        this.currentPage = 1;
        this.itemsPerPage = 12;
        this.eventHandlers = {};
    }

    async init() {
        try {
            // Check authentication
            if (!authService.isAuthenticated()) {
                showAlert('Please login to access sites', 'error');
                window.location.hash = 'login';
                return;
            }

            this.userProfile = authService.getUserProfile();
            await this.loadSites();
            
        } catch (error) {
            console.error('Failed to initialize SitesPage:', error);
            showAlert('Failed to load sites. Please refresh.', 'error');
        }
    }

    async loadSites() {
        try {
            const sites = await siteService.getSites({ refresh: true });
            this.sites = Array.isArray(sites) ? sites : [];
            this.filteredSites = [...this.sites];
            console.log(`Loaded ${this.sites.length} sites`);
        } catch (error) {
            console.error('Failed to load sites:', error);
            this.sites = [];
            this.filteredSites = [];
        }
    }

    render() {
        const userName = this.userProfile?.firstName || 'User';
        const totalPages = Math.ceil(this.filteredSites.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const currentSites = this.filteredSites.slice(startIndex, endIndex);
        
        return `
            <div class="sites-page" id="pages-styles">
                <!-- Page Header -->
                <div class="page-header">
                    <div class="header-content">
                        <div class="header-title">
                            <h1><i class="fas fa-tower-cell"></i> My Sites</h1>
                            <p class="page-subtitle">Manage and monitor your assigned telecom sites</p>
                        </div>
                        <div class="header-actions">
                            <button class="btn btn-primary" id="addSiteBtn">
                                <i class="fas fa-plus-circle"></i> Add New Site
                            </button>
                            <button class="btn btn-secondary" id="refreshSitesBtn">
                                <i class="fas fa-sync-alt"></i> Refresh
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Filters Section -->
                <div class="filters-section">
                    <div class="filters-grid">
                        <!-- Search -->
                        <div class="filter-group">
                            <label class="filter-label">
                                <i class="fas fa-search"></i> Search
                            </label>
                            <div class="search-input-wrapper">
                                <input type="text" 
                                       id="siteSearch" 
                                       class="search-input" 
                                       placeholder="Search by site name, ID, or location..."
                                       value="${this.filters.search}">
                                <i class="fas fa-search search-icon"></i>
                            </div>
                        </div>

                        <!-- Status Filter -->
                        <div class="filter-group">
                            <label class="filter-label">
                                <i class="fas fa-circle"></i> Status
                            </label>
                            <select id="statusFilter" class="filter-select">
                                <option value="all" ${this.filters.status === 'all' ? 'selected' : ''}>All Status</option>
                                <option value="active" ${this.filters.status === 'active' ? 'selected' : ''}>Active</option>
                                <option value="inactive" ${this.filters.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                                <option value="maintenance" ${this.filters.status === 'maintenance' ? 'selected' : ''}>Under Maintenance</option>
                            </select>
                        </div>

                        <!-- Region Filter -->
                        <div class="filter-group">
                            <label class="filter-label">
                                <i class="fas fa-map-marker-alt"></i> Region
                            </label>
                            <select id="regionFilter" class="filter-select">
                                <option value="all" ${this.filters.region === 'all' ? 'selected' : ''}>All Regions</option>
                                <option value="greater_accra" ${this.filters.region === 'greater_accra' ? 'selected' : ''}>Greater Accra</option>
                                <option value="ashanti" ${this.filters.region === 'ashanti' ? 'selected' : ''}>Ashanti</option>
                                <option value="eastern" ${this.filters.region === 'eastern' ? 'selected' : ''}>Eastern</option>
                                <option value="central" ${this.filters.region === 'central' ? 'selected' : ''}>Central</option>
                                <option value="western" ${this.filters.region === 'western' ? 'selected' : ''}>Western</option>
                            </select>
                        </div>

                        <!-- Filter Actions -->
                        <div class="filter-actions">
                            <button class="btn btn-secondary" id="clearFiltersBtn">
                                <i class="fas fa-times"></i> Clear Filters
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Stats Overview -->
                <div class="stats-overview">
                    <div class="stat-card">
                        <div class="stat-icon bg-primary">
                            <i class="fas fa-tower-cell"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${this.sites.length}</div>
                            <div class="stat-label">Total Sites</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-success">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${this.sites.filter(s => s.status === 'active').length}</div>
                            <div class="stat-label">Active Sites</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-warning">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${this.sites.filter(s => s.maintenanceStatus === 'overdue').length}</div>
                            <div class="stat-label">Overdue Maintenance</div>
                        </div>
                    </div>
                    
                    <div class="stat-card">
                        <div class="stat-icon bg-danger">
                            <i class="fas fa-gas-pump"></i>
                        </div>
                        <div class="stat-content">
                            <div class="stat-value">${this.sites.filter(s => s.fuelLevel < 30).length}</div>
                            <div class="stat-label">Low Fuel Alert</div>
                        </div>
                    </div>
                </div>

                <!-- Sites Grid -->
                <div class="sites-content">
                    <div class="content-header">
                        <h3>Sites (${this.filteredSites.length})</h3>
                        <div class="view-options">
                            <button class="view-option ${this.itemsPerPage === 12 ? 'active' : ''}" data-items="12">
                                <i class="fas fa-th-large"></i>
                            </button>
                            <button class="view-option ${this.itemsPerPage === 24 ? 'active' : ''}" data-items="24">
                                <i class="fas fa-th-list"></i>
                            </button>
                        </div>
                    </div>

                    ${this.renderSitesGrid(currentSites)}

                    <!-- Pagination -->
                    ${this.renderPagination(totalPages)}
                </div>

                <!-- Empty State -->
                ${this.sites.length === 0 ? this.renderEmptyState() : ''}
            </div>
        `;
    }

    renderSitesGrid(sites) {
        if (sites.length === 0) {
            return `
                <div class="empty-state">
                    <div class="empty-icon">
                        <i class="fas fa-tower-cell"></i>
                    </div>
                    <h3>No Sites Found</h3>
                    <p>${this.filters.search || this.filters.status !== 'all' || this.filters.region !== 'all' 
                        ? 'Try adjusting your filters or search criteria' 
                        : 'You haven\'t been assigned to any sites yet'}</p>
                    ${!this.filters.search && this.filters.status === 'all' && this.filters.region === 'all' 
                        ? `<button class="btn btn-primary" id="emptyStateAddSiteBtn">
                            <i class="fas fa-plus-circle"></i> Add Your First Site
                           </button>`
                        : `<button class="btn btn-secondary" id="clearAllFiltersBtn">
                            Clear All Filters
                           </button>`
                    }
                </div>
            `;
        }

        return `
            <div class="sites-grid-container">
                <div class="sites-grid" id="sitesGrid">
                    ${sites.map(site => `
                        <div class="site-card-wrapper" id="site-card-${site.id}">
                            <!-- SiteCard component will render here -->
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    renderPagination(totalPages) {
        if (totalPages <= 1) return '';

        return `
            <div class="pagination">
                <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        id="prevPageBtn" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                
                <div class="page-numbers">
                    ${Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (this.currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (this.currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = this.currentPage - 2 + i;
                        }
                        
                        return `
                            <button class="page-number ${this.currentPage === pageNum ? 'active' : ''}" 
                                    data-page="${pageNum}">
                                ${pageNum}
                            </button>
                        `;
                    }).join('')}
                    
                    ${totalPages > 5 ? `
                        <span class="page-dots">...</span>
                        <button class="page-number" data-page="${totalPages}">
                            ${totalPages}
                        </button>
                    ` : ''}
                </div>
                
                <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        id="nextPageBtn" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="full-empty-state">
                <div class="empty-content">
                    <div class="empty-icon-large">
                        <i class="fas fa-tower-cell"></i>
                    </div>
                    <h2>No Sites Assigned</h2>
                    <p>You haven't been assigned to any telecom sites yet.</p>
                    <p class="empty-hint">Contact your supervisor or add your first site to get started.</p>
                    <div class="empty-actions">
                        <button class="btn btn-primary" id="addFirstSiteBtn">
                            <i class="fas fa-plus-circle"></i> Add Your First Site
                        </button>
                        <button class="btn btn-secondary" id="contactSupervisorBtn">
                            <i class="fas fa-user-tie"></i> Contact Supervisor
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        console.log('🔗 Attaching SitesPage events...');
        
        // Remove existing listeners
        this.removeEventListeners();

        // Add Site Button
        const addSiteBtn = document.getElementById('addSiteBtn');
        if (addSiteBtn) {
            this.eventHandlers.addSiteBtn = () => this.showAddSiteModal();
            addSiteBtn.addEventListener('click', this.eventHandlers.addSiteBtn);
        }

        // Refresh Button
        const refreshBtn = document.getElementById('refreshSitesBtn');
        if (refreshBtn) {
            this.eventHandlers.refreshBtn = async () => {
                await this.refreshSites();
            };
            refreshBtn.addEventListener('click', this.eventHandlers.refreshBtn);
        }

        // Search Input
        const searchInput = document.getElementById('siteSearch');
        if (searchInput) {
            this.eventHandlers.searchInput = (e) => {
                this.filters.search = e.target.value;
                this.applyFilters();
            };
            searchInput.addEventListener('input', this.debounce(this.eventHandlers.searchInput, 300));
        }

        // Filter Selects
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            this.eventHandlers.statusFilter = (e) => {
                this.filters.status = e.target.value;
                this.applyFilters();
            };
            statusFilter.addEventListener('change', this.eventHandlers.statusFilter);
        }

        const regionFilter = document.getElementById('regionFilter');
        if (regionFilter) {
            this.eventHandlers.regionFilter = (e) => {
                this.filters.region = e.target.value;
                this.applyFilters();
            };
            regionFilter.addEventListener('change', this.eventHandlers.regionFilter);
        }

        // Clear Filters
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');
        if (clearFiltersBtn) {
            this.eventHandlers.clearFiltersBtn = () => this.clearFilters();
            clearFiltersBtn.addEventListener('click', this.eventHandlers.clearFiltersBtn);
        }

        // Pagination
        const prevPageBtn = document.getElementById('prevPageBtn');
        if (prevPageBtn) {
            this.eventHandlers.prevPageBtn = () => this.goToPage(this.currentPage - 1);
            prevPageBtn.addEventListener('click', this.eventHandlers.prevPageBtn);
        }

        const nextPageBtn = document.getElementById('nextPageBtn');
        if (nextPageBtn) {
            this.eventHandlers.nextPageBtn = () => this.goToPage(this.currentPage + 1);
            nextPageBtn.addEventListener('click', this.eventHandlers.nextPageBtn);
        }

        // Page Numbers
        document.querySelectorAll('.page-number').forEach(btn => {
            const page = parseInt(btn.dataset.page);
            btn.addEventListener('click', () => this.goToPage(page));
        });

        // View Options
        document.querySelectorAll('.view-option').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const items = parseInt(e.currentTarget.dataset.items);
                this.changeView(items);
            });
        });

        // Empty state buttons
        const emptyStateAddBtn = document.getElementById('emptyStateAddSiteBtn') || 
                                 document.getElementById('addFirstSiteBtn');
        if (emptyStateAddBtn) {
            this.eventHandlers.emptyStateAddBtn = () => this.showAddSiteModal();
            emptyStateAddBtn.addEventListener('click', this.eventHandlers.emptyStateAddBtn);
        }

        // Contact Supervisor Button
        const contactBtn = document.getElementById('contactSupervisorBtn');
        if (contactBtn) {
            this.eventHandlers.contactBtn = () => this.contactSupervisor();
            contactBtn.addEventListener('click', this.eventHandlers.contactBtn);
        }

        // Clear All Filters
        const clearAllBtn = document.getElementById('clearAllFiltersBtn');
        if (clearAllBtn) {
            this.eventHandlers.clearAllBtn = () => this.clearFilters();
            clearAllBtn.addEventListener('click', this.eventHandlers.clearAllBtn);
        }

        console.log('✅ SitesPage events attached');
    }

    async showAddSiteModal() {
        const modal = new AddSiteModal(this.userProfile, async (formData) => {
            await this.handleAddSite(formData);
        });
        modal.open();
    }

    async handleAddSite(formData) {
        try {
            const createdSite = await siteService.createSite(formData);
            showAlert('Site added successfully!', 'success');
            await this.refreshSites();
        } catch (error) {
            console.error('Failed to add site:', error);
            showAlert('Failed to add site. Please try again.', 'error');
        }
    }

    async refreshSites() {
        showAlert('Refreshing sites...', 'info');
        await this.loadSites();
        this.applyFilters(); // Reapply current filters
        showAlert('Sites refreshed successfully!', 'success');
    }

    applyFilters() {
        this.filteredSites = this.sites.filter(site => {
            // Search filter
            if (this.filters.search) {
                const searchTerm = this.filters.search.toLowerCase();
                const matchesSearch = 
                    site.name?.toLowerCase().includes(searchTerm) ||
                    site.siteId?.toLowerCase().includes(searchTerm) ||
                    site.location?.toLowerCase().includes(searchTerm);
                if (!matchesSearch) return false;
            }

            // Status filter
            if (this.filters.status !== 'all') {
                if (this.filters.status === 'active' && site.status !== 'active') return false;
                if (this.filters.status === 'inactive' && site.status !== 'inactive') return false;
                if (this.filters.status === 'maintenance' && site.maintenanceStatus === 'ok') return false;
            }

            // Region filter
            if (this.filters.region !== 'all') {
                if (site.region !== this.filters.region) return false;
            }

            return true;
        });

        this.currentPage = 1; // Reset to first page
        this.updateUI();
    }

    clearFilters() {
        this.filters = {
            search: '',
            status: 'all',
            region: 'all'
        };
        this.filteredSites = [...this.sites];
        this.currentPage = 1;
        this.updateUI();
    }

    goToPage(page) {
        if (page < 1 || page > Math.ceil(this.filteredSites.length / this.itemsPerPage)) return;
        this.currentPage = page;
        this.updateUI();
    }

    changeView(itemsPerPage) {
        this.itemsPerPage = itemsPerPage;
        this.currentPage = 1;
        this.updateUI();
    }

    updateUI() {
        const container = document.querySelector('.sites-page');
        if (container) {
            container.innerHTML = this.render();
            this.attachEvents();
            this.renderSiteComponents();
        }
    }

    renderSiteComponents() {
        // Clear previous components
        this.siteComponents = [];

        const sites = this.filteredSites.slice(
            (this.currentPage - 1) * this.itemsPerPage,
            this.currentPage * this.itemsPerPage
        );

        sites.forEach(site => {
            const container = document.getElementById(`site-card-${site.id}`);
            if (container) {
                const siteCard = new SiteCard(site);
                container.innerHTML = siteCard.render();
                siteCard.attachEvents();
                this.siteComponents.push(siteCard);
                this.setupSiteCardEvents(siteCard, site.id);
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
    }

    viewSiteDetails(siteId) {
        console.log(`Viewing site ${siteId} details`);
        // Navigate to site details page
        window.location.hash = `site-details/${siteId}`;
    }

    contactSupervisor() {
        showAlert('Contact supervisor feature coming soon!', 'info');
        // In future, this could open email or messaging
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

    removeEventListeners() {
        Object.entries(this.eventHandlers).forEach(([key, handler]) => {
            const element = document.getElementById(key);
            if (element && handler) {
                element.removeEventListener('click', handler);
            }
        });
        this.eventHandlers = {};
    }

    destroy() {
        console.log('🧹 Cleaning up SitesPage...');
        this.removeEventListeners();
        this.siteComponents = [];
    }
}