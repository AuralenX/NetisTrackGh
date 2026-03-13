const serverless = require('serverless-http');
const app = require('../server');

// Add health check before wrapping with serverless
app.get('/__health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: 'vercel'
  });
});

// Add root health endpoint
app.get('/', (req, res) => {
  res.status(200).json({ 
    message: 'NetisTrackGh Backend API',
    status: 'running',
    version: '1.0.0',
    docs: '/docs',
    status_endpoint: '/api/status'
  });
});

// Wrap with serverless-http for Vercel
module.exports = serverless(app);
