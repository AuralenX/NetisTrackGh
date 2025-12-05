// frontend/src/pages/FuelLogsPage.js
import { showAlert, formatDate, formatCurrency } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';
import { FuelLogModal } from '../modals/FuelLogModal.js';

class FuelLogsPage {
    constructor(userProfile) {
        this.userProfile = userProfile;
        this.fuelLogs = [];
        this.sites = [];
        this.filteredLogs = [];
        this.currentPage = 1;
        this.itemsPerPage = 15;
        this.filters = {
            siteId: 'all',
            startDate: '',
            endDate: '',
            fuelType: 'all'
        };
    }

    async init() {
        console.log('⛽ Fuel logs page initializing...');
        await Promise.all([this.loadFuelLogs(), this.loadSites()]);
        return this;
    }

    async loadFuelLogs() {
        try {
            // This should be replaced with actual API call
            this.fuelLogs = await this.getMockFuelLogs();
            this.applyFilters();
            console.log(`✅ Loaded ${this.fuelLogs.length} fuel logs`);
        } catch (error) {
            console.error('❌ Failed to load fuel logs:', error);
            showAlert('Failed to load fuel logs', 'error');
            this.fuelLogs = [];
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
        this.filteredLogs = this.fuelLogs.filter(log => {
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

            // Fuel type filter
            if (this.filters.fuelType !== 'all' && log.fuelType !== this.filters.fuelType) {
                return false;
            }

            return true;
        });
    }

    render() {
        const totalPages = Math.ceil(this.filteredLogs.length / this.itemsPerPage);
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedLogs = this.filteredLogs.slice(startIndex, endIndex);

        return `
            <div class="fuel-logs-page">
                <!-- Page Header -->
                <div class="page-header">
                    <div class="header-content">
                        <h1 class="page-title">
                            <i class="fas fa-gas-pump"></i> Fuel Logs
                        </h1>
                        <p class="page-subtitle">
                            Track and manage all fuel consumption
                        </p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="addFuelLogBtn">
                            <i class="fas fa-plus"></i> Add Fuel Log
                        </button>
                        <button class="btn btn-secondary" id="exportFuelLogsBtn">
                            <i class="fas fa-download"></i> Export
                        </button>
                    </div>
                </div>

                <!-- Stats Overview -->
                <div class="stats-overview">
                    <div class="stat-card">
                        <div class="stat-value">${this.calculateTotalFuel()} L</div>
                        <div class="stat-label">Total Fuel</div>
                        <div class="stat-trend">
                            <i class="fas fa-chart-line"></i> This month
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${formatCurrency(this.calculateTotalCost())}</div>
                        <div class="stat-label">Total Cost</div>
                        <div class="stat-trend">
                            <i class="fas fa-money-bill-wave"></i> Spent
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.sites.length}</div>
                        <div class="stat-label">Sites</div>
                        <div class="stat-trend">
                            <i class="fas fa-tower-cell"></i> Total
                        </div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${this.calculateAvgConsumption()} L/day</div>
                        <div class="stat-label">Avg Consumption</div>
                        <div class="stat-trend">
                            <i class="fas fa-chart-bar"></i> Daily
                        </div>
                    </div>
                </div>

                <!-- Filters -->
                <div class="filters-card">
                    <h3 class="filters-title">
                        <i class="fas fa-filter"></i> Filters
                    </h3>
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label for="siteFilter"><i class="fas fa-tower-cell"></i> Site</label>
                            <select id="siteFilter" class="filter-select">
                                <option value="all">All Sites</option>
                                ${this.sites.map(site => `
                                    <option value="${site.id}" ${this.filters.siteId === site.id ? 'selected' : ''}>
                                        ${site.name}
                                    </option>
                                `).join('')}
                            </select>
                        </div>
                        
                        <div class="filter-group">
                            <label for="startDate"><i class="far fa-calendar"></i> From Date</label>
                            <input type="date" id="startDate" class="filter-input" 
                                   value="${this.filters.startDate}">
                        </div>
                        
                        <div class="filter-group">
                            <label for="endDate"><i class="far fa-calendar"></i> To Date</label>
                            <input type="date" id="endDate" class="filter-input" 
                                   value="${this.filters.endDate}">
                        </div>
                        
                        <div class="filter-group">
                            <label for="fuelTypeFilter"><i class="fas fa-gas-pump"></i> Fuel Type</label>
                            <select id="fuelTypeFilter" class="filter-select">
                                <option value="all">All Types</option>
                                <option value="diesel" ${this.filters.fuelType === 'diesel' ? 'selected' : ''}>Diesel</option>
                                <option value="petrol" ${this.filters.fuelType === 'petrol' ? 'selected' : ''}>Petrol</option>
                                <option value="hybrid" ${this.filters.fuelType === 'hybrid' ? 'selected' : ''}>Hybrid</option>
                            </select>
                        </div>
                    </div>
                    
                    <div class="filter-actions">
                        <button class="btn btn-secondary" id="applyFiltersBtn">
                            <i class="fas fa-check"></i> Apply Filters
                        </button>
                        <button class="btn btn-outline" id="clearFiltersBtn">
                            <i class="fas fa-times"></i> Clear All
                        </button>
                    </div>
                </div>

                <!-- Fuel Logs Table -->
                <div class="table-container">
                    <div class="table-header">
                        <h3 class="table-title">Recent Fuel Logs</h3>
                        <div class="table-summary">
                            Showing ${paginatedLogs.length} of ${this.filteredLogs.length} logs
                        </div>
                    </div>
                    
                    ${this.renderFuelLogsTable(paginatedLogs)}
                </div>

                <!-- Pagination -->
                ${this.renderPagination(totalPages)}

                <!-- Empty State -->
                ${this.filteredLogs.length === 0 ? this.renderEmptyState() : ''}
            </div>
        `;
    }

    renderFuelLogsTable(logs) {
        if (logs.length === 0) {
            return this.renderEmptyState();
        }

        return `
            <table class="data-table">
                <thead>
                    <tr>
                        <th>Date & Time</th>
                        <th>Site</th>
                        <th>Fuel Amount</th>
                        <th>Fuel Type</th>
                        <th>Cost</th>
                        <th>Technician</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => `
                        <tr>
                            <td>
                                <div class="date-time">
                                    <div class="date">${formatDate(log.date).split('•')[0]}</div>
                                    <div class="time">${formatDate(log.date).split('•')[1]}</div>
                                </div>
                            </td>
                            <td>
                                <div class="site-info">
                                    <div class="site-name">${log.siteName}</div>
                                    <div class="site-id">ID: ${log.siteId}</div>
                                </div>
                            </td>
                            <td>
                                <div class="fuel-amount">
                                    <div class="amount">${log.fuelAmount} L</div>
                                    ${log.meterReading ? `
                                        <div class="meter-reading">
                                            <i class="fas fa-tachometer-alt"></i> ${log.meterReading} hrs
                                        </div>
                                    ` : ''}
                                </div>
                            </td>
                            <td>
                                <span class="fuel-type ${log.fuelType}">
                                    <i class="fas fa-${log.fuelType === 'diesel' ? 'oil-can' : 'gas-pump'}"></i>
                                    ${log.fuelType}
                                </span>
                            </td>
                            <td>
                                ${log.cost ? `
                                    <div class="cost">
                                        <div class="amount">${formatCurrency(log.cost)}</div>
                                        ${log.fuelSupplier ? `
                                            <div class="supplier">${log.fuelSupplier}</div>
                                        ` : ''}
                                    </div>
                                ` : 'N/A'}
                            </td>
                            <td>
                                <div class="technician">
                                    <i class="fas fa-user-hard-hat"></i>
                                    ${log.technician || 'N/A'}
                                </div>
                            </td>
                            <td>
                                <span class="status-badge ${log.status || 'verified'}">
                                    ${log.status || 'Verified'}
                                </span>
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

        return `
            <div class="pagination">
                <button class="pagination-btn ${this.currentPage === 1 ? 'disabled' : ''}" 
                        id="prevPage" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                
                <div class="page-numbers">
                    ${Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                        const pageNum = i + 1;
                        return `
                            <button class="page-number ${pageNum === this.currentPage ? 'active' : ''}" 
                                    data-page="${pageNum}">
                                ${pageNum}
                            </button>
                        `;
                    }).join('')}
                    
                    ${totalPages > 3 && this.currentPage < totalPages - 1 ? `
                        <span class="page-dots">...</span>
                    ` : ''}
                    
                    ${totalPages > 3 && this.currentPage < totalPages ? `
                        <button class="page-number ${this.currentPage === totalPages ? 'active' : ''}" 
                                data-page="${totalPages}">
                            ${totalPages}
                        </button>
                    ` : ''}
                </div>
                
                <button class="pagination-btn ${this.currentPage === totalPages ? 'disabled' : ''}" 
                        id="nextPage" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-gas-pump"></i>
                </div>
                <h3 class="empty-title">No Fuel Logs Found</h3>
                <p class="empty-description">
                    ${this.filters.siteId !== 'all' || this.filters.startDate || this.filters.endDate 
                        ? 'No fuel logs match your current filters. Try adjusting your search criteria.' 
                        : 'No fuel logs have been recorded yet. Start by adding your first fuel log.'}
                </p>
                <button class="btn btn-primary" id="addFirstFuelLogBtn">
                    <i class="fas fa-plus"></i> Add First Fuel Log
                </button>
            </div>
        `;
    }

    calculateTotalFuel() {
        return this.filteredLogs.reduce((total, log) => total + (log.fuelAmount || 0), 0);
    }

    calculateTotalCost() {
        return this.filteredLogs.reduce((total, log) => total + (log.cost || 0), 0);
    }

    calculateAvgConsumption() {
        if (this.filteredLogs.length === 0) return 0;
        const totalFuel = this.calculateTotalFuel();
        const days = 30; // Default to last 30 days
        return (totalFuel / days).toFixed(1);
    }

    async getMockFuelLogs() {
        // Mock data - replace with actual API call
        return [
            {
                id: '1',
                siteId: '600545',
                siteName: 'Accra Central Tower',
                date: '2024-01-15T10:30:00.000Z',
                fuelAmount: 150,
                fuelType: 'diesel',
                cost: 1500,
                fuelSupplier: 'Shell Ghana',
                meterReading: 1520,
                technician: 'John Doe',
                status: 'verified',
                notes: 'Regular refill'
            },
            {
                id: '2',
                siteId: '600546',
                siteName: 'Kumasi North Site',
                date: '2024-01-14T14:20:00.000Z',
                fuelAmount: 200,
                fuelType: 'diesel',
                cost: 2000,
                technician: 'Jane Smith',
                status: 'pending',
                notes: 'Emergency refill'
            }
        ];
    }

    attachEvents() {
        // Add Fuel Log Button
        const addFuelLogBtn = document.getElementById('addFuelLogBtn');
        if (addFuelLogBtn) {
            addFuelLogBtn.addEventListener('click', () => this.showAddFuelLogForm());
        }

        // Add First Fuel Log Button
        const addFirstBtn = document.getElementById('addFirstFuelLogBtn');
        if (addFirstBtn) {
            addFirstBtn.addEventListener('click', () => this.showAddFuelLogForm());
        }

        // Export Button
        const exportBtn = document.getElementById('exportFuelLogsBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportFuelLogs());
        }

        // Filter Controls
        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener('click', () => {
                this.filters.siteId = document.getElementById('siteFilter').value;
                this.filters.startDate = document.getElementById('startDate').value;
                this.filters.endDate = document.getElementById('endDate').value;
                this.filters.fuelType = document.getElementById('fuelTypeFilter').value;
                this.currentPage = 1;
                this.applyFilters();
                this.updateUI();
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener('click', () => {
                this.filters = { siteId: 'all', startDate: '', endDate: '', fuelType: 'all' };
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

    showAddFuelLogForm() {
        // Show site selector first
        if (this.sites.length === 0) {
            showAlert('No sites available to log fuel', 'warning');
            return;
        }

        // You can create a FuelLogModal similar to AddSiteModal
        showAlert('Fuel log form will be implemented', 'info');
    }

    exportFuelLogs() {
        showAlert('Export feature will be implemented', 'info');
    }

    handleTableAction(action, logId) {
        const log = this.fuelLogs.find(l => l.id === logId);
        if (!log) return;

        switch(action) {
            case 'view':
                this.viewFuelLogDetails(log);
                break;
            case 'edit':
                this.editFuelLog(log);
                break;
            case 'delete':
                this.deleteFuelLog(log);
                break;
        }
    }

    viewFuelLogDetails(log) {
        showAlert(`Viewing fuel log for ${log.siteName}`, 'info');
    }

    editFuelLog(log) {
        showAlert(`Editing fuel log for ${log.siteName}`, 'info');
    }

    async deleteFuelLog(log) {
        if (confirm(`Are you sure you want to delete this fuel log for ${log.siteName}?`)) {
            try {
                // API call to delete fuel log
                showAlert('Fuel log deleted successfully', 'success');
                await this.loadFuelLogs();
                this.updateUI();
            } catch (error) {
                showAlert('Failed to delete fuel log', 'error');
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
        const container = document.querySelector('.fuel-logs-page');
        if (container) {
            container.innerHTML = this.render();
            this.attachEvents();
        }
    }

    destroy() {
        console.log('🧹 Cleaning up FuelLogsPage...');
    }
}

export default FuelLogsPage;