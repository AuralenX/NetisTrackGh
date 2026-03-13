/**
 * NetisTrackGh Frontend Config
 * Centralized configuration for API base URL and client metadata.
 * Supports both local development and production environments.
 */

// Detect environment
const isLocalhost = window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';

// Set API base URL based on environment
let API_BASE_URL;

if (isLocalhost) {
  // Local development
  API_BASE_URL = 'http://localhost:3000/api';
  console.log('🔧 Using LOCAL backend:', API_BASE_URL);
} else {
  // Production - use custom domain or Vercel URL
  API_BASE_URL = 'https://netistrackghbackend.auralenx.com/api';
  console.log('🌐 Using PRODUCTION backend:', API_BASE_URL);
}

// Allow runtime override via window.ENV
if (window.ENV && window.ENV.API_BASE_URL) {
  API_BASE_URL = window.ENV.API_BASE_URL;
  console.log('⚙️ Using CUSTOM backend URL:', API_BASE_URL);
}

// Export configuration
export { API_BASE_URL };
export const CLIENT_VERSION = 'frontend-1.0.0';
export const CLIENT_PLATFORM = 'web';

// Debug log
console.log('📋 Frontend Configuration:', {
  API_BASE_URL,
  CLIENT_VERSION,
  CLIENT_PLATFORM,
  environment: isLocalhost ? 'local' : 'production',
  hostname: window.location.hostname
});
