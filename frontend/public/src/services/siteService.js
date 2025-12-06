// NetisTrackGh Site Service v1.0
// Complete site, fuel, and maintenance management service
import { API_BASE_URL, CLIENT_VERSION } from './config.js';

export const siteService = {
    
    // ============================
    // CONFIGURATION
    // ============================
    config: {
        backendBaseUrl: API_BASE_URL,
        maxRetryAttempts: 3,
        cacheDuration: 5 * 60 * 1000, // 5 minutes
        offlineMode: false,
        version: '1.0.0'
    },

    // ============================
    // INITIALIZATION
    // ============================
    init() {
        console.log(`🏗️ Site Service v${this.config.version} initialized`);
        
        // Check network status
        this.checkNetworkStatus();
        
        // Initialize offline storage
        this.initOfflineStorage();
        
        // Set up network monitoring
        this.setupNetworkMonitor();
        
        return this;
    },

    // ============================
    // SITES MANAGEMENT
    // ============================
    
    // Get all sites for current user
    async getSites(options = {}) {
        try {
            const { refresh = false, limit = 50, page = 1 } = options;
            const cacheKey = `sites_${limit}_${page}`;
            
            // Check cache first if not refreshing
            if (!refresh) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    console.log('📁 Returning cached sites');
                    return cached;
                }
            }
            
            // Build query parameters
            const params = new URLSearchParams({
                limit: limit.toString(),
                page: page.toString()
            });
            
            if (options.search) params.append('search', options.search);
            if (options.status) params.append('status', options.status);
            if (options.region) params.append('region', options.region);
            
            const url = `${this.config.backendBaseUrl}/sites?${params.toString()}`;
            
            const response = await this.authFetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch sites: ${response.status}`);
            }
            
            const sites = await response.json();
            
            // Cache the results
            this.cacheData(cacheKey, sites);
            
            // Update offline storage
            await this.updateOfflineSites(sites);
            
            console.log(`✅ Retrieved ${sites.length} sites`);
            
            return sites;
            
        } catch (error) {
            console.error('❌ Failed to get sites:', error);
            
            // Try to return cached or offline data
            const offlineSites = await this.getOfflineSites();
            if (offlineSites.length > 0) {
                console.log('📴 Returning offline sites');
                return offlineSites;
            }
            
            throw this.enhanceErrorMessage(error);
        }
    },
    
    // Create a new site
    async createSite(siteData) {
        try {
            console.log('🏗️ Creating new site:', siteData.siteId);
            
            // Validate site data
            const errors = this.validateSiteData(siteData);
            if (errors.length > 0) {
                throw new Error(`Validation failed: ${errors.join(', ')}`);
            }
            
            const response = await this.authFetch(`${this.config.backendBaseUrl}/sites`, {
                method: 'POST',
                body: JSON.stringify(siteData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to create site');
            }
            
            const createdSite = await response.json();
            
            // Clear sites cache
            this.clearCache('sites');
            
            // Add to offline storage
            await this.addOfflineSite(createdSite);
            
            // Log activity
            this.logActivity('site_created', {
                siteId: createdSite.siteId,
                siteName: createdSite.name
            });
            
            console.log('✅ Site created successfully:', createdSite.siteId);
            
            return createdSite;
            
        } catch (error) {
            console.error('❌ Failed to create site:', error);
            
            // Queue for offline sync
            await this.queueForSync({
                type: 'create_site',
                data: siteData,
                timestamp: new Date().toISOString()
            });
            
            // Return mock data for offline mode
            const mockSite = {
                ...siteData,
                id: `offline_${Date.now()}`,
                status: 'pending_sync',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            
            await this.addOfflineSite(mockSite);
            
            return mockSite;
        }
    },
    
    // Get site by ID
    async getSiteById(siteId, options = {}) {
        try {
            const cacheKey = `site_${siteId}`;
            
            // Check cache first if not refreshing
            if (!options.refresh) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    return cached;
                }
            }
            
            const response = await this.authFetch(`${this.config.backendBaseUrl}/sites/${siteId}`);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch site: ${response.status}`);
            }
            
            const site = await response.json();
            
            // Cache the result
            this.cacheData(cacheKey, site);
            
            console.log(`✅ Retrieved site: ${siteId}`);
            
            return site;
            
        } catch (error) {
            console.error('❌ Failed to get site:', error);
            
            // Try to get from offline storage
            const offlineSite = await this.getOfflineSite(siteId);
            if (offlineSite) {
                console.log('📴 Returning offline site');
                return offlineSite;
            }
            
            throw this.enhanceErrorMessage(error);
        }
    },
    
    // Update site
    async updateSite(siteId, updateData) {
        try {
            console.log(`🔄 Updating site: ${siteId}`);
            
            const response = await this.authFetch(`${this.config.backendBaseUrl}/sites/${siteId}`, {
                method: 'PUT',
                body: JSON.stringify(updateData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to update site');
            }
            
            const updatedSite = await response.json();
            
            // Clear cache for this site
            this.clearCache(`site_${siteId}`);
            this.clearCache('sites');
            
            // Update offline storage
            await this.updateOfflineSite(updatedSite);
            
            // Log activity
            this.logActivity('site_updated', {
                siteId: updatedSite.siteId,
                siteName: updatedSite.name,
                changes: Object.keys(updateData)
            });
            
            console.log('✅ Site updated successfully:', siteId);
            
            return updatedSite;
            
        } catch (error) {
            console.error('❌ Failed to update site:', error);
            
            // Queue for offline sync
            await this.queueForSync({
                type: 'update_site',
                data: { siteId, ...updateData },
                timestamp: new Date().toISOString()
            });
            
            throw this.enhanceErrorMessage(error);
        }
    },
    
    // Search sites
    async searchSites(query, options = {}) {
        try {
            const params = new URLSearchParams({ query: query });
            if (options.limit) params.append('limit', options.limit);
            if (options.page) params.append('page', options.page);
            
            const url = `${this.config.backendBaseUrl}/sites/search?${params.toString()}`;
            
            const response = await this.authFetch(url);
            
            if (!response.ok) {
                throw new Error(`Search failed: ${response.status}`);
            }
            
            const results = await response.json();
            
            console.log(`🔍 Search results: ${results.length} sites found`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Search failed:', error);
            
            // Try local search in offline storage
            const offlineSites = await this.getOfflineSites();
            const filtered = offlineSites.filter(site =>
                site.siteId?.includes(query) ||
                site.name?.toLowerCase().includes(query.toLowerCase()) ||
                site.location?.toLowerCase().includes(query.toLowerCase())
            );
            
            return filtered;
        }
    },
    
    // ============================
    // FUEL MANAGEMENT
    // ============================
    
    // Add fuel log entry
    async addFuelLog(fuelData) {
        try {
            console.log('⛽ Adding fuel log for site:', fuelData.siteId);
            
            // Validate fuel data
            const errors = this.validateFuelData(fuelData);
            if (errors.length > 0) {
                throw new Error(`Validation failed: ${errors.join(', ')}`);
            }
            
            const response = await this.authFetch(`${this.config.backendBaseUrl}/fuel`, {
                method: 'POST',
                body: JSON.stringify(fuelData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to add fuel log');
            }
            
            const fuelLog = await response.json();
            
            // Clear fuel cache for this site
            this.clearCache(`fuel_${fuelData.siteId}`);
            
            // Update site's fuel level in local cache
            await this.updateSiteFuelLevel(fuelData.siteId, fuelData.fuelAmount);
            
            // Log activity
            this.logActivity('fuel_log_added', {
                siteId: fuelData.siteId,
                amount: fuelData.fuelAmount,
                fuelType: fuelData.fuelType
            });
            
            console.log('✅ Fuel log added successfully');
            
            return fuelLog;
            
        } catch (error) {
            console.error('❌ Failed to add fuel log:', error);
            
            // Queue for offline sync
            await this.queueForSync({
                type: 'add_fuel_log',
                data: fuelData,
                timestamp: new Date().toISOString()
            });
            
            // Update local site data
            await this.updateLocalSiteFuel(fuelData);
            
            // Return mock response
            return {
                ...fuelData,
                id: `offline_${Date.now()}`,
                status: 'pending_sync',
                createdAt: new Date().toISOString()
            };
        }
    },
    
    // Get fuel logs for a site
    async getFuelLogs(siteId, options = {}) {
        try {
            const cacheKey = `fuel_${siteId}_${options.limit || 'all'}`;
            
            // Check cache first if not refreshing
            if (!options.refresh) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    return cached;
                }
            }
            
            const params = new URLSearchParams();
            if (options.limit) params.append('limit', options.limit);
            if (options.page) params.append('page', options.page);
            if (options.startDate) params.append('startDate', options.startDate);
            if (options.endDate) params.append('endDate', options.endDate);
            
            const url = `${this.config.backendBaseUrl}/fuel/site/${siteId}?${params.toString()}`;
            
            const response = await this.authFetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch fuel logs: ${response.status}`);
            }
            
            const fuelLogs = await response.json();
            
            // Cache the results
            this.cacheData(cacheKey, fuelLogs);
            
            console.log(`✅ Retrieved ${fuelLogs.length} fuel logs for site ${siteId}`);
            
            return fuelLogs;
            
        } catch (error) {
            console.error('❌ Failed to get fuel logs:', error);
            
            // Try to get from offline storage
            const offlineLogs = await this.getOfflineFuelLogs(siteId);
            return offlineLogs;
        }
    },
    
    // Get fuel consumption analytics
    async getFuelConsumption(siteId, period = '30d') {
        try {
            const response = await this.authFetch(
                `${this.config.backendBaseUrl}/fuel/consumption/${siteId}?period=${period}`
            );
            
            if (!response.ok) {
                throw new Error(`Failed to get fuel consumption: ${response.status}`);
            }
            
            const analytics = await response.json();
            
            console.log(`📊 Fuel consumption analytics for site ${siteId}`);
            
            return analytics;
            
        } catch (error) {
            console.error('❌ Failed to get fuel consumption:', error);
            
            // Return mock analytics for offline mode
            return this.generateMockFuelAnalytics(siteId, period);
        }
    },
    
    // ============================
    // MAINTENANCE MANAGEMENT
    // ============================
    
    // Add maintenance log
    async addMaintenanceLog(maintenanceData) {
        try {
            console.log('🔧 Adding maintenance log for site:', maintenanceData.siteId);
            
            // Validate maintenance data
            const errors = this.validateMaintenanceData(maintenanceData);
            if (errors.length > 0) {
                throw new Error(`Validation failed: ${errors.join(', ')}`);
            }
            
            const response = await this.authFetch(`${this.config.backendBaseUrl}/maintenance`, {
                method: 'POST',
                body: JSON.stringify(maintenanceData)
            });
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || 'Failed to add maintenance log');
            }
            
            const maintenanceLog = await response.json();
            
            // Clear maintenance cache for this site
            this.clearCache(`maintenance_${maintenanceData.siteId}`);
            
            // Update site's maintenance status
            await this.updateSiteMaintenanceStatus(maintenanceData.siteId);
            
            // Log activity
            this.logActivity('maintenance_log_added', {
                siteId: maintenanceData.siteId,
                type: maintenanceData.type,
                status: maintenanceData.status
            });
            
            console.log('✅ Maintenance log added successfully');
            
            return maintenanceLog;
            
        } catch (error) {
            console.error('❌ Failed to add maintenance log:', error);
            
            // Queue for offline sync
            await this.queueForSync({
                type: 'add_maintenance_log',
                data: maintenanceData,
                timestamp: new Date().toISOString()
            });
            
            // Return mock response
            return {
                ...maintenanceData,
                id: `offline_${Date.now()}`,
                status: 'pending_sync',
                createdAt: new Date().toISOString()
            };
        }
    },
    
    // Get maintenance logs for a site
    async getMaintenanceLogs(siteId, options = {}) {
        try {
            const cacheKey = `maintenance_${siteId}_${options.limit || 'all'}`;
            
            // Check cache first if not refreshing
            if (!options.refresh) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    return cached;
                }
            }
            
            const params = new URLSearchParams();
            if (options.limit) params.append('limit', options.limit);
            if (options.page) params.append('page', options.page);
            if (options.type) params.append('type', options.type);
            if (options.status) params.append('status', options.status);
            
            const url = `${this.config.backendBaseUrl}/maintenance/site/${siteId}?${params.toString()}`;
            
            const response = await this.authFetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch maintenance logs: ${response.status}`);
            }
            
            const maintenanceLogs = await response.json();
            
            // Cache the results
            this.cacheData(cacheKey, maintenanceLogs);
            
            console.log(`✅ Retrieved ${maintenanceLogs.length} maintenance logs for site ${siteId}`);
            
            return maintenanceLogs;
            
        } catch (error) {
            console.error('❌ Failed to get maintenance logs:', error);
            
            // Try to get from offline storage
            const offlineLogs = await this.getOfflineMaintenanceLogs(siteId);
            return offlineLogs;
        }
    },
    
    // Get upcoming maintenance
    async getUpcomingMaintenance(options = {}) {
        try {
            const cacheKey = 'upcoming_maintenance';
            
            // Check cache first if not refreshing
            if (!options.refresh) {
                const cached = this.getFromCache(cacheKey);
                if (cached) {
                    return cached;
                }
            }
            
            const params = new URLSearchParams();
            if (options.days) params.append('days', options.days);
            if (options.priority) params.append('priority', options.priority);
            
            const url = `${this.config.backendBaseUrl}/maintenance/upcoming?${params.toString()}`;
            
            const response = await this.authFetch(url);
            
            if (!response.ok) {
                throw new Error(`Failed to fetch upcoming maintenance: ${response.status}`);
            }
            
            const upcoming = await response.json();
            
            // Cache the results
            this.cacheData(cacheKey, upcoming);
            
            console.log(`✅ Retrieved ${upcoming.length} upcoming maintenance tasks`);
            
            return upcoming;
            
        } catch (error) {
            console.error('❌ Failed to get upcoming maintenance:', error);
            
            // Generate from offline data
            return this.generateMockUpcomingMaintenance();
        }
    },
    
    // ============================
    // SYNC MANAGEMENT
    // ============================
    
    // Process offline sync queue
    async syncOfflineData() {
        try {
            console.log('🔄 Starting offline data sync...');
            
            const syncQueue = await this.getSyncQueue();
            
            if (syncQueue.length === 0) {
                console.log('✅ No data to sync');
                return { success: true, processed: 0 };
            }
            
            const syncData = {
                operations: syncQueue,
                deviceId: this.getDeviceId(),
                timestamp: new Date().toISOString()
            };
            
            const response = await fetch(`${this.config.backendBaseUrl}/sync`, {
                method: 'POST',
                headers: this.getAuthHeaders(),
                body: JSON.stringify(syncData)
            });
            
            if (!response.ok) {
                throw new Error(`Sync failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            // Clear sync queue on success
            await this.clearSyncQueue();
            
            // Clear all caches
            this.clearAllCaches();
            
            console.log(`✅ Sync completed: ${syncQueue.length} operations processed`);
            
            this.logActivity('sync_completed', {
                operations: syncQueue.length,
                success: result.success || 0,
                failed: result.failed || 0
            });
            
            return result;
            
        } catch (error) {
            console.error('❌ Sync failed:', error);
            
            this.logActivity('sync_failed', {
                error: error.message
            });
            
            throw this.enhanceErrorMessage(error);
        }
    },
    
    // Get sync status
    async getSyncStatus() {
        try {
            const response = await this.authFetch(`${this.config.backendBaseUrl}/sync/status`);
            
            if (!response.ok) {
                throw new Error(`Failed to get sync status: ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('❌ Failed to get sync status:', error);
            
            // Return mock status for offline mode
            return {
                status: 'offline',
                lastSync: localStorage.getItem('last_sync'),
                pendingOperations: await this.getSyncQueueCount()
            };
        }
    },
    
    // ============================
    // VALIDATION METHODS
    // ============================
    validateSiteData(siteData) {
        const errors = [];
        
        if (!siteData.siteId || siteData.siteId.trim().length < 3) {
            errors.push('Site ID must be at least 3 characters');
        }
        
        if (!siteData.name || siteData.name.trim().length < 2) {
            errors.push('Site name is required');
        }
        
        if (!siteData.location || siteData.location.trim().length < 5) {
            errors.push('Valid location is required');
        }
        
        if (siteData.fuelLevel !== undefined && (siteData.fuelLevel < 0 || siteData.fuelLevel > 100)) {
            errors.push('Fuel level must be between 0-100%');
        }
        
        return errors;
    },
    
    validateFuelData(fuelData) {
        const errors = [];
        
        if (!fuelData.siteId) {
            errors.push('Site ID is required');
        }
        
        if (!fuelData.fuelAmount || fuelData.fuelAmount <= 0) {
            errors.push('Valid fuel amount is required');
        }
        
        if (!fuelData.fuelType) {
            errors.push('Fuel type is required');
        }
        
        if (!fuelData.date) {
            errors.push('Date is required');
        }
        
        return errors;
    },
    
    validateMaintenanceData(maintenanceData) {
        const errors = [];
        
        if (!maintenanceData.siteId) {
            errors.push('Site ID is required');
        }
        
        if (!maintenanceData.type) {
            errors.push('Maintenance type is required');
        }
        
        if (!maintenanceData.description || maintenanceData.description.trim().length < 10) {
            errors.push('Description must be at least 10 characters');
        }
        
        if (!maintenanceData.technician || maintenanceData.technician.trim().length < 2) {
            errors.push('Technician name is required');
        }
        
        return errors;
    },
    
    // ============================
    // CACHE MANAGEMENT
    // ============================
    cacheData(key, data) {
        try {
            const cacheEntry = {
                data,
                timestamp: Date.now(),
                expiry: Date.now() + this.config.cacheDuration
            };
            
            localStorage.setItem(`cache_${key}`, JSON.stringify(cacheEntry));
        } catch (error) {
            console.warn('⚠️ Failed to cache data:', error);
        }
    },
    
    getFromCache(key) {
        try {
            const cacheEntry = localStorage.getItem(`cache_${key}`);
            if (!cacheEntry) return null;
            
            const { data, expiry } = JSON.parse(cacheEntry);
            
            if (expiry < Date.now()) {
                localStorage.removeItem(`cache_${key}`);
                return null;
            }
            
            return data;
        } catch (error) {
            console.warn('⚠️ Failed to get from cache:', error);
            return null;
        }
    },
    
    clearCache(key) {
        if (key === 'all') {
            // Clear all cache entries
            Object.keys(localStorage).forEach(k => {
                if (k.startsWith('cache_')) {
                    localStorage.removeItem(k);
                }
            });
        } else {
            localStorage.removeItem(`cache_${key}`);
        }
    },
    
    clearAllCaches() {
        this.clearCache('all');
    },
    
    // ============================
    // OFFLINE STORAGE
    // ============================
    initOfflineStorage() {
        // Initialize IndexedDB or fallback to localStorage
        if (!localStorage.getItem('offline_init')) {
            localStorage.setItem('offline_sites', JSON.stringify([]));
            localStorage.setItem('offline_fuel_logs', JSON.stringify([]));
            localStorage.setItem('offline_maintenance_logs', JSON.stringify([]));
            localStorage.setItem('offline_sync_queue', JSON.stringify([]));
            localStorage.setItem('offline_init', 'true');
        }
    },
    
    async getOfflineSites() {
        try {
            const sites = JSON.parse(localStorage.getItem('offline_sites') || '[]');
            return sites;
        } catch {
            return [];
        }
    },
    
    async getOfflineSite(siteId) {
        const sites = await this.getOfflineSites();
        return sites.find(s => s.siteId === siteId || s.id === siteId);
    },
    
    async addOfflineSite(site) {
        try {
            const sites = await this.getOfflineSites();
            sites.unshift(site);
            localStorage.setItem('offline_sites', JSON.stringify(sites.slice(0, 100))); // Limit to 100
        } catch (error) {
            console.warn('⚠️ Failed to add offline site:', error);
        }
    },
    
    async updateOfflineSites(newSites) {
        try {
            localStorage.setItem('offline_sites', JSON.stringify(newSites));
        } catch (error) {
            console.warn('⚠️ Failed to update offline sites:', error);
        }
    },
    
    async getOfflineFuelLogs(siteId) {
        try {
            const logs = JSON.parse(localStorage.getItem('offline_fuel_logs') || '[]');
            return logs.filter(log => log.siteId === siteId);
        } catch {
            return [];
        }
    },
    
    async getOfflineMaintenanceLogs(siteId) {
        try {
            const logs = JSON.parse(localStorage.getItem('offline_maintenance_logs') || '[]');
            return logs.filter(log => log.siteId === siteId);
        } catch {
            return [];
        }
    },
    
    async queueForSync(operation) {
        try {
            const queue = JSON.parse(localStorage.getItem('offline_sync_queue') || '[]');
            queue.push(operation);
            localStorage.setItem('offline_sync_queue', JSON.stringify(queue));
        } catch (error) {
            console.warn('⚠️ Failed to queue for sync:', error);
        }
    },
    
    async getSyncQueue() {
        try {
            return JSON.parse(localStorage.getItem('offline_sync_queue') || '[]');
        } catch {
            return [];
        }
    },
    
    async getSyncQueueCount() {
        const queue = await this.getSyncQueue();
        return queue.length;
    },
    
    async clearSyncQueue() {
        localStorage.setItem('offline_sync_queue', JSON.stringify([]));
    },
    
    // ============================
    // HELPER METHODS
    // ============================
    async authFetch(url, options = {}) {
        // Get auth token from authService
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Client-Version': this.config.version,
            ...options.headers
        };
        
        const response = await fetch(url, { ...options, headers });
        
        // Handle 401 (unauthorized) - token might be expired
        if (response.status === 401) {
            console.log('🔄 Token expired, attempting refresh...');
            
            try {
                // Try to refresh token using authService
                if (window.authService && window.authService.refreshToken) {
                    await window.authService.refreshToken();
                    
                    // Get new token and retry
                    const newToken = localStorage.getItem('auth_token');
                    headers.Authorization = `Bearer ${newToken}`;
                    
                    return await fetch(url, { ...options, headers });
                }
            } catch (refreshError) {
                console.error('❌ Token refresh failed:', refreshError);
                throw new Error('Session expired. Please login again.');
            }
        }
        
        if (!response.ok && response.status !== 401) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        return response;
    },
    
    getAuthHeaders() {
        const token = localStorage.getItem('auth_token');
        
        if (!token) {
            throw new Error('Not authenticated');
        }
        
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Client-Version': this.config.version
        };
    },
    
    getDeviceId() {
        let deviceId = localStorage.getItem('device_id');
        
        if (!deviceId) {
            deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('device_id', deviceId);
        }
        
        return deviceId;
    },
    
    checkNetworkStatus() {
        this.config.offlineMode = !navigator.onLine;
        
        if (this.config.offlineMode) {
            console.log('📴 Offline mode enabled');
        } else {
            console.log('📡 Online mode');
        }
        
        return !this.config.offlineMode;
    },
    
    setupNetworkMonitor() {
        window.addEventListener('online', () => {
            this.config.offlineMode = false;
            console.log('📡 Network connection restored');
            this.logActivity('network_restored');
        });
        
        window.addEventListener('offline', () => {
            this.config.offlineMode = true;
            console.log('📴 Network connection lost');
            this.logActivity('network_lost');
        });
    },
    
    enhanceErrorMessage(error) {
        const errorMap = {
            'Failed to fetch': 'Cannot connect to the server. Please check your connection.',
            'Network request failed': 'Network error. Please check your internet connection.',
            'Not authenticated': 'Your session has expired. Please login again.',
            '401': 'Authentication failed. Please login again.',
            '403': 'You do not have permission to perform this action.',
            '404': 'The requested resource was not found.',
            '429': 'Too many requests. Please try again later.',
            '500': 'Server error. Please try again later.',
            '502': 'Bad gateway. The server is temporarily unavailable.',
            '503': 'Service unavailable. Please try again later.',
            '504': 'Gateway timeout. The server took too long to respond.'
        };
        
        for (const [key, message] of Object.entries(errorMap)) {
            if (error.message.includes(key) || error.toString().includes(key)) {
                return new Error(message);
            }
        }
        
        return error;
    },
    
    logActivity(event, data = {}) {
        const activity = {
            timestamp: new Date().toISOString(),
            event,
            userId: localStorage.getItem('auth_user') ? 
                JSON.parse(localStorage.getItem('auth_user')).uid : null,
            ...data
        };
        
        // Store in localStorage
        const activities = JSON.parse(localStorage.getItem('activities') || '[]');
        activities.unshift(activity);
        
        // Keep only last 100 activities
        if (activities.length > 100) {
            activities.splice(100);
        }
        
        localStorage.setItem('activities', JSON.stringify(activities));
        
        console.log(`📝 Activity: ${event}`, data);
    },
    
    // ============================
    // MOCK DATA GENERATORS (For offline mode)
    // ============================
    generateMockFuelAnalytics(siteId, period) {
        const now = new Date();
        const analytics = {
            siteId,
            period,
            totalConsumption: Math.random() * 1000 + 500,
            averageDaily: Math.random() * 30 + 10,
            last30Days: [],
            predictions: {
                nextRefuel: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                estimatedRemainingDays: Math.floor(Math.random() * 10) + 5
            }
        };
        
        // Generate last 30 days data
        for (let i = 29; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            analytics.last30Days.push({
                date: date.toISOString().split('T')[0],
                consumption: Math.random() * 50 + 10,
                cost: Math.random() * 500 + 200
            });
        }
        
        return analytics;
    },
    
    generateMockUpcomingMaintenance() {
        const upcoming = [];
        const types = ['preventive', 'corrective', 'inspection', 'routine'];
        const priorities = ['low', 'medium', 'high'];
        
        for (let i = 0; i < 5; i++) {
            const daysFromNow = Math.floor(Math.random() * 30) + 1;
            const dueDate = new Date(Date.now() + daysFromNow * 24 * 60 * 60 * 1000);
            
            upcoming.push({
                id: `mock_${i}`,
                siteId: `60054${i + 5}`,
                siteName: `Mock Site ${i + 1}`,
                type: types[Math.floor(Math.random() * types.length)],
                priority: priorities[Math.floor(Math.random() * priorities.length)],
                dueDate: dueDate.toISOString(),
                description: `Scheduled maintenance task ${i + 1}`,
                estimatedHours: Math.floor(Math.random() * 8) + 1
            });
        }
        
        return upcoming;
    },
    
    // ============================
    // LOCAL SITE UPDATES
    // ============================
    async updateSiteFuelLevel(siteId, fuelAmount) {
        try {
            // Get current site from cache or offline storage
            const site = await this.getOfflineSite(siteId) || 
                         this.getFromCache(`site_${siteId}`);
            
            if (site) {
                // Update fuel level (simplified calculation)
                site.fuelLevel = Math.min(100, (site.fuelLevel || 0) + Math.floor(fuelAmount / 10));
                site.lastUpdated = new Date().toISOString();
                
                // Update cache and offline storage
                this.cacheData(`site_${siteId}`, site);
                await this.updateOfflineSite(site);
            }
        } catch (error) {
            console.warn('⚠️ Failed to update local fuel level:', error);
        }
    },
    
    async updateLocalSiteFuel(fuelData) {
        await this.updateSiteFuelLevel(fuelData.siteId, fuelData.fuelAmount);
    },
    
    async updateSiteMaintenanceStatus(siteId) {
        try {
            const site = await this.getOfflineSite(siteId) || 
                         this.getFromCache(`site_${siteId}`);
            
            if (site) {
                site.maintenanceStatus = 'ok';
                site.lastUpdated = new Date().toISOString();
                
                this.cacheData(`site_${siteId}`, site);
                await this.updateOfflineSite(site);
            }
        } catch (error) {
            console.warn('⚠️ Failed to update maintenance status:', error);
        }
    },
    
    async updateOfflineSite(updatedSite) {
        try {
            const sites = await this.getOfflineSites();
            const index = sites.findIndex(s => 
                s.siteId === updatedSite.siteId || s.id === updatedSite.id
            );
            
            if (index !== -1) {
                sites[index] = { ...sites[index], ...updatedSite };
                localStorage.setItem('offline_sites', JSON.stringify(sites));
            }
        } catch (error) {
            console.warn('⚠️ Failed to update offline site:', error);
        }
    },
    
    // ============================
    // UTILITY METHODS
    // ============================
    formatDate(date) {
        return new Date(date).toLocaleDateString('en-GH', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    formatCurrency(amount, currency = 'GHS') {
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: currency
        }).format(amount);
    },
    
    calculateFuelRemaining(fuelLevel, consumptionRate) {
        if (!fuelLevel || !consumptionRate) return null;
        
        const hoursRemaining = (fuelLevel / 100) * consumptionRate;
        return {
            hours: hoursRemaining,
            days: hoursRemaining / 24,
            status: hoursRemaining > 48 ? 'good' : hoursRemaining > 24 ? 'warning' : 'critical'
        };
    }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    siteService.init();
});

// Make available globally
window.siteService = siteService;