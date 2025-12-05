import { Modal } from '../../components/modal.js';
import { showAlert } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';

class FuelLogModal {
    constructor(siteId, siteName, userProfile, onSuccess) {
        this.siteId = siteId;
        this.siteName = siteName;
        this.userProfile = userProfile;
        this.onSuccess = onSuccess;
        this.modal = null;
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
                        <div>
                            <label class="modal-form-label" for="fuelDate">
                                <i class="far fa-calendar"></i> Date & Time
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
                        <i class="fas fa-oil-can"></i> Fuel Amount (Liters)
                    </label>
                    <input type="number" 
                           id="fuelAmount" 
                           class="modal-form-input" 
                           min="1" 
                           max="10000" 
                           step="0.1"
                           placeholder="Enter amount in liters"
                           required>
                    <div class="modal-form-helper">
                        Typical diesel generator consumption: 3-5 L/hour
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="fuelType">
                        <i class="fas fa-gas-pump"></i> Fuel Type
                    </label>
                    <select id="fuelType" class="modal-form-select" required>
                        <option value="">Select fuel type</option>
                        <option value="diesel" selected>Diesel</option>
                        <option value="petrol">Petrol/Gasoline</option>
                        <option value="hybrid">Hybrid (Solar + Generator)</option>
                    </select>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="fuelSupplier">
                        <i class="fas fa-truck"></i> Fuel Supplier
                    </label>
                    <input type="text" 
                           id="fuelSupplier" 
                           class="modal-form-input" 
                           placeholder="Enter supplier name">
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="meterReading">
                        <i class="fas fa-tachometer-alt"></i> Generator Meter Reading (Hours)
                    </label>
                    <input type="number" 
                           id="meterReading" 
                           class="modal-form-input" 
                           min="0"
                           step="0.1"
                           placeholder="Current generator hours">
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
                           placeholder="Enter cost in Ghana Cedis">
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="notes">
                        <i class="far fa-sticky-note"></i> Notes
                    </label>
                    <textarea id="notes" 
                              class="modal-form-textarea" 
                              placeholder="Add any additional notes about this refill..."
                              rows="3"></textarea>
                </div>

                <div class="form-errors" id="fuelFormErrors" style="color: #e53e3e; font-size: 14px; margin-top: 10px; display: none;"></div>
            </form>
        `;
    }

    getFormData() {
        return {
            siteId: this.siteId,
            fuelDate: document.getElementById('fuelDate')?.value || '',
            fuelAmount: parseFloat(document.getElementById('fuelAmount')?.value) || 0,
            fuelType: document.getElementById('fuelType')?.value || '',
            fuelSupplier: document.getElementById('fuelSupplier')?.value || '',
            meterReading: document.getElementById('meterReading')?.value ? 
                         parseFloat(document.getElementById('meterReading')?.value) : null,
            cost: document.getElementById('cost')?.value ? 
                  parseFloat(document.getElementById('cost')?.value) : null,
            notes: document.getElementById('notes')?.value || '',
            loggedBy: this.userProfile?.id || 'technician',
            timestamp: new Date().toISOString()
        };
    }

    validateForm(formData) {
        const errors = [];
        
        if (!formData.fuelAmount || formData.fuelAmount <= 0) {
            errors.push('Please enter a valid fuel amount');
        }
        if (!formData.fuelType) {
            errors.push('Please select fuel type');
        }
        if (!formData.fuelDate) {
            errors.push('Please select date and time');
        }

        return errors;
    }

    async handleSubmit() {
        const formData = this.getFormData();
        const errors = this.validateForm(formData);
        
        if (errors.length > 0) {
            this.showErrors(errors);
            return;
        }

        this.modal.setLoading(true, 'Logging fuel...');
        
        try {
            // Use siteService instead of direct fetch
            await siteService.addFuelLog(formData);
            
            showAlert('✅ Fuel logged successfully!', 'success');
            
            // Call success callback
            if (this.onSuccess) {
                await this.onSuccess(formData);
            }
            
            this.modal.close();
            
        } catch (error) {
            console.error('Fuel log error:', error);
            this.showErrors([error.message || 'Failed to log fuel']);
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