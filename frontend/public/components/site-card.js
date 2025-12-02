import { formatDate } from '../src/utils/helpers.js';

export class SiteCard {
    constructor(siteData) {
        this.siteData = siteData;
        this.element = null;
    }

    render() {
        const {
            id,
            name,
            location,
            fuelLevel = 0,
            maintenanceStatus = 'ok',
            lastUpdated,
            status = 'active',
            generatorHours = 0,
            batteryLevel = 0,
            solarStatus = 'inactive'
        } = this.siteData;

        const statusColors = {
            active: { bg: '#c6f6d5', text: '#276749' },
            inactive: { bg: '#fed7d7', text: '#c53030' },
            maintenance: { bg: '#feebc8', text: '#dd6b20' }
        };

        const maintenanceIcons = {
            ok: '✅',
            due_soon: '⚠️',
            overdue: '🔴',
            in_progress: '🔄'
        };

        const maintenanceTexts = {
            ok: 'Maintenance OK',
            due_soon: 'Due Soon',
            overdue: 'Overdue',
            in_progress: 'In Progress'
        };

        const statusColor = statusColors[status] || statusColors.active;

        return `
            <div class="site-card" data-site-id="${id}">
                <!-- Card Header -->
                <div class="site-card-header">
                    <div class="site-header-left">
                        <h4 class="site-name">${name}</h4>
                        <span class="site-id">#${id}</span>
                    </div>
                    <span class="status-badge" style="background: ${statusColor.bg}; color: ${statusColor.text};">
                        ${status.charAt(0).toUpperCase() + status.slice(1)}
                    </span>
                </div>

                <!-- Card Body -->
                <div class="site-card-body">
                    <!-- Location -->
                    <div class="site-location">
                        <span class="location-icon">📍</span>
                        <span class="location-text">${location}</span>
                    </div>

                    <!-- Site Metrics -->
                    <div class="site-metrics">
                        <!-- Fuel Level -->
                        <div class="site-metric">
                            <div class="metric-header">
                                <span class="metric-icon">⛽</span>
                                <span class="metric-label">Fuel</span>
                            </div>
                            <div class="metric-value">
                                <div class="fuel-gauge-mini">
                                    <div class="fuel-bar" style="width: ${fuelLevel}%"></div>
                                    <span class="fuel-text">${fuelLevel}%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Maintenance Status -->
                        <div class="site-metric">
                            <div class="metric-header">
                                <span class="metric-icon">🔧</span>
                                <span class="metric-label">Maintenance</span>
                            </div>
                            <div class="metric-value">
                                <span class="maintenance-status ${maintenanceStatus}">
                                    ${maintenanceIcons[maintenanceStatus]} 
                                    ${maintenanceTexts[maintenanceStatus]}
                                </span>
                            </div>
                        </div>

                        <!-- Generator Hours -->
                        <div class="site-metric">
                            <div class="metric-header">
                                <span class="metric-icon">⏱️</span>
                                <span class="metric-label">Run Hours</span>
                            </div>
                            <div class="metric-value">${generatorHours.toLocaleString()}h</div>
                        </div>

                        <!-- Battery Level -->
                        <div class="site-metric">
                            <div class="metric-header">
                                <span class="metric-icon">🔋</span>
                                <span class="metric-label">Battery</span>
                            </div>
                            <div class="metric-value">${batteryLevel}%</div>
                        </div>
                    </div>

                    <!-- Hybrid System Status -->
                    ${solarStatus !== 'inactive' ? `
                    <div class="hybrid-system">
                        <span class="hybrid-icon">☀️</span>
                        <span class="hybrid-text">Solar Active</span>
                    </div>
                    ` : ''}
                </div>

                <!-- Card Footer -->
                <div class="site-card-footer">
                    <div class="last-updated">
                        <span class="update-icon">🕒</span>
                        <span class="update-text">${formatDate(lastUpdated)}</span>
                    </div>
                    <div class="site-actions">
                        <button class="site-action-btn view-btn" data-action="view" title="View Details">
                            <span class="btn-icon">👁️</span>
                            <span class="btn-text">View</span>
                        </button>
                        <button class="site-action-btn fuel-btn" data-action="fuel" title="Log Fuel">
                            <span class="btn-icon">⛽</span>
                            <span class="btn-text">Fuel</span>
                        </button>
                        <button class="site-action-btn maintenance-btn" data-action="maintenance" title="Log Maintenance">
                            <span class="btn-icon">🔧</span>
                            <span class="btn-text">Maint</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        if (!this.element) {
            this.element = document.querySelector(`.site-card[data-site-id="${this.siteData.id}"]`);
            if (!this.element) return;
        }

        // View button
        const viewBtn = this.element.querySelector('.view-btn');
        if (viewBtn) {
            viewBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onViewDetails();
            });
        }

        // Fuel button
        const fuelBtn = this.element.querySelector('.fuel-btn');
        if (fuelBtn) {
            fuelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onLogFuel();
            });
        }

        // Maintenance button
        const maintenanceBtn = this.element.querySelector('.maintenance-btn');
        if (maintenanceBtn) {
            maintenanceBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onLogMaintenance();
            });
        }

        // Whole card click
        this.element.addEventListener('click', (e) => {
            if (!e.target.closest('.site-action-btn')) {
                this.onViewDetails();
            }
        });
    }

    onViewDetails() {
        console.log('🔍 View site details:', this.siteData.id);
        // Dispatch custom event for the dashboard to handle
        window.dispatchEvent(new CustomEvent('siteViewDetails', {
            detail: { siteId: this.siteData.id }
        }));
    }

    onLogFuel() {
        console.log('⛽ Log fuel for site:', this.siteData.id);
        window.dispatchEvent(new CustomEvent('siteLogFuel', {
            detail: { siteId: this.siteData.id, siteName: this.siteData.name }
        }));
    }

    onLogMaintenance() {
        console.log('🔧 Log maintenance for site:', this.siteData.id);
        window.dispatchEvent(new CustomEvent('siteLogMaintenance', {
            detail: { siteId: this.siteData.id, siteName: this.siteData.name }
        }));
    }

    updateData(newData) {
        this.siteData = { ...this.siteData, ...newData };
        if (this.element) {
            this.element.outerHTML = this.render();
            this.attachEvents();
        }
    }

    destroy() {
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}