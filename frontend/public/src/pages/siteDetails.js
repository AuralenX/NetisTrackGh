// frontend/src/pages/siteDetails.js
import { showAlert, formatDate, formatTime, formatCurrency } from '../utils/helpers.js';
import { siteService } from '../services/siteService.js';

class SiteDetailsPage {
	constructor() {
		this.site = null;
		this.siteId = this.extractSiteIdFromHash();
	}

	extractSiteIdFromHash() {
		const hash = window.location.hash.replace('#', '');
		const parts = hash.split('/');
		if (parts.length >= 2 && parts[0] === 'site-details') return parts[1];
		return null;
	}

	async init() {
		if (!this.siteId) {
			showAlert('Site ID not provided in URL', 'error');
			return this;
		}

		try {
			this.site = await siteService.getSiteById(this.siteId);
		} catch (error) {
			console.error('Failed to load site details', error);
			showAlert('Failed to load site details', 'error');
			this.site = null;
		}

		return this;
	}

	render() {
		if (!this.site) {
			return `
				<div class="site-details-page">
					<h2>Site details not available</h2>
					<p>Unable to load site information. Try refreshing or go back to <a href="#sites">Sites</a>.</p>
				</div>
			`;
		}

		return `
			<div class="site-details-page">
				<div class="page-header">
					<h1>${this.site.name} <small>ID: ${this.site.siteId}</small></h1>
					<div class="header-actions">
						<button class="btn btn-secondary" id="backToSitesBtn">&larr; Back</button>
						<button class="btn btn-primary" id="editSiteBtn">Edit Site</button>
					</div>
				</div>

				<div class="site-summary">
					<div><strong>Location:</strong> ${this.site.location || 'N/A'}</div>
					<div><strong>Status:</strong> ${this.site.status || 'N/A'}</div>
					<div><strong>Fuel Level:</strong> ${this.site.fuelLevel !== undefined ? this.site.fuelLevel + '%' : 'N/A'}</div>
					<div><strong>Last Updated:</strong> ${this.site.updatedAt ? `${formatDate(this.site.updatedAt)} ${formatTime(this.site.updatedAt)}` : 'N/A'}</div>
				</div>

				<div class="site-panels">
					<section class="panel">
						<h3>Recent Fuel Logs</h3>
						<div id="siteFuelLogs">Loading...</div>
					</section>

					<section class="panel">
						<h3>Maintenance</h3>
						<div id="siteMaintenance">Loading...</div>
					</section>
				</div>
			</div>
		`;
	}

	attachEvents() {
		const backBtn = document.getElementById('backToSitesBtn');
		if (backBtn) backBtn.addEventListener('click', () => { window.location.hash = 'sites'; });

		const editBtn = document.getElementById('editSiteBtn');
		if (editBtn) editBtn.addEventListener('click', () => showAlert('Edit site feature coming soon', 'info'));

		this.loadRecentFuelLogs();
		this.loadRecentMaintenance();
	}

	async loadRecentFuelLogs() {
		try {
			const logs = await siteService.getFuelLogs(this.siteId, { limit: 10 });
			const container = document.getElementById('siteFuelLogs');
			if (!container) return;
			if (!logs || logs.length === 0) {
				container.innerHTML = '<p>No fuel logs found for this site.</p>';
				return;
			}
			container.innerHTML = `
				<ul class="compact-list">
					${logs.map(l => `<li>${formatDate(l.date)} ${formatTime(l.date)} — ${l.fuelAmount} L (${l.fuelType || 'N/A'})</li>`).join('')}
				</ul>
			`;
		} catch (error) {
			console.error('Failed loading recent fuel logs', error);
		}
	}

	async loadRecentMaintenance() {
		try {
			const logs = await siteService.getMaintenanceLogs(this.siteId, { limit: 10 });
			const container = document.getElementById('siteMaintenance');
			if (!container) return;
			if (!logs || logs.length === 0) {
				container.innerHTML = '<p>No maintenance logs found for this site.</p>';
				return;
			}
			container.innerHTML = `
				<ul class="compact-list">
					${logs.map(l => `<li>${formatDate(l.completedDate || l.createdAt)} — ${l.title || l.description?.substring(0,50)}</li>`).join('')}
				</ul>
			`;
		} catch (error) {
			console.error('Failed loading recent maintenance logs', error);
		}
	}

	destroy() {
		// cleanup if needed
	}
}

export default SiteDetailsPage;
