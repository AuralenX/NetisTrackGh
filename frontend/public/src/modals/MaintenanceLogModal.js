// frontend/src/modals/MaintenanceLogModal.js
import { Modal } from '../../components/modal.js';

class MaintenanceLogModal {
    constructor(siteId, siteName, userProfile, onSubmit) {
        this.siteId = siteId;
        this.siteName = siteName;
        this.userProfile = userProfile;
        this.onSubmit = onSubmit;
        this.modal = null;
    }

    open() {
        const currentDateTime = new Date().toISOString().slice(0, 16);
        const userName = `${this.userProfile?.firstName || ''} ${this.userProfile?.lastName || ''}`.trim();
        
        this.modal = new Modal({
            id: 'maintenanceLogModal',
            title: `<i class="fas fa-tools"></i> Log Maintenance`,
            content: this.render(currentDateTime, userName),
            size: 'lg',
            confirmText: 'Log Maintenance',
            cancelText: 'Cancel',
            confirmButtonClass: 'btn-primary',
            onConfirm: () => this.handleSubmit()
        });

        this.modal.open();
    }

    render(currentDateTime, userName) {
        return `
            <form id="maintenanceLogForm" data-site-id="${this.siteId}">
                <div class="modal-form-group">
                    <div class="modal-form-row">
                        <div class="site-info">
                            <div class="modal-form-label">Site</div>
                            <div class="site-display">
                                <strong>${this.siteName}</strong> (ID: ${this.siteId})
                            </div>
                        </div>
                        <div>
                            <label class="modal-form-label" for="maintenanceDate">
                                <i class="far fa-calendar"></i> Date & Time
                            </label>
                            <input type="datetime-local" 
                                   id="maintenanceDate" 
                                   class="modal-form-input"
                                   value="${currentDateTime}"
                                   required>
                        </div>
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="maintenanceType">
                        <i class="fas fa-cog"></i> Maintenance Type
                    </label>
                    <select id="maintenanceType" class="modal-form-select" required>
                        <option value="">Select type</option>
                        <option value="preventive">Preventive Maintenance</option>
                        <option value="corrective">Corrective Maintenance</option>
                        <option value="emergency">Emergency Repair</option>
                        <option value="routine">Routine Check</option>
                        <option value="inspection">Site Inspection</option>
                    </select>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="description">
                        <i class="fas fa-clipboard"></i> Description
                    </label>
                    <textarea id="description" 
                              class="modal-form-textarea" 
                              placeholder="Describe what maintenance was performed..."
                              rows="3"
                              required></textarea>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="technician">
                        <i class="fas fa-user-hard-hat"></i> Technician Name
                    </label>
                    <input type="text" 
                           id="technician" 
                           class="modal-form-input" 
                           value="${userName || 'Technician'}"
                           required>
                </div>

                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="hoursSpent">
                            <i class="fas fa-clock"></i> Hours Spent
                        </label>
                        <input type="number" 
                               id="hoursSpent" 
                               class="modal-form-input" 
                               min="0.5" 
                               max="24" 
                               step="0.5"
                               placeholder="e.g., 2.5"
                               required>
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="cost">
                            <i class="fas fa-money-bill-wave"></i> Cost (GHS)
                        </label>
                        <input type="number" 
                               id="cost" 
                               class="modal-form-input" 
                               min="0"
                               step="0.01"
                               placeholder="Enter cost">
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="partsUsed">
                        <i class="fas fa-cogs"></i> Parts Used
                    </label>
                    <textarea id="partsUsed" 
                              class="modal-form-textarea" 
                              placeholder="List any parts replaced or used..."
                              rows="2"></textarea>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="nextMaintenance">
                        <i class="fas fa-calendar-check"></i> Next Maintenance Due
                    </label>
                    <input type="date" 
                           id="nextMaintenance" 
                           class="modal-form-input"
                           min="${new Date().toISOString().split('T')[0]}">
                    <div class="modal-form-helper">
                        Recommended: 30 days for preventive maintenance
                    </div>
                </div>

                <div class="modal-form-group">
                    <div class="modal-form-row">
                        <div>
                            <label class="modal-form-label">
                                <i class="fas fa-check-circle"></i> Status
                            </label>
                            <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                                <label class="radio-label">
                                    <input type="radio" name="status" value="completed" checked>
                                    <span>Completed</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="status" value="in_progress">
                                    <span>In Progress</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="status" value="scheduled">
                                    <span>Scheduled</span>
                                </label>
                            </div>
                        </div>

                        <div>
                            <label class="modal-form-label">
                                <i class="fas fa-exclamation-triangle"></i> Priority
                            </label>
                            <div style="display: flex; gap: 1rem; margin-top: 0.5rem;">
                                <label class="radio-label">
                                    <input type="radio" name="priority" value="low">
                                    <span style="color: #38a169">Low</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="priority" value="medium" checked>
                                    <span style="color: #d69e2e">Medium</span>
                                </label>
                                <label class="radio-label">
                                    <input type="radio" name="priority" value="high">
                                    <span style="color: #e53e3e">High</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="form-errors" id="maintenanceFormErrors" style="color: #e53e3e; font-size: 14px; margin-top: 10px; display: none;"></div>
            </form>
        `;
    }

    getFormData() {
        const statusRadio = document.querySelector('input[name="status"]:checked');
        const priorityRadio = document.querySelector('input[name="priority"]:checked');
        
        return {
            siteId: this.siteId,
            date: document.getElementById('maintenanceDate')?.value || '',
            type: document.getElementById('maintenanceType')?.value || '',
            description: document.getElementById('description')?.value || '',
            technician: document.getElementById('technician')?.value || '',
            hoursSpent: parseFloat(document.getElementById('hoursSpent')?.value) || 0,
            cost: document.getElementById('cost')?.value ? 
                  parseFloat(document.getElementById('cost')?.value) : null,
            partsUsed: document.getElementById('partsUsed')?.value || '',
            nextMaintenanceDate: document.getElementById('nextMaintenance')?.value || '',
            status: statusRadio?.value || 'completed',
            priority: priorityRadio?.value || 'medium',
            loggedBy: this.userProfile?.id || 'technician',
            timestamp: new Date().toISOString()
        };
    }

    validateForm() {
        const formData = this.getFormData();
        const errors = [];
        
        if (!formData.type) errors.push('Please select maintenance type');
        if (!formData.description) errors.push('Please enter description');
        if (!formData.technician) errors.push('Please enter technician name');
        if (!formData.hoursSpent || formData.hoursSpent <= 0) {
            errors.push('Please enter valid hours spent');
        }

        return errors;
    }

    async handleSubmit() {
        const errors = this.validateForm();
        if (errors.length > 0) {
            this.showErrors(errors);
            return;
        }

        const formData = this.getFormData();
        this.modal.setLoading(true, 'Logging maintenance...');
        
        try {
            await this.onSubmit(formData);
            this.modal.close();
        } catch (error) {
            console.error('Maintenance log error:', error);
            this.showErrors([error.message || 'Failed to log maintenance']);
        } finally {
            this.modal.setLoading(false);
        }
    }

    showErrors(errors) {
        const errorDiv = document.getElementById('maintenanceFormErrors');
        if (errorDiv) {
            errorDiv.innerHTML = errors.map(e => `<div>• ${e}</div>`).join('');
            errorDiv.style.display = 'block';
        }
    }
}

export default MaintenanceLogModal;