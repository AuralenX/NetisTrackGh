// frontend/src/pages/FuelLogsPage.js
import { showAlert, formatDate, formatTime, formatCurrency } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';
import FuelLogModal from '../modals/FuelLogModal.js';

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
        await Promise.all([this.loadSites(), this.loadFuelLogs()]);
        return this;
    }

    async loadSites() {
        try {
            this.sites = await siteService.getSites();
        } catch (error) {
            console.error('Failed to load sites', error);
            this.sites = [];
        }
    }

    async loadFuelLogs() {
        try {
            const siteId = this.filters.siteId !== 'all' ? this.filters.siteId : null;

            if (siteId) {
                this.fuelLogs = await siteService.getFuelLogs(siteId);
            } else {
                const allLogs = [];
                for (const s of this.sites) {
                    try {
                        const logs = await siteService.getFuelLogs(s.siteId);
                        if (Array.isArray(logs)) allLogs.push(...logs);
                    } catch (e) {
                        console.warn('Failed loading logs for', s.siteId, e);
                    }
                }
                this.fuelLogs = allLogs;
            }

            this.fuelLogs = Array.isArray(this.fuelLogs) ? this.fuelLogs : [];
            this.applyFilters();
        } catch (error) {
            console.error('Failed to load fuel logs', error);
            showAlert('Failed to load fuel logs', 'error');
            this.fuelLogs = [];
            this.filteredLogs = [];
        }
    }

    applyFilters() {
        this.filteredLogs = this.fuelLogs.filter(log => {
            if (this.filters.siteId !== 'all' && log.siteId !== this.filters.siteId) return false;
            if (this.filters.startDate && new Date(log.date) < new Date(this.filters.startDate)) return false;
            if (this.filters.endDate && new Date(log.date) > new Date(this.filters.endDate)) return false;
            if (this.filters.fuelType !== 'all' && log.fuelType !== this.filters.fuelType) return false;
            return true;
        });
        this.currentPage = 1;
    }

    render() {
        const totalPages = Math.max(1, Math.ceil(this.filteredLogs.length / this.itemsPerPage));
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const paginatedLogs = this.filteredLogs.slice(startIndex, endIndex);

        const siteOptions = this.sites.map(s => `<option value="${s.siteId}">${s.name} (${s.siteId})</option>`).join('');

        return `
            <div class="fuel-logs-page">
                <div class="page-header">
                    <div class="header-content">
                        <h1 class="page-title"><i class="fas fa-gas-pump"></i> Fuel Logs</h1>
                        <p class="page-subtitle">Track and manage all fuel consumption</p>
                    </div>
                    <div class="header-actions">
                        <button class="btn btn-primary" id="addFuelLogBtn"><i class="fas fa-plus"></i> Add Fuel Log</button>
                        <button class="btn btn-secondary" id="exportFuelLogsBtn"><i class="fas fa-download"></i> Export</button>
                    </div>
                </div>

                <div class="filters-section">
                    <div class="filters-grid">
                        <div class="filter-group">
                            <label class="filter-label">Site</label>
                            <select id="siteFilter" class="filter-input"><option value="all">All Sites</option>${siteOptions}</select>
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Start Date</label>
                            <input type="date" id="startDate" class="filter-input" value="${this.filters.startDate || ''}" />
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">End Date</label>
                            <input type="date" id="endDate" class="filter-input" value="${this.filters.endDate || ''}" />
                        </div>
                        <div class="filter-group">
                            <label class="filter-label">Fuel Type</label>
                            <select id="fuelTypeFilter" class="filter-input">
                                <option value="all">All</option>
                                <option value="diesel">Diesel</option>
                                <option value="petrol">Petrol</option>
                            </select>
                        </div>
                        <div class="filter-actions">
                            <button class="btn btn-primary" id="applyFiltersBtn"><i class="fas fa-filter"></i> Apply</button>
                            <button class="btn btn-secondary" id="clearFiltersBtn"><i class="fas fa-times"></i> Clear</button>
                        </div>
                    </div>
                </div>

                <div class="data-display">
                    <div class="data-summary">
                        <div class="summary-item"><span class="label">Total Logs:</span><span class="value">${this.filteredLogs.length}</span></div>
                        <div class="summary-item"><span class="label">This Page:</span><span class="value">${paginatedLogs.length}</span></div>
                        <div class="summary-item"><span class="label">Page:</span><span class="value">${this.currentPage} / ${totalPages}</span></div>
                    </div>

                    ${this.renderFuelLogsTable(paginatedLogs)}
                    ${this.renderPagination(totalPages)}

                    ${this.filteredLogs.length === 0 ? this.renderEmptyState() : ''}
                </div>
            </div>
        `;
    }

    renderFuelLogsTable(logs) {
        if (!logs || logs.length === 0) return this.renderEmptyState();

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
                            <td><div class="date-time"><div class="date">${formatDate(log.date)}</div><div class="time">${formatTime(log.date)}</div></div></td>
                            <td><div class="site-info"><div class="site-name">${log.siteName}</div><div class="site-id">ID: ${log.siteId}</div></div></td>
                            <td><div class="fuel-amount"><div class="amount">${log.fuelAmount} L</div>${log.meterReading ? `<div class="meter-reading"><i class="fas fa-tachometer-alt"></i> ${log.meterReading} hrs</div>` : ''}</div></td>
                            <td><span class="fuel-type">${log.fuelType || 'N/A'}</span></td>
                            <td>${log.cost ? formatCurrency(log.cost) : 'N/A'}</td>
                            <td>${log.technician || 'N/A'}</td>
                            <td><span class="status-badge">${log.status || 'Verified'}</span></td>
                            <td>
                                <div class="table-actions">
                                    <button class="btn-icon" data-action="view" data-log-id="${log.id}" title="View Details"><i class="fas fa-eye"></i></button>
                                    <button class="btn-icon" data-action="edit" data-log-id="${log.id}" title="Edit"><i class="fas fa-edit"></i></button>
                                    <button class="btn-icon" data-action="delete" data-log-id="${log.id}" title="Delete"><i class="fas fa-trash"></i></button>
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
        for (let i = 1; i <= totalPages; i++) pages.push(`<button class="page-number ${i === this.currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`);

        return `
            <div class="pagination">
                <button id="prevPage" class="btn-pagination" ${this.currentPage === 1 ? 'disabled' : ''}><i class="fas fa-chevron-left"></i></button>
                <div class="page-numbers">${pages.join('')}</div>
                <button id="nextPage" class="btn-pagination" ${this.currentPage === totalPages ? 'disabled' : ''}><i class="fas fa-chevron-right"></i></button>
            </div>
        `;
    }

    renderEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-icon"><i class="fas fa-inbox"></i></div>
                <h3>No Fuel Logs Found</h3>
                <p>No fuel logs have been recorded yet. Start by adding your first fuel log.</p>
                <button class="btn btn-primary" id="addFirstFuelLogBtn"><i class="fas fa-plus"></i> Log Your First Fuel</button>
            </div>
        `;
    }

    calculateTotalFuel() {
        return this.filteredLogs.reduce((sum, l) => sum + (parseFloat(l.fuelAmount) || 0), 0);
    }

    calculateTotalCost() {
        return this.filteredLogs.reduce((sum, l) => sum + (parseFloat(l.cost) || 0), 0);
    }

    attachEvents() {
        const addFuelLogBtn = document.getElementById('addFuelLogBtn');
        if (addFuelLogBtn) addFuelLogBtn.addEventListener('click', () => this.showAddFuelLogForm());

        const addFirstBtn = document.getElementById('addFirstFuelLogBtn');
        if (addFirstBtn) addFirstBtn.addEventListener('click', () => this.showAddFuelLogForm());

        const exportBtn = document.getElementById('exportFuelLogsBtn');
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportFuelLogs());

        const applyFiltersBtn = document.getElementById('applyFiltersBtn');
        const clearFiltersBtn = document.getElementById('clearFiltersBtn');

        if (applyFiltersBtn) applyFiltersBtn.addEventListener('click', () => {
            this.filters.siteId = document.getElementById('siteFilter').value;
            this.filters.startDate = document.getElementById('startDate').value;
            this.filters.endDate = document.getElementById('endDate').value;
            this.filters.fuelType = document.getElementById('fuelTypeFilter').value;
            this.applyFilters();
            this.updateUI();
        });

        if (clearFiltersBtn) clearFiltersBtn.addEventListener('click', () => {
            this.filters = { siteId: 'all', startDate: '', endDate: '', fuelType: 'all' };
            this.applyFilters();
            this.updateUI();
        });

        document.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.target.closest('[data-action]').dataset.action;
                const logId = e.target.closest('[data-action]').dataset.logId;
                this.handleTableAction(action, logId);
            });
        });

        this.attachPaginationEvents();
    }

    showAddFuelLogForm() {
        if (this.sites.length === 0) { showAlert('No sites available to log fuel', 'warning'); return; }
        if (this.sites.length === 1) {
            const s = this.sites[0];
            const modal = new FuelLogModal(s.siteId, s.name, this.userProfile, async () => { await this.handleFuelLogAdded(); });
            modal.open();
            return;
        }
        this.showFuelSiteSelector();
    }

    async showFuelSiteSelector() {
        const html = `<div class="site-selector"><h3>Select Site for Fuel Log</h3><div class="site-options">${this.sites.map(s => `<div class="site-option" data-site-id="${s.siteId}"><strong>${s.name}</strong> (${s.siteId})</div>`).join('')}</div></div>`;
        const modalModule = await import('../../components/modal.js');
        const modal = new modalModule.Modal({ id: 'fuelSiteSelectorModal', title: 'Select Site', content: html, size: 'sm', confirmText: 'Select', cancelText: 'Cancel' });
        modal.open();

        setTimeout(() => {
            document.querySelectorAll('.site-option').forEach(opt => {
                opt.addEventListener('click', (e) => {
                    const siteId = e.currentTarget.dataset.siteId;
                    const site = this.sites.find(s => s.siteId === siteId);
                    modal.close();
                    const fuelModal = new FuelLogModal(site.siteId, site.name, this.userProfile, async () => { await this.handleFuelLogAdded(); });
                    fuelModal.open();
                });
            });
        }, 50);
    }

    async handleFuelLogAdded() {
        showAlert('✅ Fuel log added', 'success');
        await this.loadFuelLogs();
        this.updateUI();
    }

    exportFuelLogs() { showAlert('Export feature coming soon', 'info'); }

    handleTableAction(action, logId) {
        const log = this.fuelLogs.find(l => l.id === logId);
        if (!log) return;
        if (action === 'view') this.viewFuelLogDetails(log);
        if (action === 'edit') this.editFuelLog(log);
        if (action === 'delete') this.deleteFuelLog(log);
    }

    viewFuelLogDetails(log) { showAlert(`Viewing fuel log for ${log.siteName}`, 'info'); }
    editFuelLog(log) { showAlert(`Editing fuel log for ${log.siteName}`, 'info'); }

    async deleteFuelLog(log) {
        if (!confirm(`Delete fuel log for ${log.siteName}?`)) return;
        try {
            await siteService.deleteFuelLog(log.siteId, log.id);
            showAlert('Fuel log deleted', 'success');
            await this.loadFuelLogs();
            this.updateUI();
        } catch (error) {
            console.error('Delete failed', error);
            showAlert('Failed to delete fuel log', 'error');
        }
    }

    attachPaginationEvents() {
        document.querySelectorAll('.page-number').forEach(btn => btn.addEventListener('click', (e) => { this.currentPage = parseInt(e.target.dataset.page); this.updateUI(); }));
        const prev = document.getElementById('prevPage');
        const next = document.getElementById('nextPage');
        if (prev) prev.addEventListener('click', () => { if (this.currentPage > 1) { this.currentPage--; this.updateUI(); } });
        if (next) next.addEventListener('click', () => { const total = Math.ceil(this.filteredLogs.length / this.itemsPerPage); if (this.currentPage < total) { this.currentPage++; this.updateUI(); } });
    }

    updateUI() {
        const container = document.querySelector('.fuel-logs-page');
        if (container) { container.innerHTML = this.render(); this.attachEvents(); }
    }

    destroy() { this.fuelLogs = []; this.sites = []; this.filteredLogs = []; }
}

export default FuelLogsPage;

                        