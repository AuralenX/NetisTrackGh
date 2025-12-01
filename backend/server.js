const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Swagger setup
const { swaggerUi, specs } = require('./src/config/swagger');

const app = express();

// Security Middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
      scriptSrc: ["'self'", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https:"]
    }
  }
}));
// app.use(cors());
app.use(cors({
  origin: function (origin, callback) {
    callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowedHeaders: '*'
}));

// Rate Limiting - Stricter in production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || (process.env.NODE_ENV === 'production' ? 15 * 60 * 1000 : 1 * 60 * 1000), // 15min prod, 1min dev
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || (process.env.NODE_ENV === 'production' ? 100 : 1000), // Stricter in production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(limiter);

// Body Parsing Middleware
app.use(express.json({
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb'
}));
// app.use(express.json({ 
//   limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb', // Smaller limit in production
//   verify: (req, res, buf) => {
//     try {
//       JSON.parse(buf);
//     } catch (e) {
//       res.status(400).json({
//         error: 'Invalid JSON in request body',
//         code: 'INVALID_JSON'
//       });
//       throw new Error('Invalid JSON');
//     }
//   }
// }));
app.use(express.urlencoded({ 
  extended: true,
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb'
}));

// Trust proxy in production (for rate limiting behind reverse proxy)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Static files (for uploaded images, documents, etc.)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Swagger Documentation - Serve at /docs
app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs, {
  explorer: true,
  customCss: `
    .swagger-ui .topbar { display: none }
    .swagger-ui .info .title { color: #2563eb; }
    .swagger-ui .btn.authorize { background-color: #2563eb; }
    .swagger-ui .scheme-container { background: #f8fafc; }
  `,
  customSiteTitle: 'NetisTrackGh API Documentation',
  swaggerOptions: {
    persistAuthorization: true,
    docExpansion: 'none',
    filter: true,
    displayRequestDuration: true,
    defaultModelsExpandDepth: 2,
    defaultModelExpandDepth: 2
  }
}));

// API Status Endpoint (Public)
app.get('/api/status', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'operational',
    service: 'NetisTrackGh Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: {
      hours: Math.floor(uptime / 3600),
      minutes: Math.floor((uptime % 3600) / 60),
      seconds: Math.floor(uptime % 60)
    },
    memory: {
      rss: `${Math.round(memoryUsage.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)} MB`
    },
    endpoints: {
      auth: '/api/auth',
      sites: '/api/sites',
      fuel: '/api/fuel',
      maintenance: '/api/maintenance',
      sync: '/api/sync',
      docs: '/docs'
    }
  });
});

// Health Check (Public)
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const siteRoutes = require('./src/routes/siteRoutes');
const fuelRoutes = require('./src/routes/fuelRoutes');
const maintenanceRoutes = require('./src/routes/maintenanceRoutes');
const syncRoutes = require('./src/routes/syncRoutes');

// API Routes (Protected)
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/sync', syncRoutes);

// Welcome route (Public)
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to NetisTrackGh Backend API',
    version: '1.0.0',
    documentation: '/docs',
    status: '/health',
    apiStatus: '/api/status',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error Handling Middleware
const { errorHandler } = require('./src/utils/errorHandler');
app.use(errorHandler);

// 404 Handler - MUST be after all routes
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method,
    availableEndpoints: {
      docs: '/docs',
      health: '/health',
      status: '/api/status',
      auth: '/api/auth',
      sites: '/api/sites',
      fuel: '/api/fuel',
      maintenance: '/api/maintenance',
      sync: '/api/sync'
    }
  });
});

// Global error handler for unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 Unhandled Promise Rejection at:', promise, 'reason:', reason);
  
  // In production, exit the process with failure
  if (process.env.NODE_ENV === 'production') {
    console.error('💥 Unhandled Promise Rejection in production. Exiting process...');
    process.exit(1);
  } else {
    console.warn('⚠️ Unhandled Promise Rejection detected but continuing in development mode');
  }
});

process.on('uncaughtException', (error) => {
  console.error('🚨 Uncaught Exception thrown:', error);
  
  // Log additional error details for debugging
  console.error('Stack trace:', error.stack);
  
  // In production, exit the process with failure after logging
  if (process.env.NODE_ENV === 'production') {
    console.error('💥 Uncaught Exception in production. Exiting process...');
    
    // Give some time for logs to be written
    setTimeout(() => {
      process.exit(1);
    }, 1000);
  } else {
    console.warn('⚠️ Uncaught Exception detected but continuing in development mode');
  }
});

const PORT = process.env.PORT || 3000;

// Start server
const server = app.listen(PORT, () => {
  const isProduction = process.env.NODE_ENV === 'production';
  
  console.log(`
🚀 NetisTrackGh Backend Server Started!
📊 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Server running on port: ${PORT}
📍 Local: http://localhost:${PORT}
${isProduction ? '🌐 Production: [Your Production URL]' : '🌐 Network: http://0.0.0.0:' + PORT}

📚 API Documentation: http://localhost:${PORT}/docs
❤️  Health Check: http://localhost:${PORT}/health
📡 API Status: http://localhost:${PORT}/api/status

Available API Endpoints:
✅ Authentication: http://localhost:${PORT}/api/auth
✅ Sites: http://localhost:${PORT}/api/sites  
✅ Fuel: http://localhost:${PORT}/api/fuel
✅ Maintenance: http://localhost:${PORT}/api/maintenance
✅ Sync: http://localhost:${PORT}/api/sync

${isProduction ? '🔒 Production Mode: Security features enabled' : '🐛 Development Mode: Debug features enabled'}
  `);
});

// Graceful shutdown
const gracefulShutdown = (signal) => {
  console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
  
  server.close(() => {
    console.log('✅ HTTP server closed.');
    
    // Close database connections or other resources here if needed
    
    process.exit(0);
  });

  // Force close after 10 seconds
  setTimeout(() => {
    console.error('❌ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = app;