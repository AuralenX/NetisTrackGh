// frontend/src/modals/MaintenanceLogModal.js
import { Modal } from '../../components/modal.js';
import { showAlert } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';
import { validators } from '../utils/validators.js';

class MaintenanceLogModal {
    constructor(siteId, siteName, userProfile, onSuccess) {
        this.siteId = siteId;
        this.siteName = siteName;
        this.userProfile = userProfile;
        this.onSuccess = onSuccess;
        this.modal = null;
        this.technicianId = userProfile?.id || userProfile?.userId || 'unknown';
        this.partsUsed = [];
    }

    open() {
        const currentDateTime = new Date().toISOString().slice(0, 16);
        
        this.modal = new Modal({
            id: 'maintenanceLogModal',
            title: `<i class="fas fa-tools"></i> Log Maintenance`,
            content: this.render(currentDateTime),
            size: 'lg',
            confirmText: 'Log Maintenance',
            cancelText: 'Cancel',
            confirmButtonClass: 'btn-primary',
            onConfirm: () => this.handleSubmit()
        });

        this.modal.open();
        this.attachEventListeners();
    }

    render(currentDateTime) {
        return `
            <form id="maintenanceLogForm" data-site-id="${this.siteId}">
                <!-- Site & Date Info -->
                <div class="modal-form-group">
                    <div class="modal-form-row">
                        <div class="site-info">
                            <div class="modal-form-label">Site</div>
                            <div class="site-display">
                                <strong>${this.siteName}</strong> (ID: ${this.siteId})
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <label class="modal-form-label" for="maintenanceDate">
                                <i class="far fa-calendar"></i> Completion Date & Time *
                            </label>
                            <input type="datetime-local" 
                                   id="maintenanceDate" 
                                   class="modal-form-input"
                                   value="${currentDateTime}"
                                   required>
                        </div>
                    </div>
                </div>

                <!-- Maintenance Type & Priority -->
                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="maintenanceType">
                            <i class="fas fa-cogs"></i> Maintenance Type *
                        </label>
                        <select id="maintenanceType" class="modal-form-select" required>
                            <option value="">Select type</option>
                            <option value="routine">Routine</option>
                            <option value="preventive">Preventive</option>
                            <option value="corrective">Corrective</option>
                            <option value="emergency">Emergency</option>
                        </select>
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="priority">
                            <i class="fas fa-exclamation"></i> Priority *
                        </label>
                        <select id="priority" class="modal-form-select" required>
                            <option value="medium" selected>Medium</option>
                            <option value="low">Low</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                </div>

                <!-- Title & Description -->
                <div class="modal-form-group">
                    <label class="modal-form-label" for="maintenanceTitle">
                        <i class="fas fa-heading"></i> Title *
                    </label>
                    <input type="text" 
                           id="maintenanceTitle" 
                           class="modal-form-input" 
                           placeholder="e.g., Generator Oil Change"
                           maxlength="100"
                           required>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="description">
                        <i class="fas fa-align-left"></i> Description *
                    </label>
                    <textarea id="description" 
                              class="modal-form-textarea" 
                              placeholder="Detailed description of maintenance work performed..."
                              maxlength="1000"
                              rows="4"
                              required></textarea>
                </div>

                <!-- Status & Labor Hours -->
                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="status">
                            <i class="fas fa-tasks"></i> Status *
                        </label>
                        <select id="status" class="modal-form-select" required>
                            <option value="completed" selected>Completed</option>
                            <option value="scheduled">Scheduled</option>
                            <option value="in-progress">In Progress</option>
                            <option value="cancelled">Cancelled</option>
                        </select>
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="laborHours">
                            <i class="fas fa-hourglass-half"></i> Labor Hours *
                        </label>
                        <input type="number" 
                               id="laborHours" 
                               class="modal-form-input" 
                               min="0"
                               step="0.5"
                               placeholder="e.g., 2.5"
                               required>
                    </div>
                </div>

                <!-- Cost & Generator Hours -->
                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="totalCost">
                            <i class="fas fa-money-bill-wave"></i> Total Cost (GHS)
                        </label>
                        <input type="number" 
                               id="totalCost" 
                               class="modal-form-input" 
                               min="0"
                               step="0.01"
                               placeholder="Parts + labor cost">
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="generatorHours">
                            <i class="fas fa-tachometer-alt"></i> Generator Hours
                        </label>
                        <input type="number" 
                               id="generatorHours" 
                               class="modal-form-input" 
                               min="0"
                               step="0.1"
                               placeholder="Total run hours at time of maintenance">
                    </div>
                </div>

                <!-- Next Maintenance Date -->
                <div class="modal-form-group">
                    <label class="modal-form-label" for="nextMaintenanceDate">
                        <i class="fas fa-calendar-check"></i> Next Maintenance Due Date
                    </label>
                    <input type="date" 
                           id="nextMaintenanceDate" 
                           class="modal-form-input">
                </div>

                <!-- Parts Used -->
                <div class="modal-form-group">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                        <label class="modal-form-label">
                            <i class="fas fa-boxes"></i> Parts Used
                        </label>
                        <button type="button" class="btn btn-sm btn-secondary" id="addPartBtn">
                            + Add Part
                        </button>
                    </div>
                    <div id="partsList" style="margin-bottom: 10px;">
                        <!-- Parts added here dynamically -->
                    </div>
                </div>

                <!-- Notes -->
                <div class="modal-form-group">
                    <label class="modal-form-label" for="notes">
                        <i class="far fa-sticky-note"></i> Notes
                    </label>
                    <textarea id="notes" 
                              class="modal-form-textarea" 
                              placeholder="Additional notes (max 500 chars)..."
                              maxlength="500"
                              rows="3"></textarea>
                </div>

                <div class="form-errors" id="maintenanceFormErrors" style="color: #e53e3e; font-size: 14px; margin-top: 10px; display: none;"></div>
            </form>
        `;
    }

    attachEventListeners() {
        const addPartBtn = document.getElementById('addPartBtn');
        if (addPartBtn) {
            addPartBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.addPartRow();
            });
        }
    }

    addPartRow() {
        const partsList = document.getElementById('partsList');
        const partId = Date.now();
        
        const partRow = document.createElement('div');
        partRow.id = `part-${partId}`;
        partRow.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; padding: 8px; background: #f5f5f5; border-radius: 4px;';
        partRow.innerHTML = `
            <input type="text" 
                   class="part-name" 
                   placeholder="Part name" 
                   style="flex: 1; padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px;">
            <input type="number" 
                   class="part-qty" 
                   placeholder="Qty" 
                   min="1" 
                   value="1"
                   style="width: 60px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px;">
            <input type="number" 
                   class="part-cost" 
                   placeholder="Cost" 
                   min="0" 
                   step="0.01"
                   style="width: 80px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px;">
            <input type="text" 
                   class="part-number" 
                   placeholder="Part #" 
                   style="width: 80px; padding: 6px 8px; border: 1px solid #ddd; border-radius: 3px;">
            <button type="button" class="btn btn-sm btn-danger" onclick="document.getElementById('part-${partId}').remove();">✕</button>
        `;
        
        partsList.appendChild(partRow);
    }

    getPartsUsed() {
        const partsList = document.getElementById('partsList');
        const parts = [];
        
        partsList.querySelectorAll('div[id^="part-"]').forEach(row => {
            const name = row.querySelector('.part-name')?.value;
            const qty = row.querySelector('.part-qty')?.value;
            const cost = row.querySelector('.part-cost')?.value;
            const partNumber = row.querySelector('.part-number')?.value;
            
            if (name && qty) {
                parts.push({
                    name: name.trim(),
                    quantity: parseInt(qty),
                    ...(cost && { cost: parseFloat(cost) }),
                    ...(partNumber && { partNumber: partNumber.trim() })
                });
            }
        });
        
        return parts;
    }

    getFormData() {
        return {
            siteId: this.siteId,
            technicianId: this.technicianId,
            maintenanceType: document.getElementById('maintenanceType')?.value || '',
            title: document.getElementById('maintenanceTitle')?.value || '',
            description: document.getElementById('description')?.value || '',
            status: document.getElementById('status')?.value || 'completed',
            priority: document.getElementById('priority')?.value || 'medium',
            laborHours: parseFloat(document.getElementById('laborHours')?.value) || 0,
            completedDate: document.getElementById('maintenanceDate')?.value || new Date().toISOString(),
            totalCost: document.getElementById('totalCost')?.value ? 
                      parseFloat(document.getElementById('totalCost')?.value) : undefined,
            generatorHours: document.getElementById('generatorHours')?.value ? 
                           parseFloat(document.getElementById('generatorHours')?.value) : undefined,
            nextMaintenanceDate: document.getElementById('nextMaintenanceDate')?.value || undefined,
            partsUsed: this.getPartsUsed(),
            notes: document.getElementById('notes')?.value || undefined
        };
    }

    validateForm(formData) {
        // Use centralized validators
        const validation = validators.validateMaintenanceLog(formData);
        return validation;
    }

    async handleSubmit() {
        const formData = this.getFormData();
        const validation = this.validateForm(formData);
        
        if (!validation.valid) {
            this.showErrors(validation.errors);
            return;
        }

        this.modal.setLoading(true, 'Logging maintenance...');
        
        try {
            const payload = validation.data;
            console.log('📤 Submitting maintenance log:', payload);
            
            const result = await siteService.addMaintenanceLog(payload);
            
            showAlert('✅ Maintenance logged successfully!', 'success');
            console.log('✅ Response:', result);
            
            if (this.onSuccess) {
                await this.onSuccess(result);
            }
            
            this.modal.close();
            
        } catch (error) {
            console.error('❌ Maintenance log error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to log maintenance';
            this.showErrors([errorMsg]);
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