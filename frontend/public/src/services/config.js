/**
 * NetisTrackGh Frontend Config
 * Centralized configuration for API base URL and client metadata.
 * Allows runtime override via window.ENV.API_BASE_URL.
 */

export const API_BASE_URL =
  (typeof window !== 'undefined' && window.ENV && window.ENV.API_BASE_URL) ||
  'http://localhost:3000/api';

export const CLIENT_VERSION = 'frontend-2.0.0';
export const CLIENT_PLATFORM = 'web';
