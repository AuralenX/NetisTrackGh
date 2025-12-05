// frontend/src/modals/MaintenanceSiteSelectorModal.js
import { Modal } from '../../components/modal.js';

class MaintenanceSiteSelectorModal {
    constructor(sites, onSiteSelected) {
        this.sites = sites;
        this.onSiteSelected = onSiteSelected;
        this.modal = null;
    }

    open() {
        const sitesOptions = this.sites.map(site => 
            `<option value="${site.id}">${site.name} (Status: ${site.maintenanceStatus})</option>`
        ).join('');

        this.modal = new Modal({
            id: 'maintenanceSiteSelector',
            title: '<i class="fas fa-tools"></i> Select Site for Maintenance',
            content: `
                <div class="modal-form-group">
                    <label class="modal-form-label" for="selectSite">
                        <i class="fas fa-tower-cell"></i> Select Site
                    </label>
                    <select id="selectSite" class="modal-form-select" required>
                        <option value="">Choose a site...</option>
                        ${sitesOptions}
                    </select>
                </div>
            `,
            size: 'sm',
            confirmText: 'Continue',
            cancelText: 'Cancel',
            onConfirm: () => this.handleSiteSelection()
        });

        this.modal.open();
    }

    handleSiteSelection() {
        const selectedSite = document.getElementById('selectSite').value;
        if (!selectedSite) {
            this.showError('Please select a site');
            return;
        }
        
        const site = this.sites.find(s => s.id === selectedSite);
        if (site) {
            this.modal.close();
            this.onSiteSelected(site);
        }
    }

    showError(message) {
        // Could add error display here
        console.error(message);
    }
}

export default MaintenanceSiteSelectorModal;