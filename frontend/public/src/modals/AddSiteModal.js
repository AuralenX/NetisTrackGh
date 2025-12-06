import { Modal } from '../../components/modal.js';
import { showAlert } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';
import { validators } from '../utils/validators.js';

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
        const today = new Date().toISOString().split('T')[0];
        return `
            <form id="addSiteForm" style="max-height: 600px; overflow-y: auto; padding-right: 10px;">
                <!-- BASIC INFO -->
                <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <h4 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-info-circle"></i> Basic Information</h4>
                    
                    <div class="modal-form-group">
                        <label class="modal-form-label" for="siteName">
                            <i class="fas fa-tower-cell"></i> Site Name *
                        </label>
                        <input type="text" 
                               id="siteName" 
                               class="modal-form-input" 
                               placeholder="e.g., Accra Central Tower"
                               maxlength="100"
                               required>
                    </div>

                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label class="modal-form-label" for="siteId">
                                <i class="fas fa-hashtag"></i> Site ID (6 digits) *
                            </label>
                            <input type="text" 
                                   id="siteId" 
                                   class="modal-form-input" 
                                   placeholder="e.g., 600545"
                                   pattern="[0-9]{6}"
                                   maxlength="6"
                                   required>
                        </div>

                        <div class="modal-form-group">
                            <label class="modal-form-label" for="siteType">
                                <i class="fas fa-network-wired"></i> Site Type
                            </label>
                            <select id="siteType" class="modal-form-select">
                                <option value="">Select type</option>
                                <option value="tower">Tower Site</option>
                                <option value="hub">Telecom Hub</option>
                                <option value="relay">Relay Station</option>
                                <option value="bs">Base Station</option>
                            </select>
                        </div>
                    </div>

                    <div class="modal-form-group">
                        <label class="modal-form-label" for="address">
                            <i class="fas fa-map-marker-alt"></i> Address *
                        </label>
                        <input type="text" 
                               id="address" 
                               class="modal-form-input" 
                               placeholder="Full street address"
                               required>
                    </div>

                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label class="modal-form-label">Latitude</label>
                            <input type="number" 
                                   id="latitude" 
                                   class="modal-form-input" 
                                   placeholder="-90 to 90"
                                   min="-90" 
                                   max="90" 
                                   step="0.0001">
                        </div>
                        <div class="modal-form-group">
                            <label class="modal-form-label">Longitude</label>
                            <input type="number" 
                                   id="longitude" 
                                   class="modal-form-input" 
                                   placeholder="-180 to 180"
                                   min="-180" 
                                   max="180" 
                                   step="0.0001">
                        </div>
                    </div>
                </div>

                <!-- AC SYSTEM -->
                <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <h4 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-plug"></i> AC System (Power Supply)</h4>
                    
                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label class="modal-form-label" for="acCapacity">
                                Capacity (KW) *
                            </label>
                            <input type="number" 
                                   id="acCapacity" 
                                   class="modal-form-input" 
                                   min="0"
                                   step="0.1"
                                   placeholder="e.g., 50"
                                   required>
                        </div>

                        <div class="modal-form-group">
                            <label class="modal-form-label" for="acVoltage">
                                Voltage *
                            </label>
                            <select id="acVoltage" class="modal-form-select" required>
                                <option value="110V">110V</option>
                                <option value="220V">220V</option>
                                <option value="240V" selected>240V</option>
                            </select>
                        </div>

                        <div class="modal-form-group">
                            <label class="modal-form-label" for="acPhase">
                                Phase *
                            </label>
                            <select id="acPhase" class="modal-form-select" required>
                                <option value="Single">Single</option>
                                <option value="Three" selected>Three</option>
                            </select>
                        </div>
                    </div>
                </div>

                <!-- DC SYSTEM -->
                <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <h4 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-battery-full"></i> DC System (Backup Power)</h4>
                    
                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label class="modal-form-label" for="batteryCapacity">
                                Battery Capacity (Ah) *
                            </label>
                            <input type="number" 
                                   id="batteryCapacity" 
                                   class="modal-form-input" 
                                   min="0"
                                   step="0.1"
                                   placeholder="e.g., 200"
                                   required>
                        </div>

                        <div class="modal-form-group">
                            <label class="modal-form-label" for="inverterCapacity">
                                Inverter Capacity (KW) *
                            </label>
                            <input type="number" 
                                   id="inverterCapacity" 
                                   class="modal-form-input" 
                                   min="0"
                                   step="0.1"
                                   placeholder="e.g., 10"
                                   required>
                        </div>

                        <div class="modal-form-group">
                            <label class="modal-form-label" for="solarCapacity">
                                Solar Capacity (KW)
                            </label>
                            <input type="number" 
                                   id="solarCapacity" 
                                   class="modal-form-input" 
                                   min="0"
                                   step="0.1"
                                   placeholder="e.g., 5">
                        </div>
                    </div>
                </div>

                <!-- GENERATOR -->
                <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <h4 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-industry"></i> Generator</h4>
                    
                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label class="modal-form-label" for="generatorCapacity">
                                Generator Capacity (KVA) *
                            </label>
                            <input type="number" 
                                   id="generatorCapacity" 
                                   class="modal-form-input" 
                                   min="1"
                                   step="0.1"
                                   placeholder="e.g., 100"
                                   required>
                        </div>

                        <div class="modal-form-group">
                            <label class="modal-form-label" for="fuelTankCapacity">
                                Fuel Tank Capacity (Liters) *
                            </label>
                            <input type="number" 
                                   id="fuelTankCapacity" 
                                   class="modal-form-input" 
                                   min="100"
                                   value="1000"
                                   required>
                        </div>
                    </div>
                </div>

                <!-- FUEL -->
                <div style="margin-bottom: 20px; padding-bottom: 15px; border-bottom: 1px solid #eee;">
                    <h4 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-gas-pump"></i> Fuel Configuration</h4>
                    
                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label class="modal-form-label" for="initialFuelLevel">
                                Initial Fuel Level (%) *
                            </label>
                            <input type="number" 
                                   id="initialFuelLevel" 
                                   class="modal-form-input" 
                                   min="0"
                                   max="100"
                                   value="50"
                                   required>
                        </div>

                        <div class="modal-form-group">
                            <label class="modal-form-label" for="consumptionRate">
                                Consumption Rate (L/hour) *
                            </label>
                            <input type="number" 
                                   id="consumptionRate" 
                                   class="modal-form-input" 
                                   min="0"
                                   step="0.1"
                                   value="5"
                                   placeholder="e.g., 5"
                                   required>
                        </div>
                    </div>
                </div>

                <!-- MAINTENANCE SCHEDULE -->
                <div style="margin-bottom: 20px;">
                    <h4 style="margin: 0 0 15px 0; color: #333;"><i class="fas fa-calendar-check"></i> Maintenance Schedule</h4>
                    
                    <div class="modal-form-row">
                        <div class="modal-form-group">
                            <label class="modal-form-label" for="nextMaintenanceDate">
                                Next Maintenance Date *
                            </label>
                            <input type="date" 
                                   id="nextMaintenanceDate" 
                                   class="modal-form-input"
                                   min="${today}"
                                   required>
                        </div>

                        <div class="modal-form-group">
                            <label class="modal-form-label" for="maintenanceInterval">
                                Maintenance Interval (hours) *
                            </label>
                            <input type="number" 
                                   id="maintenanceInterval" 
                                   class="modal-form-input" 
                                   min="1"
                                   value="720"
                                   placeholder="e.g., 720 (30 days)"
                                   required>
                        </div>
                    </div>
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

        const latitude = document.getElementById('latitude')?.value;
        const longitude = document.getElementById('longitude')?.value;
        const acCapacity = parseFloat(document.getElementById('acCapacity')?.value) || 50;
        const acVoltage = document.getElementById('acVoltage')?.value || '240V';
        const acPhase = document.getElementById('acPhase')?.value || 'Three';
        
        const batteryCapacity = parseFloat(document.getElementById('batteryCapacity')?.value) || 0;
        const solarCapacity = parseFloat(document.getElementById('solarCapacity')?.value) || 0;
        const inverterCapacity = parseFloat(document.getElementById('inverterCapacity')?.value) || 0;
        
        const generatorCapacity = parseFloat(document.getElementById('generatorCapacity')?.value) || 100;
        const fuelTankCapacity = parseFloat(document.getElementById('fuelTankCapacity')?.value) || 1000;
        
        const currentFuelLevel = parseFloat(document.getElementById('initialFuelLevel')?.value) || 50;
        const consumptionRate = parseFloat(document.getElementById('consumptionRate')?.value) || 5;
        
        const nextMaintenance = document.getElementById('nextMaintenanceDate')?.value || this._defaultNextMaintenance();
        const maintenanceInterval = parseFloat(document.getElementById('maintenanceInterval')?.value) || 720;

        // Return data matching backend schema exactly
        return {
            siteId: document.getElementById('siteId')?.value || '',
            name: document.getElementById('siteName')?.value || '',
            
            // Location object (required)
            location: {
                address: document.getElementById('address')?.value || '',
                ...(latitude && longitude && {
                    coordinates: {
                        latitude: parseFloat(latitude),
                        longitude: parseFloat(longitude)
                    }
                })
            },
            
            // AC System (required)
            acSystem: {
                capacity: acCapacity,
                voltage: acVoltage,
                phase: acPhase
            },
            
            // DC System (required)
            dcSystem: {
                batteryCapacity: batteryCapacity,
                solarCapacity: solarCapacity,
                inverterCapacity: inverterCapacity
            },
            
            // Generator (required)
            generator: {
                capacity: generatorCapacity,
                fuelTankCapacity: fuelTankCapacity,
                currentRunHours: 0,
                lastMaintenanceHours: 0
            },
            
            // Fuel (required)
            fuel: {
                currentLevel: currentFuelLevel,
                consumptionRate: consumptionRate,
                lastRefuelDate: new Date().toISOString()
            },
            
            // Maintenance Schedule (required)
            maintenanceSchedule: {
                nextMaintenance: nextMaintenance,
                maintenanceInterval: maintenanceInterval,
                lastMaintenance: new Date().toISOString()
            }
        };
    }

    _defaultNextMaintenance() {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString();
    }

    validateForm(formData) {
        // Use centralized validators that align with backend schema
        const validation = validators.validateSite(formData);
        
        // Add frontend-specific validation (not part of backend schema)
        const additionalErrors = [];
        
        const siteType = document.getElementById('siteType')?.value;
        if (!siteType) {
            additionalErrors.push('Site type is required');
        }
        
        return {
            valid: validation.valid && additionalErrors.length === 0,
            errors: [...validation.errors, ...additionalErrors],
            data: validation.data
        };
    }

    async handleSubmit() {
        const formData = this.getFormData();
        const validation = this.validateForm(formData);
        
        if (!validation.valid) {
            this.showErrors(validation.errors);
            return;
        }

        this.modal.setLoading(true, 'Registering site...');
        
        try {
            const payload = validation.data;
            console.log('📤 Submitting site:', payload);
            
            // Use siteService instead of direct fetch
            const createdSite = await siteService.createSite(payload);
            
            showAlert('✅ Site registered successfully!', 'success');
            console.log('✅ Response:', createdSite);
            
            // Call success callback
            if (this.onSuccess) {
                await this.onSuccess(createdSite);
            }
            
            this.modal.close();
            
        } catch (error) {
            console.error('❌ Add site error:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Failed to register site';
            this.showErrors([errorMsg]);
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