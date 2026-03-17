const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

const app = express();

app.use(helmet({
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
}));


app.use(cors());

// CORS allowlist enforcement
const envOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN
      .split(',')
      .map(o => o.trim())
      .filter(Boolean)
  : [];

const ALLOWED_ORIGINS = [
  // Production
  'https://netistrackgh.auralenx.com',
  'https://netistrackghbackend.auralenx.com',
  'https://netistrackgh.vercel.app',
  'https://netistrackgh-frontend.vercel.app',

  // Local dev
  'http://localhost:3000',
  'http://localhost:8000',
  'http://127.0.0.1:5500',
  'http://127.0.0.1:3000',

  // Any extra origins from .env
  ...envOrigins,
].filter(Boolean);

// Remove duplicates
const UNIQUE_ORIGINS = [...new Set(ALLOWED_ORIGINS)];

app.use((req, res, next) => {
  const origin = req.headers.origin;

  // Allow server-to-server / same-origin requests (no origin header)
  if (!origin) {
    return next();
  }

  if (UNIQUE_ORIGINS.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,PATCH,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization,X-Requested-With,X-Client-Version,X-Client-Platform');

    if (req.method === 'OPTIONS') {
      return res.sendStatus(204);
    }

    return next();
  }

  console.warn(`[CORS] Blocked request from origin: ${origin}`);
  return res.status(403).json({
    error: 'CORS: origin not allowed',
    code: 'CORS_ORIGIN_DENIED',
    origin
  });
});

// ============================================
// RATE LIMITING
// ============================================
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max:       parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message:   { error: 'Too many requests', code: 'RATE_LIMIT_EXCEEDED' },
  standardHeaders: true,
  legacyHeaders:   false,
  // Required for Vercel — use memory store (default), skip if undefined IP
  skip: (req) => !req.ip,
});

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
if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
  app.set('trust proxy', 1);
}

// Optional: serve dashboard UI from backend/public (local/self-host only)
if (process.env.SERVE_DASHBOARD === 'true') {
  app.use(express.static(path.join(__dirname, 'public')));

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

// Simple health check (lightweight, no Firebase dependency)
app.get('/api/health', (req, res) => {
  res.status(200).json({ 
    status: 'healthy',
    message: 'Backend is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

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
    deployment: process.env.VERCEL ? 'vercel' : 'self-hosted',
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
      dashboard: process.env.SERVE_DASHBOARD === 'true' ? '/' : null,
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
    deployment: process.env.VERCEL ? 'vercel' : 'self-hosted',
    uptime: process.uptime(),
    memory: process.memoryUsage()
  });
});

// Import routes
const authRoutes = require('./src/routes/authRoutes');
const siteRoutes = require('./src/routes/siteRoutes');
const fuelRoutes = require('./src/routes/fuelRoutes');
const maintenanceRoutes = require('./src/routes/maintenanceRoutes');
const syncRoutes        = require('./src/routes/syncRoutes');

app.use('/api/auth',        authRoutes);
app.use('/api/sites',       siteRoutes);
app.use('/api/fuel',        fuelRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/sync',        syncRoutes);

app.get('/api', (req, res) => {
  res.json({
    message:       'Welcome to NetisTrackGh Backend API',
    version:       '1.0.0',
    documentation: '/docs',
    status: '/health',
    apiStatus: '/api/status',
    dashboard: process.env.SERVE_DASHBOARD === 'true' ? '/' : null,
    environment: process.env.NODE_ENV || 'development',
    deployment: process.env.VERCEL ? 'vercel' : 'self-hosted'
  });
});

// Optional: dashboard fallback for local/self-hosted SPA
if (process.env.SERVE_DASHBOARD === 'true') {
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

// Export the app for serverless runtimes (e.g., Vercel)
module.exports = app;

// Only start the server when running directly (local/self-hosted)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`
🚀 NetisTrackGh Backend Started
📍 Local:   http://localhost:${PORT}
📚 Docs:    http://localhost:${PORT}/docs
❤️  Health:  http://localhost:${PORT}/health
📊 Status:  http://localhost:${PORT}/api/status
    `);
  });
}