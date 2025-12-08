const serverless = require('serverless-http');
const express = require('express');
const path = require('path');

// Create a new Express app for Netlify Functions
const netlifyApp = express();

// Import your main app
const mainApp = require('../server'); // Your original Express app

// ============================================
// CRITICAL FIX: Override Helmet CSP for Netlify
// ============================================

// Remove Helmet's default CSP from the main app
mainApp.disable('x-powered-by');

// Create a custom middleware to replace Helmet's CSP
const customSecurityHeaders = (req, res, next) => {
  // Set security headers without breaking Font Awesome
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // PERMISSIVE CSP for Netlify Functions
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self' https://netlify.app https://*.netlify.app;" +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com;" +
    "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://fonts.googleapis.com;" +
    "font-src 'self' https://cdnjs.cloudflare.com https://fonts.gstatic.com data:;" +
    "img-src 'self' data: https: blob:;" +
    "connect-src 'self' https://*.netlify.app https://cdnjs.cloudflare.com;" +
    "frame-src 'self';" +
    "object-src 'none';" +
    "base-uri 'self';" +
    "form-action 'self';"
  );
  
  next();
};

// Apply custom security headers
netlifyApp.use(customSecurityHeaders);

// ============================================
// Serve Static Files for Netlify Functions
// ============================================

// First, mount your API routes
netlifyApp.use('/api', mainApp);

// Serve static files from public directory
netlifyApp.use(express.static(path.join(__dirname, '../public')));

// Serve index.html for all non-API routes
netlifyApp.get('*', (req, res, next) => {
  // Don't interfere with API routes
  if (req.path.startsWith('/api') || 
      req.path.startsWith('/docs') || 
      req.path.startsWith('/health') ||
      req.path.startsWith('/uploads')) {
    return next();
  }
  
  // Serve the dashboard
  res.sendFile(path.join(__dirname, '../public', 'index.html'));
  res.sendFile(path.join(__dirname, '../public', 'icon.png'));
});

// Error handler for Netlify
netlifyApp.use((err, req, res, next) => {
  console.error('Netlify Function Error:', err);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Export for Netlify Functions
exports.handler = serverless(netlifyApp);