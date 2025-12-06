// frontend/src/pages/MaintenancePage.js
import { showAlert, formatDate, formatTime, formatCurrency } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';
import MaintenanceLogModal from '../modals/MaintenanceLogModal.js';

class MaintenancePage {
    constructor(userProfile) {
        this.userProfile = userProfile;
        this.maintenanceLogs = [];
        this.sites = [];
        this.filteredLogs = [];
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.filters = {
            siteId: 'all',
            startDate: '',
            endDate: '',
            maintenanceType: 'all',
            status: 'all'
        };
    }

    async init() {
        console.log('🔧 Maintenance page initializing...');
        await Promise.all([this.loadMaintenanceLogs(), this.loadSites()]);
        return this;
    }

    async loadMaintenanceLogs() {
        try {
            // Get selected site from filters or load all
            const siteId = this.filters.siteId !== 'all' ? this.filters.siteId : null;
            
            // Call actual API
            if (siteId) {
                this.maintenanceLogs = await siteService.getMaintenanceLogs(siteId);
            } else {
                // Load maintenance logs from all assigned sites
                const allSiteLogs = [];
                for (const site of this.sites) {
                    try {
                        const logs = await siteService.getMaintenanceLogs(site.siteId);
                        allSiteLogs.push(...logs);
                    } catch (e) {
                        console.warn(`Failed to load logs for site ${site.siteId}`, e);
                    }
                }
                this.maintenanceLogs = allSiteLogs;
            }
            
            this.maintenanceLogs = Array.isArray(this.maintenanceLogs) ? this.maintenanceLogs : [];
            this.applyFilters();
            console.log(`✅ Loaded ${this.maintenanceLogs.length} maintenance logs`);
        } catch (error) {
            console.error('❌ Failed to load maintenance logs:', error);
            showAlert('Failed to load maintenance logs', 'error');
            this.maintenanceLogs = [];
            this.filteredLogs = [];
        }
    }

    async loadSites() {
        try {
            this.sites = await siteService.getSites();
        } catch (error) {
            console.error('❌ Failed to load sites:', error);
            this.sites = [];
        }
    }

    applyFilters() {
        this.filteredLogs = this.maintenanceLogs.filter(log => {
            // Site filter
            if (this.filters.siteId !== 'all' && log.siteId !== this.filters.siteId) {
                return false;
            }

            // Date range filter
            if (this.filters.startDate && new Date(log.date) < new Date(this.filters.startDate)) {
                return false;
            }
            if (this.filters.endDate && new Date(log.date) > new Date(this.filters.endDate)) {
                return false;
            }

            // Maintenance type filter
            if (this.filters.maintenanceType !== 'all' && log.maintenanceType !== this.filters.maintenanceType) {
                return false;
            }

            // Status filter
            if (this.filters.status !== 'all' && log.status !== this.filters.status) {
                return false;
            }

            return true;
        });

        this.currentPage = 1;
    }

    render() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedLogs = this.filteredLogs.slice(startIndex, endIndex);

        const siteOptions = this.sites.map(s => `
            <option value="${s.siteId}">${s.name} (${s.siteId})</option>
        `).join('');

        return `
            <div class="maintenance-logs-page">
                <!-- Page Header -->
                <div class="page-header">
                    <div class="header-content">
                        <h1 class="page-title">
                            <i class="fas fa-wrench"></i> Maintenance Logs
                        </h1>
                        <p class="page-subtitle">
                            Track and manage all maintenance activities
                        </p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="addMaintenanceLogBtn">
                            <i class="fas fa-plus"></i> Log Maintenance
                        </button>
                        <button class="btn btn-secondary" id="exportMaintenanceLogsBtn">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <!-- Filters Section -->
                <div class="filters-section">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label class="filter-label">Site</label>
                            <select id="siteFilter" class="filter-input">
                                <option value="all">All Sites</option>
                                ${siteOptions}
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">Start Date</label>
                            <input type="date" id="startDate" class="filter-input" />
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">End Date</label>
                            <input type="date" id="endDate" class="filter-input" />
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">Type</label>
                            <select id="maintenanceTypeFilter" class="filter-input">
                                <option value="all">All Types</option>
                                <option value="routine">Routine</option>
                                <option value="preventive">Preventive</option>
                                <option value="corrective">Corrective</option>
                                <option value="emergency">Emergency</option>
                            </select>
                        </div>

                        <div class="filter-group">
                            <label class="filter-label">Status</label>
                            <select id="statusFilter" class="filter-input">
                                <option value="all">All Status</option>
                                <option value="scheduled">Scheduled</option>
                                <option value="in-progress">In Progress</option>
                                <option value="completed">Completed</option>
                                <option value="cancelled">Cancelled</option>
                            </select>
                        </div>

                        <div class="filter-actions">
                            <button class="btn btn-primary" id="applyFiltersBtn">
                                <i class="fas fa-filter"></i> Apply
                            </button>
                            <button class="btn btn-secondary" id="clearFiltersBtn">
                                <i class="fas fa-times"></i> Clear
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Data Display -->
                <div class="data-display">
                    <div class="data-summary">
                        <div class="summary-item">
                            <span class="label">Total Logs:</span>
                            <span class="value">${this.filteredLogs.length}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">This Page:</span>
                            <span class="value">${paginatedLogs.length}</span>
                        </div>
                        <div class="summary-item">
                            <span class="label">Page:</span>
                            <span class="value">${this.currentPage} / ${totalPages || 1}</span>
                        </div>
                    </div>

                    ${this.renderMaintenanceLogsTable(paginatedLogs)}
                    ${this.renderPagination(totalPages)}

                    <!-- Empty State -->
                    ${this.filteredLogs.length === 0 ? this.renderEmptyState() : ''}
                </div>
            </div>
        `;
    }

    renderMaintenanceLogsTable(logs) {
        if (logs.length === 0) {
            return this.renderEmptyState();
        }

        const typeIcons = {
            'routine': 'fa-calendar-check',
            'preventive': 'fa-shield-alt',
            'corrective': 'fa-tools',
            'emergency': 'fa-exclamation-triangle'
        };

        const statusColors = {
            'scheduled': 'info',
            'in-progress': 'warning',
            'completed': 'success',
            'cancelled': 'danger'
        };

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Site</th>
                        <th>Type</th>
                        <th>Title</th>
                        <th>Status</th>
                        <th>Technician</th>
                        <th>Cost</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>
                                <div class="date-time">
                                    <div class="date">${formatDate(log.completedDate || log.createdAt)}</div>
                                    <div class="time">${formatTime(log.completedDate || log.createdAt)}</div>
                                </div>
                            </td>
                            <td>
                                <div class="site-info">
                                    <div class="site-name">${log.siteName}</div>
                                    <div class="site-id">ID: ${log.siteId}</div>
                                </div>
                            </td>
                            <td>
                                <span class="maintenance-type ${log.maintenanceType}">
                                    <i class="fas ${typeIcons[log.maintenanceType] || 'fa-wrench'}"></i>
                                    ${log.maintenanceType}
                                </span>
                            </td>
                            <td>
                                <div class="maintenance-title">${log.title}</div>
                                <div class="maintenance-desc" title="${log.description}">${log.description?.substring(0, 50)}...</div>
                            </td>
                            <td>
                                <span class="status-badge ${statusColors[log.status] || 'info'}">
                                    ${log.status || 'Pending'}
                                </span>
                            </td>
                            <td>
                                <div class="technician">
                                    <i class="fas fa-user-hard-hat"></i>
                                    ${log.technicianName || log.technicianId || 'N/A'}
                                </div>
                            </td>
                            <td>
                                ${log.totalCost ? `
                                    <div class="cost">
                                        ${formatCurrency(log.totalCost)}
                                    </div>
                                ` : 'N/A'}
                            </td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn-icon" data-action="view" data-log-id="${log.id}" title="View Details">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="btn-icon" data-action="edit" data-log-id="${log.id}" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn-icon" data-action="delete" data-log-id="${log.id}" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    renderPagination(totalPages) {
        if (totalPages <= 1) return '';

        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(`
                <button class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">
                    ${i}
                </button>
            `);
        }

        return `
            <div class="pagination">
                <button id="prevPage" class="btn-pagination" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i> Previous
                </button>
                <div class="page-numbers">
                    ${pages.join('')}
                </div>
                <button id="nextPage" class="btn-pagination" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    Next <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-inbox"></i>
                </div>
                <h3>No Maintenance Logs Found</h3>
                <p>Start by logging maintenance activities for your sites</p>
                <button class="btn btn-primary" id="addFirstMaintenanceLogBtn">
                    <i class="fas fa-plus"></i> Log Your First Maintenance
                </button>
            </div>
        `;
    }

    attachEvents() {
        // Add Maintenance Log Button
        const addMaintenanceLogBtn = document.getElementById('addMaintenanceLogBtn');
        if (addMaintenanceLogBtn) {
            addMaintenanceLogBtn.addEventListener('click', () => this.showAddMaintenanceLogForm());
        }

        // Add First Maintenance Log Button
        const addFirstBtn = document.getElementById('addFirstMaintenanceLogBtn');
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', () => this.showAddMaintenanceLogForm());
        }

        // Export Button
        const exportBtn = document.getElementById('exportMaintenanceLogsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportMaintenanceLogs());
        }

        // Filter Controls
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.filters.siteId = document.getElementById('siteFilter').value;
                this.filters.startDate = document.getElementById('startDate').value;
                this.filters.endDate = document.getElementById('endDate').value;
                this.filters.maintenanceType = document.getElementById('maintenanceTypeFilter').value;
                this.filters.status = document.getElementById('statusFilter').value;
                this.currentPage = 1;
                this.applyFilters();
                this.updateUI();
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.filters = { siteId: 'all', startDate: '', endDate: '', maintenanceType: 'all', status: 'all' };
                this.currentPage = 1;
                this.applyFilters();
                this.updateUI();
            });
        }

        // Table Actions
        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                const logId = e.target.closest('[data-action]').dataset.logId;
                this.handleTableAction(action, logId);
            });
        });

        // Pagination
        this.attachPaginationEvents();
    }

    showAddMaintenanceLogForm() {
        // Show site selector first
        if (this.sites.length === 0) {
            showAlert('No sites available to log maintenance', 'warning');
            return;
        }

        // If only one site, open form directly
        if (this.sites.length === 1) {
            const site = this.sites[0];
            const modal = new MaintenanceLogModal(site.siteId, site.name, this.userProfile, async () => {
                await this.handleMaintenanceLogAdded();
            });
            modal.open();
            return;
        }

        // Multiple sites - show selector
        this.showMaintenanceSiteSelector();
    }

    showMaintenanceSiteSelector() {
        // Create simple site selector
        const sites = this.sites.map(s => `
            <div class="site-option" data-site-id="${s.siteId}">
                <strong>${s.name}</strong> (${s.siteId})
            </div>
        `).join('');

        const html = `
            <div class="site-selector">
                <h3>Select Site for Maintenance Log</h3>
                <div class="site-options">
                    ${sites}
                </div>
            </div>
        `;

        // Show in modal - async import
        import('../../components/modal.js').then(({ Modal }) => {
            const modal = new Modal({
                id: 'maintenanceSiteSelectorModal',
                title: 'Select Site',
                content: html,
                size: 'sm',
                confirmText: 'Select',
                cancelText: 'Cancel'
            });

            modal.open();

            // Handle site selection
            document.querySelectorAll('.site-option').forEach(option => {
                option.addEventListener('click', (e) => {
                    const siteId = e.currentTarget.dataset.siteId;
                    const site = this.sites.find(s => s.siteId === siteId);
                    modal.close();
                    
                    const maintenanceModal = new MaintenanceLogModal(site.siteId, site.name, this.userProfile, async () => {
                        await this.handleMaintenanceLogAdded();
                    });
                    maintenanceModal.open();
                });
            });
        });
    }

    async handleMaintenanceLogAdded() {
        showAlert('✅ Maintenance log added successfully!', 'success');
        await this.loadMaintenanceLogs();
        this.updateUI();
    }

    exportMaintenanceLogs() {
        showAlert('Export feature will be implemented', 'info');
    }

    handleTableAction(action, logId) {
        const log = this.maintenanceLogs.find(l => l.id === logId);
        if (!log) return;

        switch(action) {
            case 'view':
                this.viewMaintenanceLogDetails(log);
                break;
            case 'edit':
                this.editMaintenanceLog(log);
                break;
            case 'delete':
                this.deleteMaintenanceLog(log);
                break;
        }
    }

    viewMaintenanceLogDetails(log) {
        showAlert(`Viewing maintenance log: ${log.title}`, 'info');
    }

    editMaintenanceLog(log) {
        showAlert(`Editing maintenance log: ${log.title}`, 'info');
    }

    async deleteMaintenanceLog(log) {
        if (confirm(`Are you sure you want to delete this maintenance log: ${log.title}?`)) {
            try {
                await siteService.deleteMaintenanceLog(log.siteId, log.id);
                showAlert('Maintenance log deleted successfully', 'success');
                await this.loadMaintenanceLogs();
                this.updateUI();
            } catch (error) {
                console.error('Delete error:', error);
                showAlert('Failed to delete maintenance log', 'error');
            }
        }
    }

    attachPaginationEvents() {
        document.querySelectorAll('.page-number').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPage = parseInt(e.target.dataset.page);
                this.updateUI();
            });
        });

        const prevPageBtn = document.getElementById('prevPage');
        const nextPageBtn = document.getElementById('nextPage');

        if (prevPageBtn) {
            prevPageBtn.addEventListener('click', () => {
                if (this.currentPage > 1) {
                    this.currentPage--;
                    this.updateUI();
                }
            });
        }

        if (nextPageBtn) {
            nextPageBtn.addEventListener('click', () => {
                const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
                if (this.currentPage < totalPages) {
                    this.currentPage++;
                    this.updateUI();
                }
            });
        }
    }

    updateUI() {
        const container = document.querySelector('.maintenance-logs-page');
        if (container) {
            container.innerHTML = this.render();
            this.attachEvents();
        }
    }

    destroy() {
        console.log('🧹 Cleaning up MaintenancePage...');
    }
}

export default MaintenancePage;
