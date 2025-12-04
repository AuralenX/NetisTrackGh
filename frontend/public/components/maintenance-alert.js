import { formatDate, formatDateTime } from '../src/utils/helpers.js';

export class MaintenanceAlert {
    constructor(alertData) {
        this.alertData = alertData;
        this.element = null;
        this.eventHandlers = {};
    }

    render() {
        const {
            id,
            siteId,
            siteName,
            alertType = 'maintenance',
            severity = 'medium',
            message,
            dueDate,
            remainingHours,
            maintenanceType = 'preventive',
            createdAt,
            acknowledged = false
        } = this.alertData;

        const severityInfo = this.getSeverityInfo(severity);
        const maintenanceInfo = this.getMaintenanceInfo(maintenanceType);
        const timeInfo = this.getTimeInfo(remainingHours);

        return `
            <div class="maintenance-alert ${severity} ${acknowledged ? 'acknowledged' : ''}" 
                 data-alert-id="${id}" 
                 data-site-id="${siteId}">
                
                <!-- Alert Header -->
                <div class="alert-header" style="background: ${severityInfo.bg}; color: ${severityInfo.text};">
                    <div class="alert-severity">
                        <i class="fas ${severityInfo.icon}"></i>
                        <span class="severity-label">${severityInfo.label}</span>
                    </div>
                    
                    ${!acknowledged ? `
                    <div class="alert-actions">
                        <button class="action-btn acknowledge-btn" title="Mark as Acknowledged">
                            <i class="fas fa-check"></i>
                        </button>
                    </div>
                    ` : ''}
                </div>

                <!-- Alert Body -->
                <div class="alert-body">
                    <!-- Site Information -->
                    <div class="site-info">
                        <div class="site-icon">
                            <i class="fas fa-tower-cell"></i>
                        </div>
                        <div class="site-details">
                            <h4 class="site-name">${siteName}</h4>
                            <span class="site-id">Site #${siteId}</span>
                        </div>
                    </div>

                    <!-- Alert Message -->
                    <div class="alert-message">
                        <p><i class="fas fa-exclamation-circle"></i> ${message}</p>
                    </div>

                    <!-- Maintenance Details -->
                    <div class="maintenance-details">
                        <div class="detail-item">
                            <i class="fas ${maintenanceInfo.icon}"></i>
                            <span class="detail-label">Type:</span>
                            <span class="detail-value">${maintenanceInfo.label}</span>
                        </div>
                        
                        ${dueDate ? `
                        <div class="detail-item">
                            <i class="far fa-calendar-alt"></i>
                            <span class="detail-label">Due:</span>
                            <span class="detail-value">${formatDate(dueDate)}</span>
                        </div>
                        ` : ''}
                        
                        ${remainingHours !== undefined ? `
                        <div class="detail-item">
                            <i class="far fa-clock"></i>
                            <span class="detail-label">Time Left:</span>
                            <span class="detail-value ${timeInfo.class}">
                                ${timeInfo.text}
                            </span>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Time Information -->
                    <div class="time-info">
                        <div class="created-at">
                            <i class="far fa-calendar"></i>
                            <span>${formatDateTime(createdAt)}</span>
                        </div>
                        ${acknowledged ? `
                        <div class="acknowledged-badge">
                            <i class="fas fa-check-circle"></i>
                            <span>Acknowledged</span>
                        </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Alert Footer -->
                <div class="alert-footer">
                    <div class="alert-actions-full">
                        ${!acknowledged ? `
                        <button class="action-btn-full schedule-btn" data-action="schedule">
                            <i class="far fa-calendar-plus"></i>
                            <span>Schedule</span>
                        </button>
                        ` : ''}
                        
                        <button class="action-btn-full log-btn" data-action="log">
                            <i class="fas fa-clipboard-check"></i>
                            <span>Log Now</span>
                        </button>
                        
                        <button class="action-btn-full view-site-btn" data-action="viewSite">
                            <i class="fas fa-external-link-alt"></i>
                            <span>View Site</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    getSeverityInfo(severity) {
        const severities = {
            critical: {
                bg: '#fed7d7',
                text: '#c53030',
                icon: 'fa-exclamation-triangle',
                label: 'CRITICAL'
            },
            high: {
                bg: '#feebc8',
                text: '#dd6b20',
                icon: 'fa-exclamation-circle',
                label: 'HIGH'
            },
            medium: {
                bg: '#fefcbf',
                text: '#d69e2e',
                icon: 'fa-exclamation',
                label: 'MEDIUM'
            },
            low: {
                bg: '#c6f6d5',
                text: '#276749',
                icon: 'fa-info-circle',
                label: 'LOW'
            }
        };
        return severities[severity] || severities.medium;
    }

    getMaintenanceInfo(type) {
        const types = {
            preventive: {
                icon: 'fa-shield-alt',
                label: 'Preventive'
            },
            corrective: {
                icon: 'fa-wrench',
                label: 'Corrective'
            },
            emergency: {
                icon: 'fa-ambulance',
                label: 'Emergency'
            },
            routine: {
                icon: 'fa-clipboard-check',
                label: 'Routine'
            }
        };
        return types[type] || { icon: 'fa-tools', label: type };
    }

    getTimeInfo(hours) {
        if (hours === undefined || hours === null) {
            return { text: 'N/A', class: '' };
        }
        
        if (hours <= 0) {
            return { text: 'OVERDUE', class: 'overdue' };
        } else if (hours <= 24) {
            return { text: `${hours}h (Urgent)`, class: 'urgent' };
        } else if (hours <= 72) {
            return { text: `${Math.floor(hours/24)} days`, class: 'warning' };
        } else {
            return { text: `${Math.floor(hours/24)} days`, class: '' };
        }
    }

    attachEvents() {
        if (!this.element) {
            this.element = document.querySelector(`.maintenance-alert[data-alert-id="${this.alertData.id}"]`);
            if (!this.element) return;
        }

        // Acknowledge button
        const acknowledgeBtn = this.element.querySelector('.acknowledge-btn');
        if (acknowledgeBtn) {
            const handler = (e) => {
                e.stopPropagation();
                this.handleAction('acknowledge');
            };
            acknowledgeBtn.addEventListener('click', handler);
            this.eventHandlers.acknowledgeBtn = handler;
        }

        // Action buttons
        const actions = ['schedule', 'log', 'viewSite'];
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

        // Whole alert click
        const alertHandler = (e) => {
            if (!e.target.closest('.action-btn') && !e.target.closest('.action-btn-full')) {
                this.handleAction('details');
            }
        };
        this.element.addEventListener('click', alertHandler);
        this.eventHandlers.alertClick = alertHandler;
    }

    handleAction(action) {
        const events = {
            'acknowledge': 'maintenanceAlertAcknowledge',
            'schedule': 'maintenanceAlertSchedule',
            'log': 'maintenanceAlertLog',
            'viewSite': 'maintenanceAlertViewSite',
            'details': 'maintenanceAlertViewDetails'
        };

        if (events[action]) {
            window.dispatchEvent(new CustomEvent(events[action], {
                detail: { 
                    alertId: this.alertData.id,
                    siteId: this.alertData.siteId,
                    siteName: this.alertData.siteName,
                    alertData: this.alertData
                }
            }));
        }
    }

    updateData(newData) {
        this.alertData = { ...this.alertData, ...newData };
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
            
            const buttons = this.element.querySelectorAll('.action-btn, .action-btn-full');
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

// CSS Styles for Maintenance Alert
export const maintenanceAlertStyles = `
.maintenance-alert {
    background: white;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transition: all 0.3s ease;
    border: 1px solid #e2e8f0;
}

.maintenance-alert:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.maintenance-alert.acknowledged {
    opacity: 0.7;
    border-color: #c6f6d5;
}

.alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
}

.alert-severity {
    display: flex;
    align-items: center;
    gap: 8px;
    font-weight: 600;
    font-size: 13px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.alert-severity i {
    font-size: 16px;
}

.alert-actions {
    display: flex;
    gap: 8px;
}

.action-btn {
    background: none;
    border: none;
    padding: 6px;
    border-radius: 6px;
    cursor: pointer;
    color: inherit;
    transition: all 0.3s ease;
    font-size: 14px;
}

.action-btn:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
}

.alert-body {
    padding: 16px;
}

.site-info {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 16px;
}

.site-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 18px;
}

.site-details {
    flex: 1;
}

.site-name {
    font-size: 16px;
    font-weight: 600;
    color: #2d3748;
    margin-bottom: 4px;
}

.site-id {
    font-size: 12px;
    color: #718096;
    background: #f7fafc;
    padding: 2px 8px;
    border-radius: 4px;
}

.alert-message {
    margin-bottom: 16px;
    padding: 12px;
    background: #f7fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.alert-message p {
    margin: 0;
    color: #4a5568;
    font-size: 14px;
    line-height: 1.5;
    display: flex;
    align-items: flex-start;
    gap: 8px;
}

.alert-message i {
    color: #667eea;
    margin-top: 2px;
}

.maintenance-details {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 12px;
    margin-bottom: 16px;
    padding: 12px;
    background: #f7fafc;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.detail-item {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
}

.detail-item i {
    color: #667eea;
    width: 16px;
    text-align: center;
}

.detail-label {
    font-weight: 600;
    color: #4a5568;
}

.detail-value {
    color: #2d3748;
    font-weight: 500;
    margin-left: auto;
}

.detail-value.overdue {
    color: #e53e3e;
    font-weight: 600;
}

.detail-value.urgent {
    color: #ed8936;
    font-weight: 600;
}

.detail-value.warning {
    color: #ecc94b;
    font-weight: 600;
}

.time-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #a0aec0;
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #e2e8f0;
}

.created-at {
    display: flex;
    align-items: center;
    gap: 6px;
}

.acknowledged-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    background: #c6f6d5;
    color: #276749;
    padding: 4px 8px;
    border-radius: 4px;
    font-weight: 600;
}

.alert-footer {
    padding: 12px 16px;
    border-top: 1px solid #e2e8f0;
    background: #f7fafc;
}

.alert-actions-full {
    display: flex;
    gap: 8px;
}

.action-btn-full {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 10px 16px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    color: #4a5568;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
}

.action-btn-full:hover {
    background: #667eea;
    color: white;
    border-color: #667eea;
    transform: translateY(-2px);
}

.action-btn-full i {
    font-size: 14px;
}

@media (max-width: 640px) {
    .maintenance-details {
        grid-template-columns: 1fr;
    }
    
    .alert-actions-full {
        flex-direction: column;
    }
    
    .action-btn-full {
        width: 100%;
    }
    
    .time-info {
        flex-direction: column;
        gap: 8px;
        align-items: flex-start;
    }
}
`;