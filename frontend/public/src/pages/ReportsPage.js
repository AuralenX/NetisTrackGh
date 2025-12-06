// frontend/src/pages/ReportsPage.js
import { showAlert } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';

class ReportsPage {
    constructor() {
        this.reports = [];
        this.sites = [];
    }

    async init() {
        try {
            this.sites = await siteService.getSites();
        } catch (error) {
            console.error('Failed to load sites for reports', error);
            this.sites = [];
        }
        return this;
    }

    render() {
        return `
            <div class="reports-page">
                <div class="page-header">
                    <h1><i class="fas fa-file-alt"></i> Reports</h1>
                    <p>Generate and export operational reports</p>
                </div>

                <div class="reports-actions">
                    <select id="reportSiteSelect">
                        <option value="all">All Sites</option>
                        ${this.sites.map(s => `<option value="${s.siteId}">${s.name}</option>`).join('')}
                    </select>
                    <button class="btn btn-primary" id="generateReportBtn">Generate Report</button>
                    <button class="btn btn-secondary" id="exportReportBtn">Export</button>
                </div>

                <div id="reportResults" class="report-results">
                    <p>Select parameters and click Generate to produce a report.</p>
                </div>
            </div>
        `;
    }

    attachEvents() {
        const gen = document.getElementById('generateReportBtn');
        if (gen) gen.addEventListener('click', () => this.generateReport());
        const exp = document.getElementById('exportReportBtn');
        if (exp) exp.addEventListener('click', () => showAlert('Export will be available soon', 'info'));
    }

    async generateReport() {
        const siteId = document.getElementById('reportSiteSelect')?.value || 'all';
        showAlert('Generating report...', 'info');
        try {
            // For now, produce a simple summary using service methods
            const results = { siteId, generatedAt: new Date().toISOString() };
            const container = document.getElementById('reportResults');
            if (container) container.innerHTML = `<pre>${JSON.stringify(results, null, 2)}</pre>`;
            showAlert('Report generated', 'success');
        } catch (error) {
            console.error('Report generation failed', error);
            showAlert('Failed to generate report', 'error');
        }
    }
}

export default ReportsPage;
