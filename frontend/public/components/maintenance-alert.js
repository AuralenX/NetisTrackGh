import { formatDate, formatDateTime } from '../src/utils/helpers.js';

export class MaintenanceAlert {
    constructor(alertData) {
        this.alertData = alertData;
        this.element = null;
    }

    render() {
        const {
            id,
            siteId,
            siteName,
            alertType,
            severity,
            message,
            dueDate,
            remainingHours,
            maintenanceType,
            createdAt,
            acknowledged = false
        } = this.alertData;

        const severityColors = {
            critical: { bg: '#fed7d7', text: '#c53030', icon: '🔴', label: 'CRITICAL' },
            high: { bg: '#feebc8', text: '#dd6b20', icon: '⚠️', label: 'HIGH' },
            medium: { bg: '#fefcbf', text: '#d69e2e', icon: '⚠️', label: 'MEDIUM' },
            low: { bg: '#c6f6d5', text: '#276749', icon: 'ℹ️', label: 'LOW' }
        };

        const maintenanceTypes = {
            preventive: 'Preventive Maintenance',
            corrective: 'Corrective Maintenance',
            emergency: 'Emergency Repair',
            routine: 'Routine Check'
        };

        const severityInfo = severityColors[severity] || severityColors.medium;

        return `
            <div class="maintenance-alert ${severity} ${acknowledged ? 'acknowledged' : ''}" 
                 data-alert-id="${id}" 
                 data-site-id="${siteId}">
                
                <!-- Alert Header -->
                <div class="alert-header">
                    <div class="alert-severity" style="background: ${severityInfo.bg}; color: ${severityInfo.text};">
                        <span class="severity-icon">${severityInfo.icon}</span>
                        <span class="severity-label">${severityInfo.label}</span>
                    </div>
                    
                    <div class="alert-actions">
                        ${!acknowledged ? `
                        <button class="action-btn acknowledge-btn" title="Mark as Acknowledged">
                            <span class="btn-icon">✅</span>
                        </button>
                        ` : ''}
                        
                        <button class="action-btn details-btn" title="View Details">
                            <span class="btn-icon">👁️</span>
                        </button>
                    </div>
                </div>

                <!-- Alert Body -->
                <div class="alert-body">
                    <!-- Site Information -->
                    <div class="site-info">
                        <h4 class="site-name">${siteName}</h4>
                        <span class="site-id">Site ID: ${siteId}</span>
                    </div>

                    <!-- Alert Message -->
                    <div class="alert-message">
                        <p>${message}</p>
                    </div>

                    <!-- Maintenance Details -->
                    <div class="maintenance-details">
                        <div class="detail-item">
                            <span class="detail-label">Type:</span>
                            <span class="detail-value">${maintenanceTypes[maintenanceType] || maintenanceType}</span>
                        </div>
                        
                        ${dueDate ? `
                        <div class="detail-item">
                            <span class="detail-label">Due Date:</span>
                            <span class="detail-value">${formatDate(dueDate)}</span>
                        </div>
                        ` : ''}
                        
                        ${remainingHours !== undefined ? `
                        <div class="detail-item">
                            <span class="detail-label">Remaining Hours:</span>
                            <span class="detail-value ${remainingHours <= 0 ? 'overdue' : ''}">
                                ${remainingHours}h
                                ${remainingHours <= 0 ? '(OVERDUE)' : ''}
                            </span>
                        </div>
                        ` : ''}
                    </div>

                    <!-- Time Information -->
                    <div class="time-info">
                        <span class="created-at">
                            Alert generated: ${formatDateTime(createdAt)}
                        </span>
                        ${acknowledged ? `
                        <span class="acknowledged-badge">
                            ✅ Acknowledged
                        </span>
                        ` : ''}
                    </div>
                </div>

                <!-- Alert Footer -->
                <div class="alert-footer">
                    <div class="alert-actions-full">
                        ${!acknowledged ? `
                        <button class="action-btn-full schedule-btn" data-action="schedule">
                            <span class="btn-icon">📅</span>
                            <span class="btn-text">Schedule Maintenance</span>
                        </button>
                        ` : ''}
                        
                        <button class="action-btn-full log-btn" data-action="log">
                            <span class="btn-icon">📝</span>
                            <span class="btn-text">Log Maintenance</span>
                        </button>
                        
                        <button class="action-btn-full view-site-btn" data-action="viewSite">
                            <span class="btn-icon">🏢</span>
                            <span class="btn-text">View Site</span>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    attachEvents() {
        if (!this.element) {
            this.element = document.querySelector(`.maintenance-alert[data-alert-id="${this.alertData.id}"]`);
            if (!this.element) return;
        }

        // Acknowledge button
        const acknowledgeBtn = this.element.querySelector('.acknowledge-btn');
        if (acknowledgeBtn) {
            acknowledgeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onAcknowledge();
            });
        }

        // Details button
        const detailsBtn = this.element.querySelector('.details-btn');
        if (detailsBtn) {
            detailsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.onViewDetails();
            });
        }

        // Action buttons
        const actionButtons = this.element.querySelectorAll('.action-btn-full');
        actionButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this.onAction(action);
            });
        });

        // Whole alert click
        this.element.addEventListener('click', (e) => {
            if (!e.target.closest('.action-btn') && !e.target.closest('.action-btn-full')) {
                this.onViewDetails();
            }
        });
    }

    onAcknowledge() {
        console.log('✅ Acknowledge alert:', this.alertData.id);
        
        // Dispatch custom event
        window.dispatchEvent(new CustomEvent('maintenanceAlertAcknowledge', {
            detail: { alertId: this.alertData.id }
        }));

        // Update UI
        if (this.element) {
            this.element.classList.add('acknowledged');
            const acknowledgeBtn = this.element.querySelector('.acknowledge-btn');
            if (acknowledgeBtn) {
                acknowledgeBtn.remove();
            }
        }
    }

    onViewDetails() {
        console.log('🔍 View alert details:', this.alertData.id);
        window.dispatchEvent(new CustomEvent('maintenanceAlertViewDetails', {
            detail: { alertId: this.alertData.id }
        }));
    }

    onAction(action) {
        console.log(`🔧 Alert action: ${action} for alert:`, this.alertData.id);
        
        const eventMap = {
            'schedule': 'maintenanceAlertSchedule',
            'log': 'maintenanceAlertLog',
            'viewSite': 'maintenanceAlertViewSite'
        };

        if (eventMap[action]) {
            window.dispatchEvent(new CustomEvent(eventMap[action], {
                detail: { 
                    alertId: this.alertData.id,
                    siteId: this.alertData.siteId,
                    siteName: this.alertData.siteName
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

    destroy() {
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
    border: 1px solid #e2e8f0;
    overflow: hidden;
    margin-bottom: 12px;
    transition: all 0.3s ease;
}

.maintenance-alert:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
}

.maintenance-alert.acknowledged {
    opacity: 0.7;
    border-color: #c6f6d5;
}

.maintenance-alert.critical {
    border-left: 4px solid #e53e3e;
}

.maintenance-alert.high {
    border-left: 4px solid #ed8936;
}

.maintenance-alert.medium {
    border-left: 4px solid #ecc94b;
}

.maintenance-alert.low {
    border-left: 4px solid #38a169;
}

.alert-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid #e2e8f0;
    background: #f7fafc;
}

.alert-severity {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
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
    color: #4a5568;
    transition: all 0.3s ease;
}

.action-btn:hover {
    background: #edf2f7;
    color: #667eea;
}

.alert-body {
    padding: 16px;
}

.site-info {
    margin-bottom: 12px;
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
}

.alert-message p {
    margin: 0;
    color: #4a5568;
    font-size: 14px;
    line-height: 1.5;
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
    justify-content: space-between;
    align-items: center;
}

.detail-label {
    font-weight: 600;
    color: #4a5568;
    font-size: 12px;
}

.detail-value {
    color: #2d3748;
    font-weight: 500;
    font-size: 13px;
}

.detail-value.overdue {
    color: #e53e3e;
    font-weight: 600;
}

.time-info {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 11px;
    color: #a0aec0;
    margin-top: 12px;
}

.acknowledged-badge {
    background: #c6f6d5;
    color: #276749;
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 10px;
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
    flex-wrap: wrap;
}

.action-btn-full {
    flex: 1;
    min-width: 120px;
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

@media (max-width: 640px) {
    .maintenance-details {
        grid-template-columns: 1fr;
    }
    
    .alert-actions-full {
        flex-direction: column;
    }
    
    .action-btn-full {
        min-width: 100%;
    }
}
`;