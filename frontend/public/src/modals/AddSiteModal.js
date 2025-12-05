import { Modal } from '../../components/modal.js';
import { showAlert } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';

class AddSiteModal {
    constructor(userProfile, onSuccess) {
        this.userProfile = userProfile;
        this.onSuccess = onSuccess;
        this.modal = null;
    }

    open() {
        this.modal = new Modal({
            id: 'addSiteModal',
            title: `<i class="fas fa-plus-circle"></i> Register New Site`,
            content: this.render(),
            size: 'lg',
            confirmText: 'Register Site',
            cancelText: 'Cancel',
            confirmButtonClass: 'btn-primary',
            onConfirm: () => this.handleSubmit()
        });

        this.modal.open();
    }

    render() {
        return `
            <form id="addSiteForm">
                <div class="modal-form-group">
                    <label class="modal-form-label" for="siteName">
                        <i class="fas fa-tower-cell"></i> Site Name
                    </label>
                    <input type="text" 
                           id="siteName" 
                           class="modal-form-input" 
                           placeholder="e.g., Accra Central Tower"
                           required>
                </div>

                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="siteId">
                            <i class="fas fa-hashtag"></i> Site ID
                        </label>
                        <input type="text" 
                               id="siteId" 
                               class="modal-form-input" 
                               placeholder="e.g., 600545"
                               required>
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="siteType">
                            <i class="fas fa-network-wired"></i> Site Type
                        </label>
                        <select id="siteType" class="modal-form-select" required>
                            <option value="">Select type</option>
                            <option value="tower">Tower Site</option>
                            <option value="hub">Telecom Hub</option>
                            <option value="relay">Relay Station</option>
                            <option value="bs">Base Station</option>
                            <option value="data-center">Data Center</option>
                        </select>
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="address">
                        <i class="fas fa-map-marker-alt"></i> Address
                    </label>
                    <input type="text" 
                           id="address" 
                           class="modal-form-input" 
                           placeholder="Full street address"
                           required>
                </div>

                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="region">
                            <i class="fas fa-map"></i> Region
                        </label>
                        <select id="region" class="modal-form-select" required>
                            <option value="">Select region</option>
                            <option value="greater_accra">Greater Accra</option>
                            <option value="ashanti">Ashanti</option>
                            <option value="eastern">Eastern</option>
                            <option value="central">Central</option>
                            <option value="western">Western</option>
                            <option value="volta">Volta</option>
                            <option value="bono">Bono</option>
                            <option value="ahafo">Ahafo</option>
                            <option value="northern">Northern</option>
                            <option value="savannah">Savannah</option>
                            <option value="north_east">North East</option>
                            <option value="upper_east">Upper East</option>
                            <option value="upper_west">Upper West</option>
                        </select>
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="city">
                            <i class="fas fa-city"></i> City/Town
                        </label>
                        <input type="text" 
                               id="city" 
                               class="modal-form-input" 
                               placeholder="City or town"
                               required>
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label">
                        <i class="fas fa-coordinates"></i> GPS Coordinates
                    </label>
                    <div style="display: flex; gap: 1rem;">
                        <input type="text" 
                               id="latitude" 
                               class="modal-form-input" 
                               placeholder="Latitude"
                               pattern="-?\\d+(\\.\\d+)?" 
                               title="Enter latitude coordinate">
                        <input type="text" 
                               id="longitude" 
                               class="modal-form-input" 
                               placeholder="Longitude"
                               pattern="-?\\d+(\\.\\d+)?"
                               title="Enter longitude coordinate">
                    </div>
                    <div class="modal-form-helper">
                        Format: Decimal degrees (e.g., 5.6037, -0.1870)
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="generatorCapacity">
                        <i class="fas fa-industry"></i> Generator Capacity (KVA)
                    </label>
                    <input type="number" 
                           id="generatorCapacity" 
                           class="modal-form-input" 
                           min="1" 
                           max="1000"
                           placeholder="e.g., 100"
                           required>
                </div>

                <div class="modal-form-row">
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="fuelTankCapacity">
                            <i class="fas fa-oil-can"></i> Fuel Tank Capacity (Liters)
                        </label>
                        <input type="number" 
                               id="fuelTankCapacity" 
                               class="modal-form-input" 
                               min="100" 
                               max="10000"
                               value="1000"
                               required>
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="initialFuelLevel">
                            <i class="fas fa-gas-pump"></i> Initial Fuel Level (%)
                        </label>
                        <input type="number" 
                               id="initialFuelLevel" 
                               class="modal-form-input" 
                               min="0" 
                               max="100"
                               value="50"
                               required>
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label">
                        <i class="fas fa-solar-panel"></i> Power Configuration
                    </label>
                    <div style="display: flex; flex-direction: column; gap: 0.5rem; margin-top: 0.5rem;">
                        <label class="checkbox-label">
                            <input type="checkbox" id="hasSolar" value="solar">
                            <span>Solar Power System</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="hasBattery" value="battery" checked>
                            <span>Battery Backup</span>
                        </label>
                        <label class="checkbox-label">
                            <input type="checkbox" id="hasGrid" value="grid">
                            <span>Grid Connection</span>
                        </label>
                    </div>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="assignedTechnician">
                        <i class="fas fa-user-hard-hat"></i> Assigned Technician
                    </label>
                    <select id="assignedTechnician" class="modal-form-select">
                        <option value="self" selected>Assign to myself</option>
                        <option value="team">Assign to team</option>
                        <option value="unassigned">Leave unassigned</option>
                    </select>
                </div>

                <div class="modal-form-group">
                    <label class="modal-form-label" for="notes">
                        <i class="far fa-sticky-note"></i> Notes
                    </label>
                    <textarea id="notes" 
                              class="modal-form-textarea" 
                              placeholder="Add any additional information about this site..."
                              rows="3"></textarea>
                </div>

                <div class="form-errors" id="addSiteFormErrors" style="color: #e53e3e; font-size: 14px; margin-top: 10px; display: none;"></div>
            </form>
        `;
    }

    attachFormEvents() {
        // Add any form-specific event listeners here
    }

    getFormData() {
        const powerConfig = [];
        if (document.getElementById('hasSolar')?.checked) powerConfig.push('solar');
        if (document.getElementById('hasBattery')?.checked) powerConfig.push('battery');
        if (document.getElementById('hasGrid')?.checked) powerConfig.push('grid');

        return {
            name: document.getElementById('siteName')?.value || '',
            siteId: document.getElementById('siteId')?.value || '',
            type: document.getElementById('siteType')?.value || '',
            address: document.getElementById('address')?.value || '',
            region: document.getElementById('region')?.value || '',
            city: document.getElementById('city')?.value || '',
            latitude: document.getElementById('latitude')?.value || null,
            longitude: document.getElementById('longitude')?.value || null,
            generatorCapacity: parseInt(document.getElementById('generatorCapacity')?.value) || 0,
            fuelTankCapacity: parseInt(document.getElementById('fuelTankCapacity')?.value) || 0,
            initialFuelLevel: parseInt(document.getElementById('initialFuelLevel')?.value) || 0,
            powerConfiguration: powerConfig,
            assignedTechnician: document.getElementById('assignedTechnician')?.value || 'self',
            notes: document.getElementById('notes')?.value || '',
            status: 'active',
            createdBy: this.userProfile?.id || 'technician',
            createdAt: new Date().toISOString()
        };
    }

    validateForm(formData) {
        // Use siteService validation or your existing validation
        const errors = [];
        
        if (!formData.name) errors.push('Site name is required');
        if (!formData.siteId) errors.push('Site ID is required');
        if (!formData.type) errors.push('Site type is required');
        if (!formData.address) errors.push('Address is required');
        if (!formData.region) errors.push('Region is required');
        if (!formData.city) errors.push('City is required');
        if (formData.initialFuelLevel < 0 || formData.initialFuelLevel > 100) {
            errors.push('Fuel level must be between 0-100%');
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

        this.modal.setLoading(true, 'Registering site...');
        
        try {
            // Use siteService instead of direct fetch
            const createdSite = await siteService.createSite(formData);
            
            showAlert('✅ Site registered successfully!', 'success');
            
            // Call success callback
            if (this.onSuccess) {
                await this.onSuccess(createdSite);
            }
            
            this.modal.close();
            
        } catch (error) {
            console.error('Add site error:', error);
            this.showErrors([error.message || 'Failed to register site']);
        } finally {
            this.modal.setLoading(false);
        }
    }
    showErrors(errors) {
        const errorDiv = document.getElementById('addSiteFormErrors');
        if (errorDiv) {
            errorDiv.innerHTML = errors.map(e => `<div>• ${e}</div>`).join('');
            errorDiv.style.display = 'block';
        }
    }
}

export default AddSiteModal;