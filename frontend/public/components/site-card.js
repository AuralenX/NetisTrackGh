import { formatDate } from '../src/utils/helpers.js';

export class SiteCard {
    constructor(siteData) {
        this.siteData = siteData;
        this.element = null;
        this.eventHandlers = {};
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

        const fuelColor = this.getFuelColor(fuelLevel);
        const statusIcon = this.getStatusIcon(status);
        const maintenanceIcon = this.getMaintenanceIcon(maintenanceStatus);

        return `
            <div class="site-card" data-site-id="${id}">
                <!-- Card Header -->
                <div class="site-card-header">
                    <div class="site-header-left">
                        <div class="site-icon">
                            <i class="fas fa-tower-cell"></i>
                        </div>
                        <div class="site-title">
                            <h4 class="site-name">${name}</h4>
                            <span class="site-id">#${id}</span>
                        </div>
                    </div>
                    <span class="status-badge ${status}">
                        <i class="fas ${statusIcon}"></i> ${status.toUpperCase()}
                    </span>
                </div>

                <!-- Card Body -->
                <div class="site-card-body">
                    <!-- Location -->
                    <div class="site-location">
                        <i class="fas fa-map-marker-alt"></i>
                        <span class="location-text">${location}</span>
                    </div>

                    <!-- Site Metrics -->
                    <div class="site-metrics">
                        <!-- Fuel Level -->
                        <div class="site-metric fuel-metric">
                            <div class="metric-header">
                                <i class="fas fa-gas-pump"></i>
                                <span class="metric-label">Fuel Level</span>
                            </div>
                            <div class="metric-value">
                                <div class="fuel-gauge-container">
                                    <div class="fuel-gauge" data-level="${fuelLevel}">
                                        <div class="fuel-fill" style="width: ${fuelLevel}%; background: ${fuelColor};"></div>
                                        <div class="fuel-percentage">${fuelLevel}%</div>
                                    </div>
                                    <div class="fuel-status">${this.getFuelStatus(fuelLevel)}</div>
                                </div>
                            </div>
                        </div>

                        <!-- Maintenance Status -->
                        <div class="site-metric maintenance-metric">
                            <div class="metric-header">
                                <i class="fas fa-tools"></i>
                                <span class="metric-label">Maintenance</span>
                            </div>
                            <div class="metric-value">
                                <span class="maintenance-status ${maintenanceStatus}">
                                    <i class="fas ${maintenanceIcon}"></i>
                                    ${this.getMaintenanceText(maintenanceStatus)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Additional Metrics -->
                    <div class="additional-metrics">
                        <div class="additional-metric">
                            <i class="fas fa-clock"></i>
                            <span class="metric-value">${generatorHours.toLocaleString()}h</span>
                            <span class="metric-label">Run Hours</span>
                        </div>
                        <div class="additional-metric">
                            <i class="fas fa-battery-three-quarters"></i>
                            <span class="metric-value">${batteryLevel}%</span>
                            <span class="metric-label">Battery</span>
                        </div>
                    </div>

                    <!-- Hybrid System Status -->
                    ${solarStatus !== 'inactive' ? `
                    <div class="hybrid-system">
                        <i class="fas fa-sun"></i>
                        <span>Solar Active</span>
                    </div>
                    ` : ''}
                </div>

                <!-- Card Footer -->
                <div class="site-card-footer">
                    <div class="last-updated">
                        <i class="far fa-clock"></i>
                        <span>${formatDate(lastUpdated)}</span>
                    </div>
                    <div class="site-actions">
                        <button class="site-action-btn view-btn" data-action="view" title="View Details">
                            <i class="fas fa-eye"></i>
                            <span class="btn-text">View</span>
                        </button>
                        <button class="site-action-btn fuel-btn" data-action="fuel" title="Log Fuel">
                            <i class="fas fa-gas-pump"></i>
                            <span class="btn-text">Fuel</span>
                        </button>
                        <button class="site-action-btn maintenance-btn" data-action="maintenance" title="Log Maintenance">
                            <i class="fas fa-tools"></i>
                            <span class="btn-text">Maint</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getFuelColor(level) {
        if (level <= 10) return '#e53e3e'; // Red
        if (level <= 25) return '#ed8936'; // Orange
        if (level <= 50) return '#ecc94b'; // Yellow
        return '#38a169'; // Green
    }

    getFuelStatus(level) {
        if (level <= 10) return 'Critical';
        if (level <= 25) return 'Low';
        if (level <= 50) return 'Medium';
        return 'Good';
    }

    getStatusIcon(status) {
        const icons = {
            'active': 'fa-check-circle',
            'inactive': 'fa-times-circle',
            'maintenance': 'fa-tools',
            'warning': 'fa-exclamation-triangle'
        };
        return icons[status] || 'fa-question-circle';
    }

    getMaintenanceIcon(status) {
        const icons = {
            'ok': 'fa-check-circle',
            'due_soon': 'fa-exclamation-triangle',
            'overdue': 'fa-exclamation-circle',
            'in_progress': 'fa-tools'
        };
        return icons[status] || 'fa-question-circle';
    }

    getMaintenanceText(status) {
        const texts = {
            'ok': 'OK',
            'due_soon': 'Due Soon',
            'overdue': 'Overdue',
            'in_progress': 'In Progress'
        };
        return texts[status] || 'Unknown';
    }

    attachEvents() {
        if (!this.element) {
            this.element = document.querySelector(`.site-card[data-site-id="${this.siteData.id}"]`);
            if (!this.element) return;
        }

        // Action buttons
        const actions = ['view', 'fuel', 'maintenance'];
        actions.forEach(action => {
            const btn = this.element.querySelector(`.${action}-btn`);
            if (btn) {
                const handler = (e) => {
                    e.stopPropagation();
                    this.handleAction(action);
                };
                btn.addEventListener('click', handler);
                this.eventHandlers[`${action}Btn`] = handler;
            }
        });

        // Whole card click
        const cardHandler = (e) => {
            if (!e.target.closest('.site-action-btn')) {
                this.handleAction('view');
            }
        };
        this.element.addEventListener('click', cardHandler);
        this.eventHandlers.cardClick = cardHandler;
    }

    handleAction(action) {
        const events = {
            'view': 'siteViewDetails',
            'fuel': 'siteLogFuel',
            'maintenance': 'siteLogMaintenance'
        };

        if (events[action]) {
            window.dispatchEvent(new CustomEvent(events[action], {
                detail: { 
                    siteId: this.siteData.id,
                    siteName: this.siteData.name,
                    siteData: this.siteData
                }
            }));
        }
    }

    updateData(newData) {
        this.siteData = { ...this.siteData, ...newData };
        if (this.element) {
            this.element.outerHTML = this.render();
            this.attachEvents();
        }
    }

    removeEvents() {
        if (this.element) {
            Object.values(this.eventHandlers).forEach(handler => {
                if (handler) {
                    this.element.removeEventListener('click', handler);
                }
            });
            
            const buttons = this.element.querySelectorAll('.site-action-btn');
            buttons.forEach(btn => {
                btn.replaceWith(btn.cloneNode(true));
            });
        }
        this.eventHandlers = {};
    }

    destroy() {
        this.removeEvents();
        if (this.element) {
            this.element.remove();
            this.element = null;
        }
    }
}