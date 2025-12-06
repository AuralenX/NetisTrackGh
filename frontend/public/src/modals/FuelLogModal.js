import { Modal } from '../../components/modal.js';
import { showAlert } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';
import { validators } from '../utils/validators.js';

class FuelLogModal {
    constructor(siteId, siteName, userProfile, onSuccess) {
        this.siteId = siteId;
        this.siteName = siteName;
        this.userProfile = userProfile;
        this.onSuccess = onSuccess;
        this.modal = null;
        this.technicianId = userProfile?.id || userProfile?.userId || 'unknown';
    }

    open() {
        const currentDateTime = new Date().toISOString().slice(0, 16);
        
        this.modal = new Modal({
            id: 'fuelLogModal',
            title: `<i class="fas fa-gas-pump"></i> Log Fuel Refill`,
            content: this.render(currentDateTime),
            size: 'md',
            confirmText: 'Log Fuel',
            cancelText: 'Cancel',
            confirmButtonClass: 'btn-primary',
            onConfirm: () => this.handleSubmit()
        });

        this.modal.open();
    }

    render(currentDateTime) {
        return `
            <form id="fuelLogForm" data-site-id="${this.siteId}">
                <div class="modal-form-group">
                    <div class="modal-form-row">
                        <div class="site-info">
                            <div class="modal-form-label">Site</div>
                            <div class="site-display">
                                <strong>${this.siteName}</strong> (ID: ${this.siteId})
                            </div>
                        </div>
                        <div style="flex: 1;">
                            <label class="modal-form-label" for="fuelDate">
                                <i class="far fa-calendar"></i> Refuel Date & Time
                            </label>
                            <input type="datetime-local" 
                                   id="fuelDate" 
                                   class="modal-form-input"
                                   value="${currentDateTime}"
                                   required>
                        </div>
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="fuelAmount">
                        <i class="fas fa-oil-can"></i> Fuel Amount (Liters) *
                    </label>
                    <input type="number" 
                           id="fuelAmount" 
                           class="modal-form-input" 
                           min="0.1" 
                           max="10000" 
                           step="0.1"
                           placeholder="e.g., 50.5"
                           required>
                    <div class="modal-form-helper">
                        Typical diesel generator consumption: 3-5 L/hour
                    </div>
                </div>

                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="currentLevel">
                            <i class="fas fa-percentage"></i> Current Fuel Level (%) *
                        </label>
                        <input type="number" 
                               id="currentLevel" 
                               class="modal-form-input" 
                               min="0" 
                               max="100" 
                               step="1"
                               placeholder="0-100"
                               required>
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="previousLevel">
                            <i class="fas fa-history"></i> Previous Level (%)
                        </label>
                        <input type="number" 
                               id="previousLevel" 
                               class="modal-form-input" 
                               min="0" 
                               max="100" 
                               step="1"
                               placeholder="0-100">
                    </div>
                </div>

                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="fuelCost">
                            <i class="fas fa-money-bill-wave"></i> Fuel Cost (GHS)
                        </label>
                        <input type="number" 
                               id="fuelCost" 
                               class="modal-form-input" 
                               min="0"
                               step="0.01"
                               placeholder="e.g., 250.50">
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
                               placeholder="Total run hours">
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="odometerReading">
                        <i class="fas fa-map"></i> Odometer Reading (km)
                    </label>
                    <input type="number" 
                           id="odometerReading" 
                           class="modal-form-input" 
                           min="0"
                           step="1"
                           placeholder="Vehicle odometer if applicable">
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="notes">
                        <i class="far fa-sticky-note"></i> Notes
                    </label>
                    <textarea id="notes" 
                              class="modal-form-textarea" 
                              placeholder="Add any additional notes (max 500 chars)..."
                              rows="3"
                              maxlength="500"></textarea>
                </div>

                <div class="form-errors" id="fuelFormErrors" style="color: #e53e3e; font-size: 14px; margin-top: 10px; display: none;"></div>
            </form>
        `;
    }

    getFormData() {
        return {
            siteId: this.siteId,
            technicianId: this.technicianId,
            fuelAmount: parseFloat(document.getElementById('fuelAmount')?.value || 0),
            currentLevel: parseFloat(document.getElementById('currentLevel')?.value || 0),
            refuelDate: document.getElementById('fuelDate')?.value || new Date().toISOString(),
            previousLevel: parseFloat(document.getElementById('previousLevel')?.value) || undefined,
            fuelCost: parseFloat(document.getElementById('fuelCost')?.value) || undefined,
            generatorHours: parseFloat(document.getElementById('generatorHours')?.value) || undefined,
            odometerReading: parseFloat(document.getElementById('odometerReading')?.value) || undefined,
            notes: document.getElementById('notes')?.value || ''
        };
    }

    validateForm(formData) {
        const validation = validators.validateFuelLog(formData);
        return validation;
    }

    async handleSubmit() {
        const formData = this.getFormData();
        const validation = this.validateForm(formData);
        
        if (!validation.valid) {
            this.showErrors(validation.errors);
            return;
        }

        this.modal.setLoading(true, 'Logging fuel...');
        
        try {
            // Submit clean data to backend via siteService
            const payload = validation.data;
            console.log('📤 Submitting fuel log:', payload);
            
            const result = await siteService.addFuelLog(payload);
            
            showAlert('✅ Fuel logged successfully!', 'success');
            console.log('✅ Response:', result);
            
            // Call success callback
            if (this.onSuccess) {
                await this.onSuccess(result);
            }
            
            this.modal.close();
            
        } catch (error) {
            console.error('❌ Fuel log error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to log fuel';
            this.showErrors([errorMsg]);
        } finally {
            this.modal.setLoading(false);
        }
    }

    showErrors(errors) {
        const errorDiv = document.getElementById('fuelFormErrors');
        if (errorDiv) {
            errorDiv.innerHTML = errors.map(e => `<div>• ${e}</div>`).join('');
            errorDiv.style.display = 'block';
        }
    }
}

export default FuelLogModal;