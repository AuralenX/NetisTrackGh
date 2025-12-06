import { authService } from './authService.js';
import { showAlert } from '../utils/helpers.js';
import { API_BASE_URL, CLIENT_VERSION } from './config.js';

export class ApiService {
    constructor() {
        this.baseURL = API_BASE_URL;
    }

    async request(endpoint, options = {}) {
        try {
            const token = authService.getToken();
            
            const headers = {
                'Content-Type': 'application/json',
                'X-Client-Version': CLIENT_VERSION,
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
            return await this.request(`/fuel`, {
                method: 'POST',
                body: JSON.stringify({ siteId, ...data })
            });
        } catch (error) {
            console.error('Fuel log failed:', error);
            throw error;
        }
    }

    async getFuelLogs(siteId, params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/fuel/site/${siteId}${queryString ? `?${queryString}` : ''}`);
        } catch (error) {
            console.error('Failed to get fuel logs:', error);
            throw error;
        }
    }

    // Maintenance API Methods
    async logMaintenance(siteId, data) {
        try {
            return await this.request(`/maintenance`, {
                method: 'POST',
                body: JSON.stringify({ siteId, ...data })
            });
        } catch (error) {
            console.error('Maintenance log failed:', error);
            throw error;
        }
    }

    async scheduleMaintenance(siteId, data) {
        try {
            return await this.request(`/maintenance`, {
                method: 'POST',
                body: JSON.stringify({ siteId, scheduled: true, ...data })
            });
        } catch (error) {
            console.error('Maintenance scheduling failed:', error);
            throw error;
        }
    }

    async getMaintenanceHistory(siteId, params = {}) {
        try {
            const queryString = new URLSearchParams(params).toString();
            return await this.request(`/maintenance/site/${siteId}${queryString ? `?${queryString}` : ''}`);
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
        return Promise.reject(new Error('Alerts API not supported by backend'));
    }

    async getAlerts(params = {}) {
        return Promise.reject(new Error('Alerts API not supported by backend'));
    }
}

export const apiService = new ApiService();