// frontend/src/modals/MaintenanceSchedulerModal.js
import { Modal } from '../../components/modal.js';

class MaintenanceSchedulerModal {
    constructor(siteId, siteName, userProfile, onSubmit) {
        this.siteId = siteId;
        this.siteName = siteName;
        this.userProfile = userProfile;
        this.onSubmit = onSubmit;
        this.modal = null;
    }

    open() {
        this.modal = new Modal({
            id: 'maintenanceSchedulerModal',
            title: `<i class="fas fa-calendar-alt"></i> Schedule Maintenance`,
            content: this.render(),
            size: 'lg',
            confirmText: 'Schedule Maintenance',
            cancelText: 'Cancel',
            confirmButtonClass: 'btn-primary',
            onConfirm: () => this.handleSubmit()
        });

        this.modal.open();
        this.attachEvents();
    }

    render() {
        const startDate = new Date().toISOString().split('T')[0];
        
        return `
            <form id="maintenanceScheduleForm" data-site-id="${this.siteId}">
                <div class="modal-form-group">
                    <div class="site-info">
                        <div class="modal-form-label">Site</div>
                        <div class="site-display" style="font-size: 1.1rem; color: #2d3748;">
                            <strong>${this.siteName}</strong> (ID: ${this.siteId})
                        </div>
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="scheduleType">
                        <i class="fas fa-calendar-check"></i> Schedule Type
                    </label>
                    <select id="scheduleType" class="modal-form-select" required>
                        <option value="">Select schedule type</option>
                        <option value="weekly">Weekly</option>
                        <option value="biweekly">Bi-weekly</option>
                        <option value="monthly" selected>Monthly</option>
                        <option value="quarterly">Quarterly</option>
                        <option value="biannual">Bi-annual</option>
                        <option value="annual">Annual</option>
                        <option value="custom">Custom</option>
                    </select>
                </div>

                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="startDate">
                            <i class="far fa-calendar-plus"></i> Start Date
                        </label>
                        <input type="date" 
                               id="startDate" 
                               class="modal-form-input"
                               value="${startDate}"
                               required>
                    </div>

                    <div class="modal-form-group" id="customFrequencyGroup" style="display: none;">
                        <label class="modal-form-label" for="customDays">
                            <i class="fas fa-clock"></i> Frequency (Days)
                        </label>
                        <input type="number" 
                               id="customDays" 
                               class="modal-form-input" 
                               min="1" 
                               max="365"
                               placeholder="Enter days">
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="assignedTo">
                        <i class="fas fa-user-hard-hat"></i> Assign To
                    </label>
                    <select id="assignedTo" class="modal-form-select">
                        <option value="">Select technician</option>
                        <option value="current" selected>Myself (${this.userProfile?.firstName || 'You'})</option>
                        <option value="team">Team Assignment</option>
                        <option value="any">Any Available Technician</option>
                    </select>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="maintenanceType">
                        <i class="fas fa-cog"></i> Maintenance Type
                    </label>
                    <select id="maintenanceType" class="modal-form-select" required>
                        <option value="">Select type</option>
                        <option value="preventive" selected>Preventive Maintenance</option>
                        <option value="inspection">Site Inspection</option>
                        <option value="cleaning">Generator Cleaning</option>
                        <option value="testing">System Testing</option>
                        <option value="calibration">Equipment Calibration</option>
                    </select>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="estimatedHours">
                        <i class="fas fa-clock"></i> Estimated Duration (Hours)
                    </label>
                    <input type="number" 
                           id="estimatedHours" 
                           class="modal-form-input" 
                           min="1" 
                           max="24"
                           value="2"
                           required>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="notes">
                        <i class="far fa-sticky-note"></i> Notes & Instructions
                    </label>
                    <textarea id="notes" 
                              class="modal-form-textarea" 
                              placeholder="Add any special instructions or notes..."
                              rows="3"></textarea>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label">
                        <i class="fas fa-bell"></i> Notification Settings
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                        <label class="checkbox-label">
                            <input type="checkbox" name="notifications" value="email" checked>
                            <span>Email notification</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="notifications" value="app" checked>
                            <span>In-app notification</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" name="notifications" value="sms">
                            <span>SMS notification</span>
                        </label>
                    </div>
                </div>

                <div id="schedulePreview" style="
                    background: #f7fafc;
                    border: 1px solid #e2e8f0;
                    border-radius: 8px;
                    padding: 1rem;
                    margin-top: 1rem;
                ">
                    <h4 style="margin: 0 0 0.5rem 0; color: #4a5568;">
                        <i class="far fa-calendar-alt"></i> Schedule Preview
                    </h4>
                    <div id="previewContent">
                        No schedule selected
                    </div>
                </div>

                <div class="form-errors" id="scheduleFormErrors" style="color: #e53e3e; font-size: 14px; margin-top: 10px; display: none;"></div>
            </form>
        `;
    }

    attachEvents() {
        const scheduleType = document.getElementById('scheduleType');
        const customGroup = document.getElementById('customFrequencyGroup');
        
        if (scheduleType) {
            scheduleType.addEventListener('change', () => {
                if (customGroup) {
                    customGroup.style.display = scheduleType.value === 'custom' ? 'block' : 'none';
                }
                this.updateSchedulePreview();
            });
        }
        
        const startDate = document.getElementById('startDate');
        if (startDate) {
            startDate.addEventListener('change', () => this.updateSchedulePreview());
        }
        
        const customDays = document.getElementById('customDays');
        if (customDays) {
            customDays.addEventListener('input', () => this.updateSchedulePreview());
        }
        
        // Initial preview
        setTimeout(() => this.updateSchedulePreview(), 100);
    }

    updateSchedulePreview() {
        const scheduleType = document.getElementById('scheduleType')?.value;
        const startDate = document.getElementById('startDate')?.value;
        const preview = document.getElementById('previewContent');
        
        if (!preview) return;
        
        if (!scheduleType || !startDate) {
            preview.innerHTML = 'No schedule selected';
            return;
        }
        
        const start = new Date(startDate);
        let nextDate = new Date(start);
        
        switch(scheduleType) {
            case 'weekly':
                nextDate.setDate(start.getDate() + 7);
                break;
            case 'biweekly':
                nextDate.setDate(start.getDate() + 14);
                break;
            case 'monthly':
                nextDate.setMonth(start.getMonth() + 1);
                break;
            case 'quarterly':
                nextDate.setMonth(start.getMonth() + 3);
                break;
            case 'biannual':
                nextDate.setMonth(start.getMonth() + 6);
                break;
            case 'annual':
                nextDate.setFullYear(start.getFullYear() + 1);
                break;
            case 'custom':
                const customDays = parseInt(document.getElementById('customDays')?.value) || 30;
                nextDate.setDate(start.getDate() + customDays);
                break;
        }
        
        const formatDate = (date) => {
            return date.toLocaleDateString('en-GH', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        };
        
        preview.innerHTML = `
            <div>Start: <strong>${formatDate(start)}</strong></div>
            <div>Next: <strong>${formatDate(nextDate)}</strong></div>
            <div style="color: #718096; font-size: 0.9rem; margin-top: 0.5rem;">
                Maintenance will repeat ${scheduleType === 'custom' ? 'every ' + (document.getElementById('customDays')?.value || 30) + ' days' : scheduleType}
            </div>
        `;
    }

    getFormData() {
        const notifications = Array.from(document.querySelectorAll('input[name="notifications"]:checked'))
            .map(checkbox => checkbox.value);

        return {
            siteId: this.siteId,
            siteName: this.siteName,
            scheduleType: document.getElementById('scheduleType')?.value || '',
            startDate: document.getElementById('startDate')?.value || '',
            frequencyDays: document.getElementById('scheduleType')?.value === 'custom' ? 
                          parseInt(document.getElementById('customDays')?.value) : null,
            assignedTo: document.getElementById('assignedTo')?.value || '',
            maintenanceType: document.getElementById('maintenanceType')?.value || '',
            estimatedHours: parseInt(document.getElementById('estimatedHours')?.value) || 0,
            notes: document.getElementById('notes')?.value || '',
            notifications: notifications,
            createdBy: this.userProfile?.id || 'technician',
            createdAt: new Date().toISOString()
        };
    }

    validateForm() {
        const formData = this.getFormData();
        const errors = [];
        
        if (!formData.scheduleType) errors.push('Please select schedule type');
        if (!formData.startDate) errors.push('Please select start date');
        if (!formData.maintenanceType) errors.push('Please select maintenance type');
        if (!formData.estimatedHours || formData.estimatedHours <= 0) {
            errors.push('Please enter valid estimated hours');
        }
        if (formData.scheduleType === 'custom' && (!formData.frequencyDays || formData.frequencyDays <= 0)) {
            errors.push('Please enter valid frequency days for custom schedule');
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
        this.modal.setLoading(true, 'Scheduling maintenance...');
        
        try {
            await this.onSubmit(formData);
            this.modal.close();
        } catch (error) {
            console.error('Schedule maintenance error:', error);
            this.showErrors([error.message || 'Failed to schedule maintenance']);
        } finally {
            this.modal.setLoading(false);
        }
    }

    showErrors(errors) {
        const errorDiv = document.getElementById('scheduleFormErrors');
        if (errorDiv) {
            errorDiv.innerHTML = errors.map(e => `<div>• ${e}</div>`).join('');
            errorDiv.style.display = 'block';
        }
    }
}

export default MaintenanceSchedulerModal;