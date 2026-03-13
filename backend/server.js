const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Swagger setup
const { swaggerUi, specs } = require('./src/config/swagger');

const app = express();

// ============================================
// MODIFIED: Helmet configuration for Netlify
// ============================================
const helmetConfig = process.env.NETLIFY === 'true' ? 
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: false // Disable CSP in Netlify, handled by functions/server.js
  }) : 
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com"],
        imgSrc: ["'self'", "data:", "https:"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com", "data:"],
        connectSrc: ["'self'"]
      }
    }
  });

app.use(helmetConfig);

// const envOrigins = process.env.ALLOWED_ORIGIN
//   ? process.env.ALLOWED_ORIGIN
//       .split(',')
//       .map(o => o.trim())
//       .filter(Boolean)
//   : [];

//   const ALLOWED_ORIGINS = [
//   // Production
//   'https://netistrackgh.auralenx.com',
//   'https://netistrackgh.vercel.app',
 
//   // Local dev
//   'http://localhost:3000',
//   'http://localhost:5173',
//   'http://localhost:8000',
//   'http://localhost:8888',
//   'http://127.0.0.1:5500',
//   'http://127.0.0.1:3000',
 
//   // Any extra origins from .env
//   ...envOrigins,
// ].filter(Boolean);

// // Remove duplicates
// const UNIQUE_ORIGINS = [...new Set(ALLOWED_ORIGINS)];
 
// app.use(cors({
//   origin: function (origin, callback) {
//     // Allow server-to-server / same-origin requests (no origin header)
//     if (!origin) return callback(null, true);
 
//     if (UNIQUE_ORIGINS.includes(origin)) {
//       callback(null, true);
//     } else {
//       console.warn(`[CORS] Blocked request from origin: ${origin}`);
//       callback(new Error(`CORS: origin ${origin} not allowed`));
//     }
//   },
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
//   allowedHeaders: [
//     'Content-Type',
//     'Authorization',
//     'X-Requested-With',
//     'X-Client-Version',
//     'X-Client-Platform'
//   ],
//   maxAge: 600,
// }));
 
// // Explicitly handle preflight for all routes
// app.options('*', cors());

app.use(cors());

// Rate Limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    code: 'RATE_LIMIT_EXCEEDED'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Apply rate limiting only to API routes
app.use('/api/', limiter);

// Body Parsing Middleware
app.use(express.json({
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb'
}));

app.use(express.urlencoded({ 
  extended: true,
  limit: process.env.NODE_ENV === 'production' ? '1mb' : '10mb'
}));

// Trust proxy in production
if (process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true') {
  app.set('trust proxy', 1);
}

// ============================================
// MODIFIED: Serve static files conditionally
// ============================================
if (process.env.NETLIFY !== 'true') {
  app.use(express.static(path.join(__dirname, 'public')));
  
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });

  app.get('/icon.png', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'icon.png'));
  });
}

// Static files for uploads
app.use('/uploads', express.static(path.join(__dirname, 'upload')));

// Swagger Documentation
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

// API Status Endpoint
app.get('/api/status', (req, res) => {
  const uptime = process.uptime();
  const memoryUsage = process.memoryUsage();
  
  res.json({
    status: 'operational',
    service: 'NetisTrackGh Backend API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    deployment: process.env.NETLIFY ? 'netlify' : 'self-hosted',
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
      dashboard: process.env.NETLIFY ? 'https://' + process.env.URL : '/',
      docs: '/docs',
      health: '/health',
      apiStatus: '/api/status',
      auth: '/api/auth',
      sites: '/api/sites',
      fuel: '/api/fuel',
      maintenance: '/api/maintenance',
      sync: '/api/sync'
    }
  });
});

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    deployment: process.env.NETLIFY ? 'netlify' : 'self-hosted',
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

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/sites', siteRoutes);
app.use('/api/fuel', fuelRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/sync', syncRoutes);

// API Welcome route
app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to NetisTrackGh Backend API',
    version: '1.0.0',
    documentation: '/docs',
    status: '/health',
    apiStatus: '/api/status',
    dashboard: process.env.NETLIFY ? 'https://' + process.env.URL : '/',
    environment: process.env.NODE_ENV || 'development',
    deployment: process.env.NETLIFY ? 'netlify' : 'self-hosted'
  });
});

// Only add catch-all route when NOT on Netlify
if (process.env.NETLIFY !== 'true') {
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/') || 
        req.path.startsWith('/docs') || 
        req.path.startsWith('/health') ||
        req.path.startsWith('/uploads')) {
      return res.status(404).json({
        error: 'Route not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: {
          dashboard: '/',
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
    }
    
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  });
}

// Error Handling Middleware
const { errorHandler } = require('./src/utils/errorHandler');
app.use(errorHandler);

// Export the app for Netlify Functions
module.exports = app;

// Only start the server when NOT in Netlify environment
if (process.env.NETLIFY !== 'true' && require.main === module) {
  const PORT = process.env.PORT || 3000;
  
  const server = app.listen(PORT, () => {
    const isProduction = process.env.NODE_ENV === 'production';
    
    console.log(`
🚀 NetisTrackGh Backend & Dashboard Server Started!
📊 Environment: ${process.env.NODE_ENV || 'development'}
🔗 Server running on port: ${PORT}
📍 Local Dashboard: http://localhost:${PORT}
📍 API Documentation: http://localhost:${PORT}/docs

📊 DASHBOARD ENDPOINTS:
✅ Dashboard: http://localhost:${PORT}/
✅ API Status: http://localhost:${PORT}/api/status
✅ Health Check: http://localhost:${PORT}/health

🔧 API ENDPOINTS:
✅ Authentication: http://localhost:${PORT}/api/auth
✅ Sites: http://localhost:${PORT}/api/sites  
✅ Fuel: http://localhost:${PORT}/api/fuel
✅ Maintenance: http://localhost:${PORT}/api/maintenance
✅ Sync: http://localhost:${PORT}/api/sync

📚 Documentation: http://localhost:${PORT}/docs

${isProduction ? '🔒 Production Mode: Security features enabled' : '🐛 Development Mode: Debug features enabled'}
    `);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal) => {
    console.log(`\n🛑 Received ${signal}, closing server gracefully...`);
    server.close(() => {
      console.log('✅ HTTP server closed.');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('❌ Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
}