const serverless = require('serverless-http');
const path = require('path');

// Error handling: Attempt to load the Express app
let app;
try {
  app = require('../server');
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Serverless] ✅ Express app loaded successfully');
  }
} catch (error) {
  console.error('[Serverless] ❌ CRITICAL: Failed to load Express app', error.message);
  
  // Fallback: Create minimal app to prevent Vercel crash
  const express = require('express');
  app = express();
  app.use((req, res) => {
    res.status(503).json({
      error: 'Backend unavailable',
      message: 'Failed to initialize application server',
      timestamp: new Date().toISOString()
    });
  });
}

// Wrap with serverless-http for Vercel
// Binary handling ensures static assets are served correctly
module.exports = serverless(app, {
  binary: ['image/*', 'font/*', 'application/*+json'],
  provider: 'aws'
});
