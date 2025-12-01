// NetisTrackGh Authentication Service v2.0
// Complete backend-only authentication with professional features
export const authService = {
    
    // ============================
    // CONFIGURATION
    // ============================
    config: {
        backendBaseUrl: 'http://localhost:3000/api', 
        tokenRefreshInterval: 15 * 60 * 1000, // 15 mins
        maxRetryAttempts: 3,
        tokenExpiryBuffer: 5 * 60 * 1000, // 5 min buffer before expiry
        sessionTimeout: 24 * 60 * 60 * 1000, // 24 hours
        version: '2.0.0'
    },

    // ============================
    // INITIALIZATION
    // ============================
    init() {
        console.log(`🚀 Auth Service v${this.config.version} initialized`);
        
        // Check for existing session
        this.restoreSession();
        
        // Start session monitoring
        this.startSessionMonitor();
        
        // Set up auto-logout for inactivity
        this.setupInactivityMonitor();
        
        return this;
    },

    // ============================
    // LOGIN (BACKEND ONLY)
    // ============================
    async login(email, password, rememberMe = false) {
        try {
            console.log('🔐 Login attempt:', email);
            
            // Validate inputs
            if (!this.validateEmail(email)) {
                throw new Error('Invalid email format');
            }
            
            if (!this.validatePassword(password)) {
                throw new Error('Password must be at least 6 characters');
            }

            // Track login attempts
            this.trackLoginAttempt(email);

            // Authenticate with backend
            const response = await fetch(`${this.config.backendBaseUrl}/auth/verify`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'X-Client-Version': this.config.version,
                    'X-Client-Platform': this.getClientPlatform()
                },
                body: JSON.stringify({ 
                    email: email.trim().toLowerCase(), 
                    password 
                })
            });

            const responseData = await response.json().catch(() => ({}));

            if (!response.ok) {
                this.handleLoginError(response.status, responseData);
                return null;
            }

            console.log('✅ Login successful:', responseData.user.role);
            
            // Store authentication data
            this.storeAuthData(responseData, rememberMe);
            
            // Update session
            this.updateSession({
                email: email,
                loginTime: new Date().toISOString(),
                ip: await this.getClientIP(),
                userAgent: navigator.userAgent
            });

            // Start auto-refresh
            this.startAutoRefresh();

            // Log successful login
            this.logSecurityEvent('login_success', { email, role: responseData.user.role });

            return {
                success: true,
                user: responseData.user,
                token: responseData.token,
                permissions: this.getUserPermissions(responseData.user.role)
            };

        } catch (error) {
            console.error('❌ Login error:', error);
            this.logSecurityEvent('login_failed', { email, error: error.message });
            throw this.enhanceErrorMessage(error);
        }
    },

    // ============================
    // SESSION MANAGEMENT
    // ============================
    storeAuthData(data, rememberMe = false) {
        try {
            // Store in localStorage (persistent)
            localStorage.setItem('auth_token', data.token);
            localStorage.setItem('auth_refresh', data.refreshToken || '');
            localStorage.setItem('auth_user', JSON.stringify(data.user));
            localStorage.setItem('auth_role', data.user.role);
            localStorage.setItem('auth_expiry', new Date(Date.now() + (data.expiresIn * 1000)).toISOString());
            localStorage.setItem('auth_version', this.config.version);

            // If remember me is false, also store in sessionStorage
            if (!rememberMe) {
                sessionStorage.setItem('auth_token', data.token);
                sessionStorage.setItem('auth_user', JSON.stringify(data.user));
            }

            // Set cookie for backend requests
            this.setAuthCookie(data.token, rememberMe);

            console.log('💾 Auth data stored');
            
        } catch (error) {
            console.error('❌ Failed to store auth data:', error);
            throw new Error('Authentication storage failed');
        }
    },

    setAuthCookie(token, rememberMe = false) {
        const expires = rememberMe ? 
            `; expires=${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString()}` : 
            '';
        document.cookie = `auth_token=${token}${expires}; path=/; Secure; SameSite=Strict`;
    },

    clearAuthCookie() {
        document.cookie = 'auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    },

    restoreSession() {
        try {
            const token = localStorage.getItem('auth_token');
            const user = localStorage.getItem('auth_user');
            const expiry = localStorage.getItem('auth_expiry');

            if (token && user && expiry && new Date(expiry) > new Date()) {
                console.log('🔄 Session restored');
                this.startAutoRefresh();
                return JSON.parse(user);
            }
            
            this.clearAuthData();
            return null;
            
        } catch (error) {
            console.error('❌ Session restore failed:', error);
            this.clearAuthData();
            return null;
        }
    },

    clearAuthData() {
        // Clear localStorage
        ['auth_token', 'auth_refresh', 'auth_user', 'auth_role', 'auth_expiry'].forEach(key => {
            localStorage.removeItem(key);
        });

        // Clear sessionStorage
        ['auth_token', 'auth_user'].forEach(key => {
            sessionStorage.removeItem(key);
        });

        // Clear cookies
        this.clearAuthCookie();

        // Clear intervals
        this.stopAutoRefresh();
        this.stopSessionMonitor();
        this.stopInactivityMonitor();
    },

    // ============================
    // TOKEN MANAGEMENT
    // ============================
    async refreshToken() {
        try {
            const refreshToken = localStorage.getItem('auth_refresh');
            
            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            console.log('🔄 Refreshing token...');
            
            const response = await fetch(`${this.config.backendBaseUrl}/auth/refresh`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refreshToken })
            });

            if (!response.ok) {
                throw new Error('Token refresh failed');
            }

            const data = await response.json();
            this.storeAuthData(data, true);
            
            console.log('✅ Token refreshed');
            this.logSecurityEvent('token_refreshed');
            
            return data.token;

        } catch (error) {
            console.error('❌ Token refresh error:', error);
            this.logSecurityEvent('token_refresh_failed', { error: error.message });
            await this.logout(true); // Silent logout
            throw error;
        }
    },

    startAutoRefresh() {
        this.stopAutoRefresh();
        
        this.refreshInterval = setInterval(async () => {
            try {
                const expiry = localStorage.getItem('auth_expiry');
                if (expiry && new Date(expiry) < new Date(Date.now() + this.config.tokenExpiryBuffer)) {
                    await this.refreshToken();
                }
            } catch (error) {
                console.error('❌ Auto-refresh failed:', error);
            }
        }, 60000); // Check every minute

        console.log('⏱️ Auto-refresh started');
    },

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    // ============================
    // VALIDATION
    // ============================
    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email.trim());
    },

    validatePassword(password) {
        return password && password.length >= 6;
    },

    // ============================
    // AUTH STATE CHECKERS
    // ============================
    isAuthenticated() {
        try {
            const token = this.getToken();
            const expiry = localStorage.getItem('auth_expiry');
            
            if (!token || !expiry) return false;
            
            const isExpired = new Date(expiry) <= new Date();
            
            if (isExpired) {
                console.log('🔄 Token expired');
                return false;
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Auth check error:', error);
            return false;
        }
    },

    getToken() {
        return localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
    },

    getUser() {
        try {
            const userStr = localStorage.getItem('auth_user') || sessionStorage.getItem('auth_user');
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    },

    getUserRole() {
        return localStorage.getItem('auth_role');
    },

    // ============================
    // PERMISSIONS & ACCESS CONTROL
    // ============================
    hasRole(requiredRole) {
        const userRole = this.getUserRole();
        const roleHierarchy = {
            'technician': 1,
            'supervisor': 2,
            'admin': 3
        };
        
        return (roleHierarchy[userRole] || 0) >= (roleHierarchy[requiredRole] || 0);
    },

    hasAnyRole(roles) {
        const userRole = this.getUserRole();
        return Array.isArray(roles) && roles.includes(userRole);
    },

    getUserPermissions(role = null) {
        const userRole = role || this.getUserRole();
        
        const permissions = {
            technician: [
                'view:assigned_sites',
                'create:fuel_logs',
                'create:maintenance_logs',
                'read:own_reports',
                'update:own_profile'
            ],
            supervisor: [
                'view:all_sites',
                'verify:logs',
                'read:analytics',
                'manage:technicians',
                'generate:reports',
                'export:data'
            ],
            admin: [
                '*:all', // Full access
                'manage:users',
                'manage:system',
                'audit:logs',
                'configure:settings'
            ]
        };
        
        return permissions[userRole] || [];
    },

    hasPermission(permission) {
        const permissions = this.getUserPermissions();
        return permissions.includes('*:all') || permissions.includes(permission);
    },

    // ============================
    // LOGOUT
    // ============================
    async logout(silent = false, reason = 'user_initiated') {
        try {
            console.log('🚪 Logout initiated:', reason);
            
            // Get user info before clearing
            const user = this.getUser();
            
            // Clear all auth data
            this.clearAuthData();
            
            // Notify backend if needed
            if (!silent && this.isAuthenticated()) {
                await this.notifyBackendLogout();
            }
            
            // Log security event
            this.logSecurityEvent('logout', { 
                reason, 
                userId: user?.uid,
                email: user?.email 
            });
            
            if (!silent) {
                // Show logout message
                this.showToast('Logged out successfully', 'info');
                
                // Redirect after delay
                setTimeout(() => {
                    window.location.hash = 'login';
                }, 1500);
            }
            
        } catch (error) {
            console.error('❌ Logout error:', error);
            // Still clear data and redirect
            this.clearAuthData();
            if (!silent) window.location.hash = 'login';
        }
    },

    async notifyBackendLogout() {
        try {
            await fetch(`${this.config.backendBaseUrl}/auth/logout`, {
                method: 'POST',
                headers: this.getAuthHeaders()
            });
        } catch (error) {
            // Silent fail - logout should work even if backend notification fails
            console.warn('⚠️ Backend logout notification failed:', error);
        }
    },

    // ============================
    // PASSWORD MANAGEMENT
    // ============================
    async resetPassword(email) {
        if (!this.validateEmail(email)) {
            throw new Error('Invalid email address');
        }

        const response = await fetch(`${this.config.backendBaseUrl}/auth/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });

        if (!response.ok) {
            throw new Error('Failed to send reset email');
        }

        console.log('📧 Password reset email sent');
        this.logSecurityEvent('password_reset_requested', { email });
        
        return true;
    },

    async changePassword(currentPassword, newPassword) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const response = await fetch(`${this.config.backendBaseUrl}/auth/change-password`, {
            method: 'POST',
            headers: this.getAuthHeaders(),
            body: JSON.stringify({ currentPassword, newPassword })
        });

        if (!response.ok) {
            throw new Error('Password change failed');
        }

        console.log('🔑 Password changed successfully');
        this.logSecurityEvent('password_changed');
        
        return true;
    },

    // ============================
    // SESSION MONITORING
    // ============================
    startSessionMonitor() {
        this.stopSessionMonitor();
        
        this.sessionMonitor = setInterval(() => {
            const lastActivity = localStorage.getItem('last_activity');
            const sessionTimeout = this.config.sessionTimeout;
            
            if (lastActivity && (Date.now() - parseInt(lastActivity)) > sessionTimeout) {
                console.log('🕐 Session timeout');
                this.logout(false, 'session_timeout');
            }
        }, 60000); // Check every minute

        console.log('👁️ Session monitor started');
    },

    stopSessionMonitor() {
        if (this.sessionMonitor) {
            clearInterval(this.sessionMonitor);
            this.sessionMonitor = null;
        }
    },

    updateActivity() {
        localStorage.setItem('last_activity', Date.now().toString());
    },

    // ============================
    // INACTIVITY MONITOR
    // ============================
    setupInactivityMonitor() {
        const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
        
        const resetTimer = () => {
            this.updateActivity();
            this.resetInactivityTimer();
        };

        events.forEach(event => {
            document.addEventListener(event, resetTimer, { passive: true });
        });

        this.startInactivityTimer();
    },

    startInactivityTimer() {
        this.stopInactivityTimer();
        
        this.inactivityTimer = setTimeout(() => {
            if (this.isAuthenticated()) {
                console.log('⏳ User inactive for 30 minutes');
                this.showInactivityWarning();
            }
        }, 30 * 60 * 1000); // 30 minutes
    },

    stopInactivityTimer() {
        if (this.inactivityTimer) {
            clearTimeout(this.inactivityTimer);
            this.inactivityTimer = null;
        }
    },

    resetInactivityTimer() {
        this.stopInactivityTimer();
        this.startInactivityTimer();
    },

    showInactivityWarning() {
        // Create warning modal
        const warningModal = document.createElement('div');
        warningModal.className = 'inactivity-warning';
        warningModal.innerHTML = `
            <div class="warning-content">
                <h3>Are you still there?</h3>
                <p>Your session will expire due to inactivity in 5 minutes.</p>
                <div class="warning-actions">
                    <button id="stayLoggedIn" class="btn btn-primary">Stay Logged In</button>
                    <button id="logoutNow" class="btn btn-secondary">Logout Now</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(warningModal);
        
        // Add event listeners
        document.getElementById('stayLoggedIn').addEventListener('click', () => {
            this.updateActivity();
            document.body.removeChild(warningModal);
        });
        
        document.getElementById('logoutNow').addEventListener('click', () => {
            this.logout(false, 'inactivity_timeout');
            document.body.removeChild(warningModal);
        });
        
        // Auto logout after 5 minutes
        setTimeout(() => {
            if (document.body.contains(warningModal)) {
                document.body.removeChild(warningModal);
                this.logout(false, 'inactivity_timeout');
            }
        }, 5 * 60 * 1000);
    },

    // ============================
    // SECURITY & LOGGING
    // ============================
    logSecurityEvent(event, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            event,
            userId: this.getUser()?.uid,
            email: this.getUser()?.email,
            userAgent: navigator.userAgent,
            ip: this.getClientIP(),
            ...data
        };

        // Store in localStorage (rotating logs)
        const securityLogs = JSON.parse(localStorage.getItem('security_logs') || '[]');
        securityLogs.push(logEntry);
        
        // Keep only last 100 entries
        if (securityLogs.length > 100) {
            securityLogs.splice(0, securityLogs.length - 100);
        }
        
        localStorage.setItem('security_logs', JSON.stringify(securityLogs));
        
        // Also send to backend if available
        this.sendSecurityLog(logEntry);
        
        console.log(`🔒 Security event: ${event}`, logEntry);
    },

    async sendSecurityLog(logEntry) {
        try {
            if (this.isAuthenticated()) {
                await fetch(`${this.config.backendBaseUrl}/auth/security-logs`, {
                    method: 'POST',
                    headers: this.getAuthHeaders(),
                    body: JSON.stringify(logEntry)
                });
            }
        } catch (error) {
            // Silent fail - local logging is primary
        }
    },

    trackLoginAttempt(email) {
        const attempts = JSON.parse(localStorage.getItem('login_attempts') || '[]');
        attempts.push({
            email,
            timestamp: new Date().toISOString(),
            ip: this.getClientIP()
        });
        
        // Keep only last hour's attempts
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const recentAttempts = attempts.filter(a => new Date(a.timestamp) > oneHourAgo);
        
        localStorage.setItem('login_attempts', JSON.stringify(recentAttempts));
        
        // Check for brute force (more than 5 attempts in last hour)
        const sameEmailAttempts = recentAttempts.filter(a => a.email === email);
        if (sameEmailAttempts.length > 5) {
            this.logSecurityEvent('brute_force_detected', { email, attempts: sameEmailAttempts.length });
            throw new Error('Too many login attempts. Please try again later.');
        }
    },

    // ============================
    // HTTP UTILITIES
    // ============================
    getAuthHeaders() {
        const token = this.getToken();
        if (!token) {
            throw new Error('No authentication token available');
        }
        
        return {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            'X-Client-Version': this.config.version,
            'X-User-Role': this.getUserRole()
        };
    },

    async authFetch(url, options = {}) {
        if (!this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        const headers = {
            ...this.getAuthHeaders(),
            ...options.headers
        };

        try {
            const response = await fetch(url, { ...options, headers });
            
            // Handle token expiry
            if (response.status === 401) {
                try {
                    await this.refreshToken();
                    headers.Authorization = `Bearer ${this.getToken()}`;
                    return await fetch(url, { ...options, headers });
                } catch (refreshError) {
                    await this.logout(false, 'token_expired');
                    throw new Error('Session expired. Please login again.');
                }
            }

            return response;
            
        } catch (error) {
            console.error('❌ Auth fetch error:', error);
            throw error;
        }
    },

    // ============================
    // UTILITY FUNCTIONS
    // ============================
    getClientPlatform() {
        const ua = navigator.userAgent;
        if (/mobile/i.test(ua)) return 'mobile';
        if (/tablet/i.test(ua)) return 'tablet';
        return 'desktop';
    },

    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch {
            return 'unknown';
        }
    },

    enhanceErrorMessage(error) {
        const errorMap = {
            'Failed to fetch': 'Cannot connect to the server. Please check your connection.',
            'Network request failed': 'Network error. Please check your internet connection.',
            'Invalid email or password': 'The email or password you entered is incorrect.',
            '401': 'Invalid email or password.',
            '429': 'Too many attempts. Please try again in a few minutes.',
            '500': 'Server error. Please try again later.'
        };

        for (const [key, message] of Object.entries(errorMap)) {
            if (error.message.includes(key) || error.toString().includes(key)) {
                return new Error(message);
            }
        }

        return error;
    },

    handleLoginError(status, data) {
        switch (status) {
            case 400:
                throw new Error(data.error || 'Invalid request');
            case 401:
                throw new Error('Invalid email or password');
            case 403:
                throw new Error('Account disabled or access denied');
            case 429:
                throw new Error('Too many login attempts. Try again later.');
            case 500:
                throw new Error('Server error. Please try again later.');
            default:
                throw new Error(data.error || 'Login failed');
        }
    },

    updateSession(data) {
        localStorage.setItem('session_data', JSON.stringify({
            ...JSON.parse(localStorage.getItem('session_data') || '{}'),
            ...data,
            lastUpdated: new Date().toISOString()
        }));
    },

    // ============================
    // UI HELPERS
    // ============================
    showToast(message, type = 'info', duration = 3000) {
        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Remove after duration
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, duration);
    },

    redirectBasedOnRole() {
        const role = this.getUserRole();
        const permissions = this.getUserPermissions();
        
        // Check if user has access to analytics
        if (this.hasAnyRole(['admin', 'supervisor']) || permissions.includes('read:analytics')) {
            window.location.hash = 'analytics';
        } else {
            window.location.hash = 'dashboard';
        }
    },

    // ============================
    // EXPORT/IMPORT SESSION
    // ============================
    exportSession() {
        const session = {
            token: this.getToken(),
            user: this.getUser(),
            role: this.getUserRole(),
            expiry: localStorage.getItem('auth_expiry'),
            timestamp: new Date().toISOString()
        };
        
        return btoa(JSON.stringify(session));
    },

    importSession(encodedSession) {
        try {
            const session = JSON.parse(atob(encodedSession));
            
            // Validate session
            if (!session.token || !session.user || !session.expiry) {
                throw new Error('Invalid session data');
            }
            
            // Store session
            localStorage.setItem('auth_token', session.token);
            localStorage.setItem('auth_user', JSON.stringify(session.user));
            localStorage.setItem('auth_role', session.role);
            localStorage.setItem('auth_expiry', session.expiry);
            
            this.startAutoRefresh();
            this.logSecurityEvent('session_imported');
            
            return true;
            
        } catch (error) {
            console.error('❌ Session import failed:', error);
            this.logSecurityEvent('session_import_failed', { error: error.message });
            return false;
        }
    }
};

// Initialize on load
window.addEventListener('DOMContentLoaded', () => {
    authService.init();
});

// Make available globally
window.authService = authService;

// Helper function (to be imported from helpers.js)
function showAlert(message, type = 'info', duration = 3000) {
    if (window.showAlert) {
        window.showAlert(message, type, duration);
    } else {
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}