import { authService } from './authService.js';
import { showAlert } from '../utils/helpers.js';

export class ApiService {
    constructor() {
        this.baseURL = '/api/v1'; // Update with your actual API base URL
    }

    async request(endpoint, options = {}) {
        try {
            const token = authService.getToken();
            
            const headers = {
                'Content-Type': 'application/json',
                ...options.headers
            };

            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(`${this.baseURL}${endpoint}`, {
                ...options,
                headers
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `API request failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    }

    async syncOfflineData(operations, lastSyncTimestamp, deviceId, appVersion, deviceInfo = {}) {
        try {
            const payload = {
                operations,
                lastSyncTimestamp,
                deviceId,
                appVersion,
                deviceInfo
            };

            console.log('🔄 Syncing offline data:', payload);
            
            const result = await this.request('/sync', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            console.log('✅ Sync completed:', result);
            return result;
        } catch (error) {
            console.error('❌ Sync failed:', error);
            throw error;
        }
    }

    async getSyncStatus() {
        try {
            return await this.request('/sync/status');
        } catch (error) {
            console.error('Failed to get sync status:', error);
            throw error;
        }
    }

    async resolveSyncConflicts(conflicts) {
        try {
            return await this.request('/sync/conflicts', {
                method: 'POST',
                body: JSON.stringify({ conflicts })
            });
        } catch (error) {
            console.error('Failed to resolve conflicts:', error);
            throw error;
        }
    }

    // Fuel Log API Methods
    async logFuel(siteId, data) {
        try {
            return await this.request(`/sites/${siteId}/fuel-logs`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Fuel log failed:', error);
            throw error;
        }
    }

    async getFuelLogs(siteId, params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/sites/${siteId}/fuel-logs${queryString ? `?${queryString}` : ''}`);
        } catch (error) {
            console.error('Failed to get fuel logs:', error);
            throw error;
        }
    }

    // Maintenance API Methods
    async logMaintenance(siteId, data) {
        try {
            return await this.request(`/sites/${siteId}/maintenance`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Maintenance log failed:', error);
            throw error;
        }
    }

    async scheduleMaintenance(siteId, data) {
        try {
            return await this.request(`/sites/${siteId}/maintenance/schedule`, {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Maintenance scheduling failed:', error);
            throw error;
        }
    }

    async getMaintenanceHistory(siteId, params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/sites/${siteId}/maintenance/history${queryString ? `?${queryString}` : ''}`);
        } catch (error) {
            console.error('Failed to get maintenance history:', error);
            throw error;
        }
    }

    // Sites API Methods
    async addSite(data) {
        try {
            return await this.request('/sites', {
                method: 'POST',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Add site failed:', error);
            throw error;
        }
    }

    async getSiteDetails(siteId) {
        try {
            return await this.request(`/sites/${siteId}`);
        } catch (error) {
            console.error('Failed to get site details:', error);
            throw error;
        }
    }

    async updateSite(siteId, data) {
        try {
            return await this.request(`/sites/${siteId}`, {
                method: 'PUT',
                body: JSON.stringify(data)
            });
        } catch (error) {
            console.error('Update site failed:', error);
            throw error;
        }
    }

    // Alerts API Methods
    async acknowledgeAlert(alertId) {
        try {
            return await this.request(`/alerts/${alertId}/acknowledge`, {
                method: 'POST'
            });
        } catch (error) {
            console.error('Acknowledge alert failed:', error);
            throw error;
        }
    }

    async getAlerts(params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/alerts${queryString ? `?${queryString}` : ''}`);
        } catch (error) {
            console.error('Failed to get alerts:', error);
            throw error;
        }
    }
}

export const apiService = new ApiService();