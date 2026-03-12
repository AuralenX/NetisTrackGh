const serverless = require('serverless-http');
const app = require('../server');

// Export for Vercel
module.exports = serverless(app);
